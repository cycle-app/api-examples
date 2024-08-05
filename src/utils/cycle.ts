import { token, graphqlEndpoint } from '../config';

export const queryCycle = async <T>({
  query,
  variables,
}: {
  query: string;
  variables: Record<string, any>;
}): Promise<T> => {
  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const responseData = await response.json();
  return responseData;
};
