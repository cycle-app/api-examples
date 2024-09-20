import * as fs from 'fs';
import csv from 'csv-parser';

export const extractDataFromCSV = <T>(
  csvFilePath: string
): Promise<T[] | Error> => {
  return new Promise((resolve, reject) => {
    const records: T[] = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        records.push(row as T);
      })
      .on('end', async () => {
        resolve(records);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
