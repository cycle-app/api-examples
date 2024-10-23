import { queryCycle } from './cycle';
import { formatDateAndTime } from './dates';

type CreateAttributeParams = {
  workspaceId: string;
  attributeName: string;
  attributeDescription?: string;
};

type QueryCreateAttributeResponse = {
  data: {
    addNewAttribute: {
      id: string;
      name: string;
      description: string;
    };
  };
};

export const createAttribute = async ({
  workspaceId,
  attributeName,
  attributeDescription,
}: CreateAttributeParams): Promise<{
  id: string;
  name: string;
  description: string;
} | null> => {
  const query = `
    mutation AddNewAttribute(
      $productId: ID!
      $name: DefaultString!
      $description: Description
    ) {
      addNewAttribute(input: {
        productId: $productId
        name: $name
        description: $description
        color: a
        type: { scalar: { type: BOOLEAN } }
      }) {
        ... on CustomAttributeDefinitionInterface {
          id
          name
          description
        }
      }
    }
  `;
  const variables = {
    productId: workspaceId,
    name: attributeName,
    description: attributeDescription,
  };

  const response = await queryCycle<QueryCreateAttributeResponse>({
    query,
    variables,
  });
  return response?.data?.addNewAttribute || null;
};

export const createImportAttribute = async (workspaceId: string) => {
  const [formattedDate, formattedTime] = formatDateAndTime(
    new Date(Date.now())
  );
  const attribute = await createAttribute({
    workspaceId,
    attributeName: `Imported on ${formattedDate} at ${formattedTime}`,
    attributeDescription: '',
  });
  return attribute;
};

type QueryFetchCheckboxAttributesResponse = {
  data: {
    node: {
      id: string;
      attributeDefinitions: {
        edges: {
          node: {
            __typename: string;
            id: string;
            name: string;
          };
        }[];
      };
    };
  };
};

export const fetchCheckboxAttributes = async ({
  workspaceId,
}: {
  workspaceId: string;
}) => {
  const query = `
    query readAttributes(
      $productId: ID!
    ) {
      node(id: $productId) {
        ... on Product {
          id
          attributeDefinitions {
            edges {
              node {
                __typename
                ... on AttributeCheckboxDefinition {
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
    productId: workspaceId,
  };

  const response = await queryCycle<QueryFetchCheckboxAttributesResponse>({
    query,
    variables,
  });

  return response?.data?.node || null;
};
