import {
  wait,
  fetchWorkspaceId,
  createFeedback,
  createImportAttribute,
  linkAttributeToDocType,
  fetchWorkspaceDocTypes,
  extractDataFromCSV,
  findCompanyByName,
  Company,
} from '../../utils';
import { slug } from '../../config';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { uploadImage } from '../../utils/cycle';

const productAreaDefinitionId =
  'QXR0cmlidXRlU2luZ2xlU2VsZWN0RGVmaW5pdGlvbl8yMDcwNDVmMy1iNDBkLTQyOGItYWY1NC01OTM5ZmJlNTNlYjk=';
const productAreaOptions = [
  {
    id: 'QXR0cmlidXRlVGV4dFZhbHVlXzkzMDdjZGJlLTJlZjMtNDA0ZS04OWY4LWNkYWY5ZDkyNWMyOA==',
    value: 'Studio',
  },
  {
    id: 'QXR0cmlidXRlVGV4dFZhbHVlXzU4NzY4Yjc4LTA2NzYtNDRmMy1iYzVmLWE4NDMxOGExYTE2MQ==',
    value: 'Building Generation',
  },
  {
    id: 'QXR0cmlidXRlVGV4dFZhbHVlXzI2YzY1ZmMwLTg2MDItNDg4MC1hY2E1LTk5MzM2YTI2MmM4Yw==',
    value: 'Procure',
  },
  {
    id: 'QXR0cmlidXRlVGV4dFZhbHVlXzQ0MWNiOGMzLTY0MWYtNDE2ZC1hYzM1LTEwYWFkM2FiYmRhNA==',
    value: 'Showroom',
  },
  {
    id: 'QXR0cmlidXRlVGV4dFZhbHVlXzBjOGE0YjQ1LTliNGQtNGZjNy1iMmY1LTU4MmFjYTZmOTI2Nw==',
    value: 'Config',
  },
  {
    id: 'QXR0cmlidXRlVGV4dFZhbHVlXzJhZTA5MWY1LWRkYzgtNGI5MS04ODUyLTBhMTEwMzM0ZjZhYQ==',
    value: 'Foundation',
  },
  {
    id: 'QXR0cmlidXRlVGV4dFZhbHVlX2RlYWE4NjY0LTBlM2EtNGYzNi1iMjcyLThlYjM5NWIyODYwMA==',
    value: 'Integrations',
  },
];

function parseHtmlTable(htmlContent: string) {
  const $ = cheerio.load(htmlContent);

  const tableHeaders: string[] = [];
  const tableData: any[] = [];
  $('table.collection-content thead tr').each((_, row) => {
    $(row)
      .find('th')
      .each((_, cell) => {
        tableHeaders.push($(cell).text().trim());
      });
  });
  $('table.collection-content tbody tr').each((_, row) => {
    const rowData: any = {};
    $(row)
      .find('td')
      .each((index, cell) => {
        const textContent = $(cell).text().trim();
        const link = $(cell).find('a').attr('href') || null;

        rowData[tableHeaders[index]] = {
          text: textContent,
          link: link,
        };
      });
    tableData.push(rowData);
  });
  return {
    tableHeaders,
    tableData,
  };
}

function extractNameFromNotionList(value: string) {
  const items = value.split(',');

  const products = items
    .map((item) => {
      const match = item.match(/^([\w\s]+)/); // Capture name before the '('
      return match ? match[1].trim() : '';
    })
    .filter((name) => name !== ''); // Filter out any empty results just in case

  return products;
}

async function processHtml(htmlContent: string, baseDir: string) {
  const $ = cheerio.load(htmlContent);

  const imgTags = $('img');
  for (const img of imgTags.toArray()) {
    const $img = $(img);
    const localSrc = $img.attr('src');

    if (localSrc && !localSrc.startsWith('http')) {
      const localPath = path.join(baseDir, decodeURIComponent(localSrc));

      // Ensure the file exists before trying to upload
      if (fs.existsSync(localPath)) {
        try {
          // Upload the image and get the remote URL
          console.log('uploading image…');
          // console.log('uploading image located at', localPath);
          const remoteUrl = await uploadImage(localPath);
          $img.attr('src', remoteUrl);
        } catch (error) {
          console.error(`Error uploading image from ${localPath}:`, error);
        }
      } else {
        console.warn(`File does not exist: ${localPath}`);
      }
    }
  }
  return $.html();
}

