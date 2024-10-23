import { queryCycle } from './cycle';

export const convertUuidToCycleDocId = (uuid: string) => btoa(`Doc_${uuid}`);

export type Doc = {
  id: string;
  title: string;
};
export type DocWithCustomer = Doc & {
  customer: {
    id: string;
    name: string;
    email: string;
    company: {
      id: string;
      name: string;
    };
  };
};
export type DocWithSourceDoc = Doc & {
  docSource: {
    id: string;
    doc: DocWithCustomer;
  };
};

export type DocWithPaginatedChildren = Doc & {
  children: {
    count: number;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
      __typename: string;
    };
    edges: {
      cursor: string;
      node: DocWithSourceDoc;
    }[];
  };
};

type DocWithAttributes = Doc & {
  attributes: {
    edges: {
      node: {
        __typename: string;
        id: string;
        name: string;
        definition: {
          id: string;
          name: string;
        };
        checkboxValue?: {
          id: string;
          value: boolean;
        };
        singleSelectValue?: {
          id: string;
          value: string;
        };
      };
    }[];
  };
};

type DocWithDocType = Doc & {
  doctype: {
    id: string;
    name: string;
  };
};

type QueryCreateDocResponse = {
  data: {
    addNewDoc: Doc;
  };
};

export const createDoc = async ({
  workspaceId,
  title,
  doctypeId,
  attributes,
  contentJSON,
  customerId,
  docSourceId,
  parentId,
}: {
  workspaceId: string;
  title: string;
  doctypeId: string;
  attributes: {
    attributeDefinitionId: string;
    value: {
      checkbox: boolean;
    };
  }[];
  contentJSON?: any;
  customerId?: string;
  docSourceId?: string;
  parentId?: string;
}): Promise<Doc | null> => {
  const query = `
    mutation AddNewDoc(
      $title: DefaultString!
      $doctypeId: ID!
      $productId: ID!
      $attributes: [AddNewDocAttributeValue!]
      $contentJSON: JSON
      $customer: CustomerInput
      $docLink: DocLinkInput
      $parentId: ID
    ) {
      addNewDoc(
        title: $title
        doctypeId: $doctypeId
        productId: $productId
        attributes: $attributes
        contentJSON: $contentJSON
        customer: $customer
        docLink: $docLink
        parentId: $parentId
      ) {
        id
        title
      }
    }
  `;
  const variables = {
    title,
    doctypeId,
    productId: workspaceId,
    attributes,
    contentJSON,
    customer: customerId ? { id: customerId } : undefined,
    docLink: docSourceId
      ? { blockId: '', content: '', sourceId: docSourceId }
      : undefined,
    parentId,
  };
  const response = await queryCycle<QueryCreateDocResponse>({
    query,
    variables,
  });
  console.log('response', response);
  if (response?.data?.addNewDoc) {
    return response?.data?.addNewDoc || null;
  } else {
    console.group();
    console.log('Variables:', JSON.stringify(variables));
    console.log('Responses:', JSON.stringify(response));
    console.groupEnd();
    process.exit();
  }
};

type QueryCreateFeedbackResponse = {
  data: {
    createFeedback: DocWithCustomer;
  };
};

export const createFeedback = async ({
  workspaceId,
  title,
  attributes,
  companyName,
  customerEmail,
  sourceUrl,
  content,
}: {
  workspaceId: string;
  title: string;
  attributes: {
    attributeDefinitionId: string;
    value: {
      checkbox: boolean;
    };
  }[];
  companyName?: string;
  customerEmail?: string;
  sourceUrl: string;
  content: string;
}) => {
  const query = `
  mutation createFeedback(
    $workspaceId: ID!
    $title: DefaultString!
    $company: CompanyInput
    $customerEmail: EmailAddress
    $source: String!
    $content: DefaultString
    $attributes: [AddNewDocAttributeValue!]
  ) {
    createFeedback(
      productId: $workspaceId
      title: $title
      company: $company
      customer: $customerEmail
      source: $source
      contentHTML: $content
      attributes: $attributes
    ) {
      id
      title
      customer {
        id
        name
        email
        company {
          id
          name
        }
      }
    }
  }
`;
  const variables = {
    workspaceId,
    title,
    company: companyName ? { name: companyName } : undefined,
    customerEmail: companyName ? undefined : customerEmail,
    source: { sourceWeb: { url: sourceUrl } },
    content,
    attributes,
  };

  const response = await queryCycle<QueryCreateFeedbackResponse>({
    query,
    variables,
  });
  return response?.data?.createFeedback || null;
};

