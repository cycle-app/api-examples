import { createObjectCsvWriter } from 'csv-writer';

export * from './ai';
export * from './attributes';
export * from './dates';
export * from './change-log';
export * from './companies';
export * from './csv';
export * from './customers';
export * from './doc-types';
export * from './doc';
export * from './releases';
export * from './workspace';

export const wait = (milliseconds: number = 1000) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export const formatDateAndTime = (date: Date): [string, string] => {
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(
    date
  );
  const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(
    date
  );
  return [formattedDate, formattedTime];
};

/**
 * Convert format from DD-MM-YYYY to YYYY-MM-DD
 * @param dateString Expecting format DD-MM-YYYY
 * @returns Format in YYYY-MM-DD
 */
export const formatDate = (dateString: string): string => {
  const [month, day, year] = dateString.split('-');
  return `${year}-${month}-${day}`;
};

export const generateCSV = async (
  filePath: string,
  headers: { id: string; title: string }[],
  append?: boolean
) => {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers,
    append: append,
  });
  return csvWriter;
};
