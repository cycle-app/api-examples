import { queryCycle } from './cycle';

type Customer = {
  id: string;
  name: string;
  email: string;
};

type CustomerWithCompany = Customer & {
  company?: {
    id: string;
    name?: string;
  };
};

type QueryUpdateCustomerResponse =
  | {
      data: {
        updateCustomer: Customer;
      };
    }
  | {
      errors: [{ message: string; extensions: [any] }];
      data: { updateCustomer: null };
    };

export const updateCustomer = async ({
  customerId,
  name,
  email,
  companyId,
}: {
  customerId: string;
  name?: string;
  email?: string;
  companyId?: string;
}) => {
  const query = `
    mutation updateCustomer(
      $customerId: ID!, 
      $name: String, 
      $email: EmailAddress, 
      $companyId: ID, 
    ) {
      updateCustomer(
        customerId: $customerId
        name: $name
        email: $email
        companyId: $companyId
      ) {
        id
        email
        name
      }
    }
`;
  const variables = {
    customerId,
    name,
    email,
    companyId,
  };
  const response = await queryCycle<QueryUpdateCustomerResponse>({
    query,
    variables,
  });
  // console.log('response', response);
  return response?.data?.updateCustomer || null;
};

type QueryGetCustomerByEmailResponse = {
  data: {
    node: {
      customers: {
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
        edges: {
          node: Customer;
        }[];
      };
    };
  };
};

export const getCustomerByEmail = async ({
  email,
  workspaceId,
}: {
  email?: string;
  workspaceId: string;
}) => {
  const query = `
    query productCustomers(
      $workspaceId: ID!, 
      $size: Int!, 
      $cursor: String!, 
      $searchText: DefaultString
    ) {
      node(id: $workspaceId) {
        ... on Product {
          customers(
            searchText: $searchText
            pagination: {size: $size, where: {cursor: $cursor, direction: AFTER}}
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                name
                email
              }
            }
          }
        }
      }
    }
`;
  const variables = {
    workspaceId,
    size: 1,
    cursor: '',
    searchText: email,
  };
  const response = await queryCycle<QueryGetCustomerByEmailResponse>({
    query,
    variables,
  });
  if (response?.data?.node.customers.edges?.[0].node)
    return response?.data?.node.customers.edges?.[0].node;
  console.log('not found: ', email);
  return null;
};

type FetchCustomersResponse = {
  data: {
    node: {
      customers: {
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
        edges: {
          node: CustomerWithCompany;
        }[];
      };
    };
  };
};

export const fetchCustomers = async ({
  workspaceId,
  cursor,
}: {
  workspaceId: string;
  cursor: string;
}) => {
  const query = `
    query productCustomers(
      $workspaceId: ID!, 
      $size: Int!, 
      $cursor: String!, 
      $searchText: DefaultString
    ) {
      node(id: $workspaceId) {
        ... on Product {
          customers(
            searchText: $searchText
            pagination: {size: $size, where: {cursor: $cursor, direction: AFTER}}
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
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
        }
      }
    }
`;
  const variables = {
    workspaceId,
    size: 700,
    cursor,
    searchText: '',
  };
  const response = await queryCycle<FetchCustomersResponse>({
    query,
    variables,
  });
  if (response?.data?.node.customers.edges?.[0]?.node)
    return {
      data: response?.data.node.customers.edges.map((edge) => edge.node),
      cursor: response?.data.node.customers.pageInfo.hasNextPage
        ? response?.data.node.customers.pageInfo.endCursor
        : undefined,
    };
  return null;
};

type DeleteCustomerResponse = {
  data: {
    removeCustomer: {
      id?: string;
    };
  };
};

export const deleteCustomer = async ({
  customerId,
}: {
  customerId: string;
}) => {
  const query = `
    mutation RemoveCustomer($customerId: ID!) {
      removeCustomer(customerId: $customerId) {
        id
      }
    }
`;
  const variables = {
    customerId,
  };
  const response = await queryCycle<DeleteCustomerResponse>({
    query,
    variables,
  });
  return response?.data?.removeCustomer || null;
};

type QueryCompanyCustomersResponse = {
  data: {
    node: {
      id: string;
      customers: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
        edges: {
          node: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
            nbFeedbacks: number;
            nbInsights: number;
            company: {
              id: string;
              name: string;
              domain: string;
              isDefault: boolean;
              logo: string | null;
            };
            profiles: {
              __typename: string;
              url?: string;
            }[];
          };
        }[];
        count: number;
      };
    };
  };
};

export const getCompanyCustomers = async ({
  companyId,
  searchText = '',
  size = 20,
  cursor = '',
}: {
  companyId: string;
  searchText?: string;
  size?: number;
  cursor?: string;
}) => {
  const query = `
    query CompanyCustomers($id: ID!, $searchText: DefaultString, $size: Int!, $cursor: String!) {
      node(id: $id) {
        ... on Company {
          id
          customers(
            searchText: $searchText
            pagination: {size: $size, where: {cursor: $cursor, direction: AFTER}}
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                ...CustomerWithDoctypeCount
              }
            }
            count
          }
        }
      }
    }

    fragment CustomerWithDoctypeCount on Customer {
      ...Customer
      nbFeedbacks
      nbInsights
    }

    fragment Customer on Customer {
      id
      email
      name
      avatar
      company {
        id
        name
        domain
        isDefault
        logo
      }
      profiles {
        __typename
        ...ProfileCycle
        ...ProfileIntercom
        ...ProfileSlack
        ...ProfileHubspot
        ...ProfileZendesk
        ...ProfileSalesforce
      }
    }

    fragment ProfileCycle on ProfileCycle {
      id
    }

    fragment ProfileIntercom on ProfileIntercom {
      id
      url
    }

    fragment ProfileSlack on ProfileSlack {
      id
      url
    }

    fragment ProfileHubspot on ProfileHubspot {
      id
      url
    }

    fragment ProfileZendesk on ProfileZendesk {
      id
      url
    }

    fragment ProfileSalesforce on ProfileSalesforce {
      id
      url
    }
  `;

  const variables = {
    id: companyId,
    searchText,
    size,
    cursor,
  };

  const response = await queryCycle<QueryCompanyCustomersResponse>({
    query,
    variables,
  });

  return response?.data?.node?.customers || null;
};

type CreateCustomerResponse = {
  data: {
    createCustomer: Customer;
  };
};

export const createCustomer = async ({
  email,
  workspaceId,
  name,
  companyId,
  companyName,
}: {
  email?: string;
  workspaceId: string;
  name?: string;
  companyId?: string;
  companyName?: string;
}) => {
  const query = `
    mutation CreateCustomer(
      $email: EmailAddress, 
      $workspaceId: ID!, 
      $name: DefaultString, 
      $companyId: ID, 
      $companyName: DefaultString
    ) {
      createCustomer(
        email: $email
        productId: $workspaceId
        name: $name
        companyId: $companyId
        companyName: $companyName
      ) {
        __typename
        id
        name
        email
      }
    }
  `;

  const variables = {
    email,
    workspaceId,
    name,
    companyId,
    companyName,
  };

  const response = await queryCycle<CreateCustomerResponse>({
    query,
    variables,
  });

  return response?.data?.createCustomer || null;
};