export const createInsight = async ({
  workspaceId,
  title,
  attributes,
  companyName,
  customerEmail,
  sourceUrl,
  content,
}: {
  workspaceId: string;
  title: string;
  attributes: {
    attributeDefinitionId: string;
    value: {
      checkbox: boolean;
    };
  }[];
  companyName?: string;
  customerEmail?: string;
  sourceUrl: string;
  content: string;
}) => {
  const query = `
  mutation createInsight(
    $workspaceId: ID!
    $title: DefaultString!
    $company: CompanyInput
    $customerEmail: EmailAddress
    $sourceUrl: String!
    $content: DefaultString
    $attributes: [AddNewDocAttributeValue!]
  ) {
    createFeedback(
      productId: $workspaceId
      title: $title
      company: $company
      customer: $customerEmail
      source: { sourceWeb: { url: $sourceUrl } }
      contentHTML: $content
      attributes: $attributes
    ) {
      id
      title
    }
  }
`;
  const variables = {
    workspaceId,
    title,
    company: companyName ? { name: companyName } : undefined,
    customerEmail: companyName ? undefined : customerEmail,
    sourceUrl,
    content,
    attributes,
  };

  const response = await queryCycle<QueryCreateFeedbackResponse>({
    query,
    variables,
  });
  return response?.data.createFeedback.id;
};

type QueryReadDocIdResponse = {
  data: {
    node: DocWithDocType;
  };
};

export const readDocById = async ({ docId }: { docId: string }) => {
  const query = `
    query fetchDoc($docId: ID!) {
      node(id: $docId) {
        ... on Doc {
          id
          title
          doctype {
            id
            name
          }
        }
      }
    }
`;
  const variables = {
    docId,
  };
  const response = await queryCycle<QueryReadDocIdResponse>({
    query,
    variables,
  });
  return response?.data?.node || null;
};

type QueryReadDocWithCustomerByIdResponse = {
  data: {
    node: DocWithCustomer;
  };
};

export const readDocWithCustomerById = async ({ docId }: { docId: string }) => {
  const query = `
    query fetchDoc($docId: ID!) {
      node(id: $docId) {
        ... on Doc {
          id
          title
          customer {
            id
            email
            name
            company {
              id
              name
            }
          }
        }
      }
    }
`;
  const variables = {
    docId,
  };
  const response = await queryCycle<QueryReadDocWithCustomerByIdResponse>({
    query,
    variables,
  });
  return response?.data?.node || null;
};

type QueryReadDocChildrenResponse = {
  data: {
    node: DocWithPaginatedChildren;
  };
};

