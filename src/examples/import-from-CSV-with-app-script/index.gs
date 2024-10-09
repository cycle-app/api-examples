// Replace values with your data
const SHEET_NAME = 'feedback';
const SHEET_ID = '1UH6KXcN7qXKyrx_qIU9hD84Ur6128UAb9wz-j5y2MCk'; // Id from the sheet that you are running this script
const CYCLE_WORKSPACE_SLUG = 'sweet-cold-delight';

function main() {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log(`Sheet ${SHEET_NAME} not found`);
    return;
  }
  const data = sheet.getDataRange().getValues();
  Logger.log('Fetching workspace id…');
  // @ts-ignore: No need to import for App Script
  const workspaceId = fetchWorkspaceId(CYCLE_WORKSPACE_SLUG);
  Logger.log('Workspace id retrieved');
  let count = 0;

  const headers = data[0];
  const headerMap = {};
  for (let i = 0; i < headers.length; i++) {
    headerMap[headers[i]] = i;
  }

  for (let i = 1; i < data.length; i++) {
    Utilities.sleep(1000); // Avoid rate limit by making a delay between each call
    const row = data[i];

    const docData = {
      title: `Feedback from ${row[headerMap['name']]}`,
      contentHtml: row[headerMap['feedback']],
      customerEmail: row[headerMap['email']],
      // Include other fields as needed
    };

    // @ts-ignore: No need to import for App Script
    const result = createFeedback({
      workspaceId,
      title: docData.title,
      attributes: [], // Add attributes here
      companyName: undefined,
      customerEmail: docData.customerEmail,
      sourceUrl: SHEET_ID
        ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`
        : 'https://docs.google.com/spreadsheets',
      content: docData.contentHtml,
    });

    if (result) {
      Logger.log(`Feedback created: ${result.title}`);
      count++;
      // Optionally, write back the result to the sheet
      // For example, write the doc ID to the next column
      sheet.getRange(i + 1, headers.length + 1).setValue(result.id);
    } else {
      Logger.log(`Failed to create doc for row ${i + 1}`);
    }
  }

  Logger.log(`${count} feedback imported`);
}
