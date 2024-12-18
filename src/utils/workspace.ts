import { queryCycle } from './cycle';

export enum Role {
  MAKER = 'MAKER',
  COLLABORATOR = 'COLLABORATOR',
}

type QueryWorkspaceBySlugResponse = {
  data: {
    getProductBySlug: {
      id: string;
    };
  };
};

export const fetchWorkspaceId = async ({ slug }: { slug: string }) => {
  const query = `
    query workspaceBySlug($slug: DefaultString!) {
      getProductBySlug(slug: $slug) {
        id
      }
    }
  `;
  const variables = { slug };
  const response = await queryCycle<QueryWorkspaceBySlugResponse>({
    query,
    variables,
  });
  return response?.data?.getProductBySlug?.id || null;
};

type QueryWorkspaceWithDefaultAssigneeBySlugResponse = {
  data: {
    getProductBySlug: {
      id: string;
      defaultAssignee: {
        id: string;
        email: string;
      };
    };
  };
};

export const fetchWorkspaceIdWithDefaultAssignee = async ({
  slug,
}: {
  slug: string;
}) => {
  const query = `
    query workspaceBySlug($slug: DefaultString!) {
      getProductBySlug(slug: $slug) {
        id
        defaultAssignee {
          id
          email
        }
      }
    }
  `;
  const variables = { slug };
  const response =
    await queryCycle<QueryWorkspaceWithDefaultAssigneeBySlugResponse>({
      query,
      variables,
    });
  return response?.data?.getProductBySlug || null;
};

type QueryWorkspaceStatusesResponse = {
  data: {
    getProductStatuses: {
      id: string;
      status: {
        __typename: string;
        completed: {
          __typename: string;
          edges: {
            node: {
              __typename: string;
              id: string;
              value: string;
            };
          }[];
        };
        notStarted: {
          __typename: string;
          edges: {
            node: {
              __typename: string;
              id: string;
              value: string;
            };
          }[];
        };
        started: {
          __typename: string;
          edges: {
            node: {
              __typename: string;
              id: string;
              value: string;
            };
          }[];
        };
        canceled: {
          __typename: string;
          edges: {
            node: {
              __typename: string;
              id: string;
              value: string;
            };
          }[];
        };
      };
    };
  };
};

export const fetchWorkspaceStatuses = async ({ slug }: { slug: string }) => {
  const query = `
    query workspaceStatus($slug: DefaultString!) {
      getProductStatuses(slug: $slug) {
        id
        status {
          __typename
          completed: values(category: COMPLETED, pagination: {size: 50}) {
            __typename
            edges {
              node {
                __typename
                id
                value
              }
            }
          }
          notStarted: values(category: NOT_STARTED, pagination: {size: 50}) {
            __typename
            edges {
              node {
                __typename
                id
                value
              }
            }
          }
          started: values(category: STARTED, pagination: {size: 50}) {
            __typename
            edges {
              node {
                __typename
                id
                value
              }
            }
          }
          canceled: values(category: CANCELED, pagination: {size: 50}) {
            __typename
            edges {
              node {
                __typename
                id
                value
              }
            }
          }
        }
      }
    }
  `;
  const variables = { slug };
  const response = await queryCycle<QueryWorkspaceStatusesResponse>({
    query,
    variables,
  });
  return response?.data.getProductStatuses || null;
};

type QueryWorkspaceMembersResponse = {
  data: {
    inviteProductUser: {
      id: string;
      email: string;
      role: Role;
    };
  };
};

export const inviteMember = async ({
  workspaceId,
  email,
  firstName,
  lastName,
  role,
  shouldSendInviteMail,
}: {
  workspaceId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  shouldSendInviteMail?: boolean;
}) => {
  const query = `
    mutation InviteProductUser(
      $workspaceId: ID!,
      $email: EmailAddress!,
      $firstName: DefaultString,
      $lastName: DefaultString,
      $role: Role!
      $shouldSendInviteMail: Boolean
    ) {
      inviteProductUser(
        productId: $workspaceId,
        email: $email,
        firstName: $firstName,
        lastName: $lastName,
        role: $role
        shouldSendInviteMail: $shouldSendInviteMail
      ) {
        id
        email
      }
    }
  `;
  const variables = {
    workspaceId,
    email,
    firstName,
    lastName,
    role: role || Role.COLLABORATOR,
    shouldSendInviteMail: shouldSendInviteMail || false,
  };
  const response = await queryCycle<QueryWorkspaceMembersResponse>({
    query,
    variables,
  });
  console.log('response', response);
  return response?.data?.inviteProductUser || null;
};

type QueryProductMembersResponse = {
  data: {
    node: {
      users: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
        edges: {
          node: {
            id: string;
            email: string;
          };
        }[];
      };
    };
  };
};

export const fetchProductMember = async ({
  workspaceId,
  email,
}: {
  workspaceId: string;
  email: string;
}): Promise<{ id: string; email: string } | null | undefined> => {
  let cursor = '';
  const pageSize = 50;
  let member: { id: string; email: string } | null | undefined = undefined;
  const query = `
    query productMembers(
      $productId: ID!,
      $size: Int!,
      $cursor: String!,
      $searchText: DefaultString
    ) {
      node(id: $productId) {
        ... on Product {
          users(
            pagination: {size: $size, where: {cursor: $cursor, direction: AFTER}}
            searchText: $searchText
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                email
              }
            }
          }
        }
      }
    }
  `;

  while (member === undefined) {
    const variables: any = {
      productId: workspaceId,
      size: pageSize,
      cursor,
      searchText: email,
    };
    const response = await queryCycle<QueryProductMembersResponse>({
      query,
      variables,
    });

    const edges = response?.data.node.users.edges;
    if (!edges) {
      member = null;
      break;
    }
    for (const edge of edges) {
      if (edge.node.email === email) {
        member = edge.node;
        break;
      }
    }

    if (!response.data.node.users.pageInfo.hasNextPage) break;
    cursor = response?.data.node.users.pageInfo.endCursor;
  }

  return member;
};
