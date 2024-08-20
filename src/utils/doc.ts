import { queryCycle } from './cycle';

type Doc = {
  id: string;
  title: string;
};
type DocWithCustomerId = {
  id: string;
  title: string;
  customer: {
    id: string;
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
    createFeedback: DocWithCustomerId;
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
    node: {
      id: string;
      title: string;
      customer: {
        id: string;
        name: string;
        email: string;
      };
    };
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
