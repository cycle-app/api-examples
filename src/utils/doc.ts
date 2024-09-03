import { queryCycle } from './cycle';

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

type DocWithPaginatedChildren = Doc & {
  children: {
    count: number;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
      __typename: string;
    };
    edges: {
      cursor: string;
      node: Doc;
    }[];
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
  contentJSON: any;
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
    sourceUrl,
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
  return response.data.createFeedback.id;
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

export const readDocChildren = async ({
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

const a = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'test' }] }],
};
