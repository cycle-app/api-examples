import { queryCycle } from './cycle';

export type DocType = {
  id: string;
  name: string;
};

type QueryWorkspaceDocTypesResponse = {
  data: {
    node: {
      doctypes: {
        edges: {
          node: DocType;
        }[];
      };
    };
  };
};

export const fetchWorkspaceDocTypes = async ({
  workspaceId,
}: {
  workspaceId: string;
}): Promise<DocType[]> => {
  const query = `
    query product(
      $productId: ID!,
    ) {
      node(id: $productId) {
        ... on Product {
          doctypes {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  `;
  const variables = { productId: workspaceId };
  const response = await queryCycle<QueryWorkspaceDocTypesResponse>({
    query,
    variables,
  });
  return response?.data?.node?.doctypes?.edges?.map((edge) => edge.node) || [];
};

type MutationLinkAttributeToDocTypeResponse = {
  data: {
    addAttributeDefinitionDoctypeV2: {
      id: string;
    };
  };
};

export const linkAttributeToDocType = async ({
  attributeDefinitionId,
  doctypeId,
}: {
  attributeDefinitionId: string;
  doctypeId: string;
}): Promise<string | null> => {
  const query = `
    mutation AddDoctypeAttributeDefinition(
      $attributeDefinitionId: ID!
      $doctypeId: ID!
    ) {
      addAttributeDefinitionDoctypeV2(
        attributeDefinitionId: $attributeDefinitionId
        doctypeId: $doctypeId
      ) {
        ... on Node {
          id
        }
      }
    }
  `;
  const variables = {
    attributeDefinitionId,
    doctypeId,
  };
  const response = await queryCycle<MutationLinkAttributeToDocTypeResponse>({
    query,
    variables,
  });
  return response?.data?.addAttributeDefinitionDoctypeV2?.id || null;
};