function reconstructNotionUrl(localLink: string): string {
  const decodedLink = decodeURIComponent(localLink);

  // Split by `/` and get the last segment which should contain the page ID
  const parts = decodedLink.split('/');
  const lastPart = parts[parts.length - 1];

  // Extract the Notion page ID, assuming it’s the last 32 characters before .html
  const pageId = lastPart.match(/[a-f0-9]{32}/)?.[0];

  return `https://www.notion.so/${pageId}`;
}

const main = async () => {
  try {
    const workspaceId = await fetchWorkspaceId({ slug });
    if (!workspaceId) {
      console.error(`No workspace found for slug: ${slug}`);
      process.exit();
    }
    console.info(`ℹ️ ${slug} Workspace id found: ${workspaceId}`);

    const importAttribute = await createImportAttribute(workspaceId);
    if (!importAttribute) {
      console.error(`Error during attribute creation`);
      process.exit();
    }
    console.info(`Import attribute created: ${importAttribute.name}`);

    const docTypes = await fetchWorkspaceDocTypes({
      workspaceId,
    });

    const feedbackDocType = docTypes.find((d) => d.name === 'Feedback');
    if (!feedbackDocType) {
      console.error(`No Feedback docType found`);
      process.exit();
    }

    await linkAttributeToDocType({
      attributeDefinitionId: importAttribute.id,
      doctypeId: feedbackDocType.id,
    });
    console.info(
      `✅ Import attribute successfully linked to ${feedbackDocType.name} doc type`
    );

    const inputHTMLFilePath = path.join(
      process.cwd(),
      'src/examples/import-notion/input2',
      '25b3bb00-85f4-4568-9d25-0f1ca6e35779_Export-b4af3a94-fb6a-4e68-8e2f-9245203ba7a4',
      'Feature Requests [ARCHIVE] 1b95d09573304bca84a4dbc5f38667d7.html'
    );
    const inputCSVFilePath = path.join(
      process.cwd(),
      'src/examples/import-notion/input2',
      '25b3bb00-85f4-4568-9d25-0f1ca6e35779_Export-b4af3a94-fb6a-4e68-8e2f-9245203ba7a4',
      'Feature Requests [ARCHIVE] 1b95d09573304bca84a4dbc5f38667d7.csv'
    );

    const htmlFileContent = fs.readFileSync(inputHTMLFilePath, 'utf-8');
    // const csvFileContent = fs.readFileSync(inputCSVFilePath, 'utf-8');
    const dataHTML = parseHtmlTable(htmlFileContent);
    type CSVDataType = {
      'Name`': string;
      'Created On': string;
      '📺 Products': string;
      '🔢 Significance': string;
      Status: string;
      'Priority Score': string;
      'System Category': string;
      'Product Studio Systems': string;
      Assignee: string;
      '🏗️ Accounts': string;
      'OLD - CS Roadmap': string;
      'Created by': string;
      '🫂 Stakeholders': string;
      'Status Notes': string;
      '⭕ Redline': string;
      'Product Features': string;
      'Last edited time': string;
      'To Discuss': string;
      ' OLD  - ⛰️ Epics ': string;
      'Current Level of Support': string;
      'Product Tickets': string;
      '🏷️ Tag': string;
      'AI summary': string;
      '👤 Personas': string;
      '# of accounts': string;
      'Days old': string;
      Formula: string;
      'Migrate to Cycle': string;
    };
    const dataCSV = await extractDataFromCSV<CSVDataType>(inputCSVFilePath);

    if (dataCSV instanceof Error) {
      console.error('Error during CSV extraction');
      process.exit();
    }
    // console.info('data', dataCSV[0]);

    // console.info('headers', data.tableHeaders);
    // console.info('data', dataHTML.tableData[0]);
    // console.info('data length', data.tableData.length);
    // const a = true;
    // if (a) {
    //   return;
    // }

    // for (const row of [dataHTML.tableData[0]]) {
    for (const row of dataHTML.tableData) {
      await wait(500);
      const title = row['Name`'].text;
      const localLink = row['Name`'].link;
      const decodedPath = decodeURI(localLink);

      // console.log('title', title);
      // const a = dataCSV[192];

      const correspondingRow = dataCSV.find((rowCSV) => {
        // @ts-ignore
        const rowCsvDataKeyName = Object.keys(rowCSV)[0];
        // @ts-ignore
        const csvTitle = (rowCSV[rowCsvDataKeyName] || '').trim().toLowerCase();

        if (!csvTitle) return false;

        return title.trim().toLowerCase().includes(csvTitle);
      });
      let areaFromCSV = null;
      let accountsFromCSV = null;
      if (correspondingRow) {
        // console.log('correspondingRow', correspondingRow);
        areaFromCSV = correspondingRow['📺 Products'];
        accountsFromCSV = correspondingRow['🏗️ Accounts'];
      }
      let attributeValue = null;
      if (areaFromCSV) {
        // console.log('areaFromCSV', areaFromCSV);
        const areaStrings = extractNameFromNotionList(areaFromCSV);
        if (areaStrings.length) {
          // console.log('areaString', areaStrings);
          const attributeValues = areaStrings.map(
            (str) =>
              productAreaOptions.find(
                (option) =>
                  option.value.trim().toLowerCase() === str.trim().toLowerCase()
              )?.id
          );
          if (attributeValues.length) {
            attributeValue = attributeValues[0];
          }
        }
      }
      let companyNamesInCSV: string[] = [];
      const companiesInCycle: Company[] = [];
      if (accountsFromCSV) {
        companyNamesInCSV = extractNameFromNotionList(accountsFromCSV);
        // console.log('accountStrings', accountStrings);
        for (const accountString of companyNamesInCSV) {
          await wait(500);
          const companiesInCycle = await findCompanyByName({
            workspaceId,
            companyName: accountString,
          });
          const exactMatchCompany = companiesInCycle.find(
            (c) => c.name.toLowerCase() === accountString.toLowerCase()
          );
          if (exactMatchCompany) {
            companiesInCycle.push(exactMatchCompany);
          }
        }
      }

      const filePath = path.resolve(
        process.cwd(),
        'src/examples/import-notion/input2',
        '25b3bb00-85f4-4568-9d25-0f1ca6e35779_Export-b4af3a94-fb6a-4e68-8e2f-9245203ba7a4',
        decodedPath
      );

      const content = localLink ? fs.readFileSync(filePath, 'utf-8') : '';
      // const newHtmlContent = content;
      const newHtmlContent = await processHtml(
        content,
        inputHTMLFilePath.replace('.html', '')
      );
      const sourceUrl = localLink
        ? reconstructNotionUrl(localLink)
        : 'https://notion.so/';

      const attributes = [
        {
          attributeDefinitionId: importAttribute.id,
          value: { checkbox: true },
        },
        ...(attributeValue
          ? [
              {
                attributeDefinitionId: productAreaDefinitionId,
                value: { select: attributeValue },
              },
            ]
          : []),
      ];

      const customerEmail =
        companiesInCycle[0]?.customers?.edges?.[0]?.node?.email ||
        companiesInCycle[0]?.customers?.edges?.[1]?.node?.email;

      // if (!customerEmail) {
      //   console.error(
      //     'No customer email found',
      //     companiesInCycle?.[0],
      //     companyNamesInCSV
      //   );
      //   continue;
      // }

      const feedback = await createFeedback({
        workspaceId,
        title,
        attributes,
        // companyName: row['PRODUCT'].text,
        customerEmail: customerEmail || 'abrahamdrechsler@higharc.com',
        sourceUrl,
        content: newHtmlContent,
      });
      console.info('Feedback imported', feedback?.id);
      if (companiesInCycle.length > 1) {
        const extraCompanies = companiesInCycle.slice(1);

        for (const company of extraCompanies) {
          await wait(500);
          const email =
            companiesInCycle[0].customers?.edges?.[0]?.node?.email ||
            companiesInCycle[0].customers?.edges?.[1]?.node?.email;

          if (email) {
            await createFeedback({
              workspaceId,
              title: `${title} (${company.name})`,
              attributes,
              customerEmail: email,
              sourceUrl,
              content: newHtmlContent,
            });
          }
        }
      }
    }

    console.info('✅ Import done ✅');
  } catch (error: any) {
    console.error('Error', error.message);
  }
};

main();