export const readDocChildrenWithSource = async ({
  docId,
  childrenDocTypeId,
  cursor,
}: {
  docId: string;
  childrenDocTypeId?: string;
  cursor?: string;
}) => {
  const query = `
  query fetchDoc(
    $docId: ID!
    $doctypeId: ID!
    $size: Int!
    $cursor: String!
  ) {
    node(id: $docId) {
      ... on Doc {
        id
        title
        children(
          pagination: {
            size: $size, 
            where: {
              cursor: $cursor,
              direction: AFTER
            }
          },
          doctypeId: $doctypeId
        ) {
          count
          pageInfo {
            hasNextPage
            endCursor
            __typename
          }
          edges {
            cursor
            node {
              id
              title
              docSource {
                id
                doc {
                  id
                  title
                  customer {
                    id
                    email
                    name
                    company {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
  const variables = {
    docId,
    doctypeId: childrenDocTypeId,
    size: 30,
    cursor: cursor || '',
  };
  const response = await queryCycle<QueryReadDocChildrenResponse>({
    query,
    variables,
  });

  return response?.data?.node || null;
};

type QueryReadDocWithCustomerByDocTargetResponse = {
  data: {
    node: Doc & {
      docSource: {
        id: string;
        doc: DocWithCustomer;
      };
    };
  };
};

export const readDocWithCustomerByDocTargetId = async ({
  docId,
}: {
  docId: string;
}) => {
  const query = `
    query fetchDoc($docId: ID!) {
      node(id: $docId) {
        ... on Doc {
          id
          title
          docSource {
            id
            doc {
              id
              title
              customer {
                id
                email
                name
                company {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
`;
  const variables = {
    docId,
  };
  const response =
    await queryCycle<QueryReadDocWithCustomerByDocTargetResponse>({
      query,
      variables,
    });
  return response?.data?.node || null;
};

type QueryReadDocWithAttributesByIdResponse = {
  data: {
    node: DocWithAttributes;
  };
};

export const readDocWithAttributesById = async ({
  docId,
}: {
  docId: string;
}) => {
  const query = `
    query fetchDoc($docId: ID!) {
      node(id: $docId) {
        ... on Doc {
          id
          title
          attributes {
            edges {
              node {
                __typename
                ... on DocAttributeCheckbox {
                  id
                  checkboxValue: value {
                    id
                    value
                  }
                  definition {
                    id
                    name
                  }
                }
                ... on DocAttributeSingleSelect {
                  id
                  singleSelectValue: value {
                    id
                    value
                  }
                  definition {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
`;
  const variables = {
    docId,
  };
  const response = await queryCycle<QueryReadDocWithAttributesByIdResponse>({
    query,
    variables,
  });
  return response?.data?.node || null;
};

type QueryUpdateDocCustomerResponse = {
  data: {
    updateDocCustomer: DocWithCustomer;
  };
};

export const updateDocCustomer = async ({
  docId,
  customerId,
}: {
  docId: string;
  customerId: string;
}) => {
  const query = `
    mutation UpdateDocCustomer(
      $docId: ID!,
      $customerId: ID
    ) {
      updateDocCustomer(
        docId: $docId, 
        customerId: $customerId
      ) {
        id
        title
        customer {
          id
          name
          email
          company {
            id
            name
          }
        }
      }
    }
`;
  const variables = {
    docId,
    customerId,
  };
  const response = await queryCycle<QueryUpdateDocCustomerResponse>({
    query,
    variables,
  });
  return response?.data?.updateDocCustomer || null;
};

type QueryUpdateDocParentResponse = {
  data: {
    changeDocParent: Doc;
  };
};

export const updateDocParent = async ({
  docId,
  parentId,
}: {
  docId: string;
  parentId: string;
}) => {
  const query = `
    mutation UpdateDocParent(
      $docId: ID!,
      $parentId: ID
    ) {
      changeDocParent(
        docId: $docId, 
        parentId: $parentId
      ) {
        id
        title
      }
    }
`;
  const variables = {
    docId,
    parentId,
  };
  const response = await queryCycle<QueryUpdateDocParentResponse>({
    query,
    variables,
  });
  return response?.data?.changeDocParent || null;
};

type QueryGetCustomerByEmailResponse = {
  data: {
    searchDoc: {
      edges: {
        node: {
          doc: Doc;
        };
      }[];
    };
  };
};

export const getDocByKey = async ({
  searchText,
  workspaceId,
}: {
  searchText?: string;
  workspaceId: string;
}) => {
  const query = `
    query getDocByKey(
      $workspaceId: ID!, 
      $searchText: DefaultString
    ) {
      searchDoc(
        productId: $workspaceId,
        text: $searchText
      ) {
        edges {
          node {
            doc {
              id
              title
            }
          }
        }
      }
    }
`;
  const variables = {
    workspaceId,
    searchText,
  };
  const response = await queryCycle<QueryGetCustomerByEmailResponse>({
    query,
    variables,
  });
  if (response?.data?.searchDoc?.edges?.length) {
    return response?.data?.searchDoc.edges?.[0].node.doc;
  }
  return null;
};

type QueryUpdateDocContentResponse = {
  data: {
    updateDocContent: Doc;
  };
};

export const updateDocContent = async ({
  docId,
  contentHTML,
}: {
  docId: string;
  contentHTML: string;
}): Promise<Doc | null> => {
  const query = `
    mutation UpdateDocContent($docId: ID!, $contentHTML: DefaultString) {
      updateDocContent(docId: $docId, contentHTML: $contentHTML) {
        id
        title
      }
    }
  `;
  const variables = {
    docId,
    contentHTML,
  };
  const response = await queryCycle<QueryUpdateDocContentResponse>({
    query,
    variables,
  });
  return response?.data?.updateDocContent || null;
};
