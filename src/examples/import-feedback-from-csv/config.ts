export const config = {
  /**
   * The name of your csv file without the extension
   * e.g. fileName.csv => fileName
   */
  csvFileName: 'fileName',
};

/**
 * Define the type of your CSV
 * Replace the keys with the ones from your CSV header columns
 * e.g. 'Node ID', 'Node Title', 'Status', 'Customer Full Name', 'Customer Email', 'Subject', 'Text Content', 'From Email', 'To Email', 'Title'
 */
export type CSVDataType = {
  'Node ID': string;
  'Node Title': string;
  Status: string;
  'Customer Full Name': string;
  'Customer Email': string;
  Subject: string;
  'Text Content': string;
  'From Email': string;
  'To Email': string;
  Title: string;
};
