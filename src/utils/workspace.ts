import { queryCycle } from './cycle';

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
