import { queryCycle } from './cycle';

export type Company = {
  id: string;
  name: string;
  customers?: {
    edges?: {
      node?: {
        id: string;
        name: string;
        email: string;
      };
    }[];
  };
};

export type CompanyWithAttributes = Company & {
  arr: number;
  numberOfEmployees: number;
  zendeskId: string;
  hubspotId: string;
  intercomId: string;
  pipedriveId: string;
  snowflakeId: string;
  customId: string;
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

export type CompanyWithAttributesAndCount = CompanyWithAttributes & {
  customers?: {
    count?: number;
  };
};

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
              node: CompanyWithAttributesAndCount;
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
  size = 50,
  search = '',
}: {
  workspaceId: string;
  cursor?: string;
  size?: number;
  search?: string;
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
                customers {
                    count
                }
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
    searchText: search,
    size,
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

type QueryCreateCompanyResponse = {
  data: {
    createCompany: CompanyWithAttributes;
  };
};

export const createCompany = async ({
  workspaceId,
  name,
  customerEmail,
  customerName,
}: {
  workspaceId: string;
  name: string;
  customerEmail?: string;
  customerName?: string;
}) => {
  const query = `
    mutation CreateCompany(
      $name: DefaultString!, 
      $productId: ID!, 
      $customerEmail: EmailAddress
      $customerName: DefaultString
    ) {
    createCompany(
      name: $name
      productId: $productId
      customerEmail: $customerEmail
      customerName: $customerName
    ) {
      id
      name
      customers {
        edges {
          node {
            id
            name
            email
          }
        }
      }
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
`;

  const variables = {
    productId: workspaceId,
    name,
    customerEmail,
    customerName,
  };
  const response = await queryCycle<QueryCreateCompanyResponse>({
    query,
    variables,
  });

  return response?.data?.createCompany || null;
};

type QueryUpdateCompanyAttributeResponse =
  | {
      data: {
        updateCompanyAttributeValue: {
          id: string;
          definition: {
            id: string;
            __typename: string;
          };
          value:
            | {
                id: string;
                valueCheckbox: boolean;
              }
            | {
                id: string;
                valueText: string;
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
  value: string | boolean;
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
        __typename
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
  `;
  const variables = {
    companyId,
    attributeDefinitionId,
    value: typeof value === 'boolean' ? { checkbox: value } : { text: value },
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
          name: string;
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
    externalId?: {
      zendesk?: string;
      hubspot?: string;
      intercom?: string;
      pipedrive?: string;
      snowflake?: string;
      custom?: string;
    };
  };
}) => {
  const query = `
    mutation updateCompany(
      $companyId: ID!,
      $name: String,
      $domain: String,
      $arr: Float,
      $numberOfEmployees: Int
      $externalId: ExternalCompanyInput
    ) {
      updateCompany(
        id: $companyId,
        name: $name,
        domain: $domain,
        arr: $arr, 
        numberOfEmployees: $numberOfEmployees,
        externalId: $externalId
      ) {
        id
        name
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

type MutationUpdateCompanyArrResponse = {
  data: {
    updateCompany: {
      id: string;
      arr: number;
    };
  };
};

export const updateCompanyArr = async ({
  companyId,
  arr,
}: {
  companyId: string;
  arr: number;
}) => {
  const query = `
  mutation getCompanies(
    $companyId: ID!,
    $arr: Float,
  ) {
    updateCompany(
      id: $companyId,
      arr: $arr
    ) {
      id
      arr
    }
  }
`;
  const variables = {
    companyId,
    arr,
  };
  const response = await queryCycle<MutationUpdateCompanyArrResponse>({
    query,
    variables,
  });

  return response?.data?.updateCompany || null;
};

type QueryCreateCompanyAttributeResponse = {
  data: {
    addNewCompanyAttribute: {
      id: string;
      name: string;
    };
  };
};

export const createCustomerCompanyAttributeBoolean = async ({
  workspaceId,
  attributeName,
}: {
  workspaceId: string;
  attributeName: string;
}) => {
  const query = `
    mutation scalarBooleanAttribute {
      addNewCompanyAttribute(
        input: {
          productId: $productId
          name: $name
          color: a
          type: { scalar: { type: BOOLEAN } }
        }
      ) {
        __typename
        ... on AttributeCheckboxDefinition {
          id
          name
        }
      }
    }
  `;
  const variables = {
    workspaceId,
    attributeName,
  };
  const response = await queryCycle<QueryCreateCompanyAttributeResponse>({
    query,
    variables,
  });
  return response?.data?.addNewCompanyAttribute || null;
};

type QueryDeleteCompanyResponse = {
  data: {
    deleteCompany: {
      id: string;
    };
  };
};

export const deleteCompany = async ({ companyId }: { companyId: string }) => {
  const query = `
    mutation DeleteCompany($companyId: ID!) {
      deleteCompany(id: $companyId) {
        __typename
        id
      }
    }
  `;
  const variables = {
    companyId,
  };
  const response = await queryCycle<QueryDeleteCompanyResponse>({
    query,
    variables,
  });
  return response?.data?.deleteCompany || null;
};
