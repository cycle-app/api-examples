import { queryCycle } from './cycle';

enum ReleasePublicStatus {
  UNPUBLISHED = 'UNPUBLISHED',
  PUBLISHED = 'PUBLISHED',
  EDITING = 'EDITING',
}

enum CreateReleaseNotePosition {
  start = 'start',
  end = 'end',
}

export type Release = {
  id: string;
  date: string;
  title: string;
};

export type ReleaseWithReleaseNotes = Release & {
  releaseNotes: { edges: { node: ReleaseNote }[] };
};

type ReleaseNote = {
  id: string;
  title: string;
  cover: {
    id: string;
    url: string;
  };
  isOther: boolean;
  htmlContent: string;
};

export type ReleaseNoteWithDoc = ReleaseNote & {
  doc: {
    id: string;
    title: string;
  };
};

type QueryReleasesResponse = {
  data: {
    node: {
      releases: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
        edges: {
          cursor: string;
          node: Release;
        }[];
      };
    };
  };
};

export const fetchReleases = async ({
  workspaceId,
  cursor,
}: {
  workspaceId: string;
  cursor?: string;
}) => {
  const query = `
  query productCustomers(
    $workspaceId: ID!, 
    $size: Int!, 
    $cursor: String!, 
  ) {
    node(id: $workspaceId) {
      ... on Product {
        releases (
          pagination: {
            size: $size, 
            where: {
              cursor: $cursor,
              direction: AFTER
            }
          }
        ) {
          pageInfo {
            __typename
            hasNextPage
            endCursor
          }
          edges {
            cursor
            node {
              id
              date
              title
            }
          }
        }
      }
    }
  }
`;
  const variables = {
    workspaceId,
    size: 30,
    cursor: cursor || '',
  };
  const response = await queryCycle<QueryReleasesResponse>({
    query,
    variables,
  });
  if (!response?.data) {
    console.error('No releases found', response);
    return null;
  }
  return response?.data || null;
};

type FetchReleaseNotesResponse = {
  data: {
    release: {
      id: string;
      title: string;
      releaseNotes: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
        edges: {
          node: ReleaseNoteWithDoc;
        }[];
      };
    };
  };
};

export const fetchReleaseNotes = async ({
  releaseId,
  cursor,
}: {
  releaseId: string;
  cursor?: string;
}) => {
  const query = `
    query getReleaseNotes(
      $releaseId: ID!
      $size: Int!, 
      $cursor: String!
    ) {
      release: node(id: $releaseId) {
        ... on Release {
          id
          title
          releaseNotes(
            pagination: {
              size: $size, 
              where: {
                cursor: $cursor,
                direction: AFTER
              }
            }
          ) {
            pageInfo {
              __typename
              hasNextPage
              endCursor
            }
            edges {
              cursor
              node {
                id
                title
                cover {
                  id
                  url
                }
                isOther
                htmlContent
                doc {
                  id
                  title
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    releaseId,
    size: 30,
    cursor: cursor || '',
  };
  const response = await queryCycle<FetchReleaseNotesResponse>({
    query,
    variables,
  });

  return response?.data || null;
};

type QueryReleaseCreateResponse = {
  data: {
    createRelease: {
      id: string;
      date: string;
      publicStatus: ReleasePublicStatus;
      title: string;
    };
  };
};

export const createRelease = async ({
  workspaceId,
  date,
  title,
}: {
  workspaceId: string;
  date: string;
  title?: string;
}) => {
  const query = `
    mutation getChangelogBySlug(
      $productId: ID!,
      $date: Date!,
      $title: DefaultString,
    ) {
      createRelease(date: $date, productId: $productId, title: $title) {
        id
        date
        title
        publicStatus
      }
    }
  `;
  const variables = {
    productId: workspaceId,
    date,
    title: title || '',
  };
  const response = await queryCycle<QueryReleaseCreateResponse>({
    query,
    variables,
  });
  return response;
};

type QueryReleaseNoteCreateResponse = {
  data: {
    createReleaseNote: {
      id: string;
      date: string;
      publicStatus: ReleasePublicStatus;
      title: string;
    };
  };
};

export const createReleaseNote = async ({
  docId,
  releaseId,
}: {
  docId: string;
  releaseId: string;
}) => {
  const query = `
    mutation getChangelogBySlug(
      $docId: ID!,
      $releaseId: ID!,
      $isOther: Boolean,
    ) {
      createReleaseNote(
      releaseId: $releaseId, 
      docId: $docId, 
      isOther: $isOther, 
    ) {
        id
        title
        cover {
          url
        }
        htmlContent
        position
        isPublished
        isOther
      }
    }
  `;
  const variables = {
    docId,
    releaseId,
    isOther: false,
    position: CreateReleaseNotePosition.end,
  };
  const response = await queryCycle<QueryReleaseNoteCreateResponse>({
    query,
    variables,
  });
  return response;
};
