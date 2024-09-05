import { token, graphqlEndpoint } from '../config';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRIES = 3;

export const queryCycle = async <T>({
  query,
  variables,
}: {
  query: string;
  variables: Record<string, any>;
}): Promise<T | null> => {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;

      if (attempt > 1)
        console.log(`Attempt ${attempt} to fetch data from ${graphqlEndpoint}`);

      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching Cycle:', errorText);
        if (attempt >= MAX_RETRIES) return null;
      } else {
        const responseData = await response.json();
        return responseData;
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed due to error:`, error);
      if (attempt >= MAX_RETRIES) return null;
    }
    await delay(1000);
  }
  return null;
};
