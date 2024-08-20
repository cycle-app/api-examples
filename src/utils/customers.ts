import { queryCycle } from './cycle';

type QueryUpdateCustomerResponse =
  | {
      data: {
        updateCustomer: {
          id: string;
          name: string;
          email: string;
        };
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
}: {
  customerId: string;
  name?: string;
  email?: string;
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
    name: name || '',
    email: email || '',
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
          node: {
            id: string;
            name: string;
            email: string;
          };
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
