import { queryCycle } from './cycle';

type Release = {
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

type QueryWorkspaceBySlugResponse = {
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
  const response = await queryCycle<QueryWorkspaceBySlugResponse>({
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
