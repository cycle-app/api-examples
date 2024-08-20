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

type QueryReleasesReadResponse = {
  data: {
    getChangelogBySlug: {
      id: string;
      releases: {
        edges: {
          node: Release;
        }[];
      };
    };
  };
};

export const fetchChangeLog = async ({ slug }: { slug: string }) => {
  const query = `
    query getChangelogBySlug(
      $slug: DefaultString!,
    ) {
      getChangelogBySlug(slug: $slug) {
        id
        releases {
          edges {
            node {
              id
              date
              title
              releaseNotes {
                edges {
                  node {
                    id
                    title
                    cover {
                      id
                      url
                    }
                    isOther
                    htmlContent
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const variables = { slug };
  const response = await queryCycle<QueryReleasesReadResponse>({
    query,
    variables,
  });
  return (
    response?.data?.getChangelogBySlug?.releases.edges?.map((e) => ({
      ...e.node,
      releaseNotes: e.node.releaseNotes.edges.map((e) => e.node) || [],
    })) || []
  );
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
