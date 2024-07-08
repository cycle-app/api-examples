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
  if (response?.data?.addNewDoc) {
    return response?.data?.addNewDoc || null;
  } else {
    console.log('--', JSON.stringify(variables));
    console.log('++', JSON.stringify(response));
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
  return response.data.createFeedback;
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

const a = {
  title: 'Appointment leads',
  doctypeId: 'RG9jdHlwZV8xN2RmNmVjMC1kODZmLTRhYWMtYTc3MC00Mjg3YTI4NjRjZWU=',
  productId: 'UHJvZHVjdF85YmZiODg3Yy1mMDM2LTQzYzktOTRkNS0zMzM5MGIxY2MwOTk=',
  attributes: [
    {
      attributeDefinitionId:
        'QXR0cmlidXRlQ2hlY2tib3hEZWZpbml0aW9uXzMxNTBlODcyLTY2OGItNDc1YS05NTRlLWVhYWEzZDMzMWVmNQ==',
      value: { checkbox: true },
    },
  ],
  contentJSON: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Post details' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: "Collect lead info for customers who don't complete an online booking.",
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    marks: [{ type: 'bold' }],
                    text: 'Category :',
                  },
                  { type: 'text', text: 'Online scheduling' },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Comments' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'From: ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'Cade' },
          { type: 'text', text: ' on 2024-04-30T17:03:15.469Z' },
        ],
      },
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
    ],
  },
};
