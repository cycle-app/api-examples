import { token, graphqlEndpoint } from '../config';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

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
        if (attempt >= MAX_RETRIES) {
          const errorText = await response.text();
          throw new Error(errorText);
        } else {
          console.error('❌ Error fetching Cycle, trying again…');
        }
      } else {
        const responseData = await response.json();
        return responseData;
      }
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed due to error:`, error);
      if (attempt >= MAX_RETRIES) throw Error(error.message);
    }
    await delay(1000);
  }
  return null;
};

export const uploadImage = async (filePath: string): Promise<string | null> => {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;
      if (attempt > 1) console.log(`Attempt ${attempt} to upload image`);

      const operations = JSON.stringify({
        query: `mutation UploadImage($file: Upload!) { upload: uploadImage(file: $file) }`,
        variables: { file: null },
      });
      const map = JSON.stringify({
        '1': ['variables.file'],
      });

      const form = new FormData();
      form.append('operations', operations);
      form.append('map', map);
      form.append(
        '1',
        fs.createReadStream(path.resolve(filePath)),
        path.basename(filePath)
      );

      const response = await axios.post(graphqlEndpoint, form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...form.getHeaders(),
        },
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data.upload;
    } catch (error) {
      console.error(`Attempt ${attempt} failed with error:`, error);
      if (attempt >= MAX_RETRIES)
        throw new Error(`Image upload failed after ${MAX_RETRIES} attempts.`);
    }
  }
  return null;
};
