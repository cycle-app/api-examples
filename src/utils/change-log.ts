import { queryCycle } from './cycle';
import type { ReleaseWithReleaseNotes } from './releases';

type QueryReleasesReadResponse = {
  data: {
    getChangelogBySlug: {
      id: string;
      releases: {
        edges: {
          node: ReleaseWithReleaseNotes;
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
