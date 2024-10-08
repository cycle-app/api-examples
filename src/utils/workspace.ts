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
  role,
}: {
  workspaceId: string;
  email: string;
  role?: Role;
}) => {
  const query = `
    mutation InviteProductUser(
      $workspaceId: ID!,
      $email: EmailAddress!,
      $role: Role!
    ) {
      inviteProductUser(
        productId: $workspaceId,
        email: $email,
        role: $role
      ) {
        id
        email
      }
    }
  `;
  const variables = {
    workspaceId,
    email,
    role: role || Role.COLLABORATOR,
  };
  const response = await queryCycle<QueryWorkspaceMembersResponse>({
    query,
    variables,
  });
  console.log('response', response);
  return response?.data?.inviteProductUser || null;
};
