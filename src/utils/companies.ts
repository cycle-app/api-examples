import { queryCycle } from './cycle';

type QueryGetCompaniesResponse = {
  data:
    | {
        node: {
          __typename: string;
          companies: {
            pageInfo: {
              hasNextPage: boolean;
              endCursor: string;
              __typename: string;
            };
            edges: {
              node: {
                id: string;
                name: string;
                domain: string;
                isDefault: boolean;
                logo: string | null;
                arr: number | null;
                numberOfEmployees: number | null;
                zendeskId: string | null;
                hubspotId: string | null;
                intercomId: string | null;
                pipedriveId: string | null;
                snowflakeId: string | null;
                customId: string | null;
                attributes: {
                  edges: {
                    node:
                      | {
                          id: string;
                          definition: {
                            id: string;
                            __typename: string;
                          };
                          value: {
                            id: string;
                            valueNumber: number | null;
                          };
                        }
                      | {
                          id: string;
                          definition: {
                            id: string;
                            __typename: string;
                          };
                          value: {
                            id: string;
                            valueSelect: string | null;
                          };
                        }
                      | {
                          id: string;
                          definition: {
                            id: string;
                            __typename: string;
                          };
                          value: {
                            id: string;
                            valueCheckbox: boolean | null;
                          };
                        }
                      | {
                          id: string;
                          definition: {
                            id: string;
                            __typename: string;
                          };
                          value: {
                            id: string;
                            valueText: string | null;
                          };
                        };
                  }[];
                };
              };
            }[];
          };
        };
      }
    | {
        node: undefined;
        errors: [{ message: string; extensions: [any] }];
        data: { companies: null };
      };
};

export const getCompanies = async ({
  workspaceId,
  cursor = '',
}: {
  workspaceId: string;
  cursor?: string;
}) => {
  const query = `
    query getCompanies(
      $productId: ID!,
      $searchText: DefaultString,
      $size: Int!,
      $cursor: String!
    ) {
      node(id: $productId) {
        ... on Product {
          companies(
            searchText: $searchText
            pagination: {size: $size, where: {cursor: $cursor, direction: AFTER}}
          ) {
            pageInfo {
              hasNextPage
              endCursor
              __typename
            }
            edges {
              node {
                id
                name
                domain
                isDefault
                logo
                arr
                numberOfEmployees
                zendeskId
                hubspotId
                intercomId
                pipedriveId
                snowflakeId
                customId
                attributes(pagination: {size: 50}) {
                  edges {
                    node {
                      ... on CompanyAttributeNumber {
                      id
                        definition {
                          id
                          __typename
                        }
                        value {
                          id
                          valueNumber: value
                        }
                      }
                      ... on CompanyAttributeSingleSelect {
                        id
                        definition {
                          id
                          __typename
                        }
                        value {
                          id
                          valueSelect: value
                        }
                      }
                      ... on CompanyAttributeCheckbox {
                        id
                        definition {
                          id
                          __typename
                        }
                        value {
                          id
                          valueCheckbox: value
                        }
                      }
                      ... on CompanyAttributeText {
                        id
                        definition {
                          id
                          __typename
                        }
                        value {
                          id
                          valueText: value
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
    }
  `;

  const variables = {
    productId: workspaceId,
    searchText: '',
    size: 500,
    cursor,
  };
  const response = await queryCycle<QueryGetCompaniesResponse>({
    query,
    variables,
  });
  if (response?.data?.node) {
    return {
      nextCursor: response.data.node.companies.pageInfo.endCursor,
      data: response?.data?.node?.companies?.edges.map((e) => e.node) || [],
    };
  }
  return {
    nextCursor: undefined,
    data: [],
  };
};

type QueryUpdateCompanyAttributeResponse =
  | {
      data: {
        updateCompanyAttributeValue: {
          id: string;
          value: {
            value: string;
          };
        };
      };
    }
  | {
      errors: [{ message: string; extensions: [any] }];
      data: { updateCompanyAttributeValue: null };
    };

export const updateCompanyAttribute = async ({
  companyId,
  attributeDefinitionId,
  value,
}: {
  companyId: string;
  attributeDefinitionId: string;
  value: string;
}) => {
  const query = `
    mutation updateCompanyAttributeValue(
      $companyId: ID!, 
      $attributeDefinitionId: ID!, 
      $value: CompanyAttributeValueInput!
    ) {
      updateCompanyAttributeValue(
        companyId: $companyId,
        attributeDefinitionId: $attributeDefinitionId,
        value: $value
      ) {
        id
        value {
          ... on AttributeTextValue {
            value
          }
        }
      }
    }
  `;
  const variables = {
    companyId,
    attributeDefinitionId,
    value: { text: value },
  };
  const response = await queryCycle<QueryUpdateCompanyAttributeResponse>({
    query,
    variables,
  });
  return response?.data?.updateCompanyAttributeValue || null;
};

type QueryUpdateCompanyResponse =
  | {
      data: {
        updateCompany: {
          id: string;
        };
      };
    }
  | {
      errors: [{ message: string; extensions: [any] }];
      data: { updateCompany: null };
    };

export const updateCompany = async ({
  companyId,
  data,
}: {
  companyId: string;
  data: {
    name?: string;
    domain?: string;
    arr?: number;
    numberOfEmployees?: number;
  };
}) => {
  const query = `
    mutation updateCompany(
      $companyId: ID!,
      $name: String,
      $domain: String,
      $arr: Float,
      $numberOfEmployees: Int
    ) {
      updateCompany(
        id: $companyId,
        name: $name,
        domain: $domain,
        arr: $arr, 
        numberOfEmployees: $numberOfEmployees
      ) {
        id
      }
    }
  `;
  const variables = {
    companyId,
    ...data,
  };
  const response = await queryCycle<QueryUpdateCompanyResponse>({
    query,
    variables,
  });
  if (
    response?.data &&
    'updateCompany' in response.data &&
    response.data.updateCompany
  ) {
    return {
      data: response.data.updateCompany,
      debug: null,
    };
  } else {
    return {
      data: null,
      debug: { variables, response },
    };
  }
  // return response.data?.updateCompany || null;
};
