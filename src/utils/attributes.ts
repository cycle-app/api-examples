import { queryCycle } from './cycle';

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
