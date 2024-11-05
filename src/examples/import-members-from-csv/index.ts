/**
 * Make a temporary function to fetch all customers from a specific company and generate a CSV file with the data.
 */
import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import csvParser from 'csv-parser';
import {
  fetchWorkspaceId,
  getCompanyCustomers,
  inviteMember,
  Role,
  wait,
} from '../../utils';
import { slug } from '../../config';

async function writeCustomersToCSV(companyId: string) {
  const csvFilePath = path.resolve(__dirname, 'input', 'customers.csv');
  console.log('csvFilePath', csvFilePath);
  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
    ],
    append: true,
  });

  let cursor: string | null = '';
  let hasNextPage = true;

  while (hasNextPage) {
    const customersData = await getCompanyCustomers({
      companyId,
      searchText: '',
      size: 20,
      cursor: cursor || '',
    });

    if (!customersData) {
      console.error('Failed to fetch customers data');
      break;
    }

    const records = customersData.edges.map((edge) => {
      const customer = edge.node;
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      };
    });

    await csvWriter.writeRecords(records);
    console.log(`Wrote ${records.length} customer(s) to CSV`);

    // Update pagination info for the next loop
    hasNextPage = customersData.pageInfo.hasNextPage;
    cursor = customersData.pageInfo.endCursor;
  }

  console.log('Finished writing all customers to CSV.');
}

async function generate() {
  await writeCustomersToCSV(
    'Q29tcGFueV81MjY2NWYwZC1jN2Y3LTRkNjAtODhkYi01MjE2MzY3NjBjY2N=' // replace with the company ID you want to retrieve users
  );
}

async function invite() {
  const csvFilePath = path.resolve(__dirname, 'input', 'customers.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found at path: ${csvFilePath}`);
    return;
  }

  const workspaceId = await fetchWorkspaceId({ slug });
  if (!workspaceId) {
    console.error(`No workspace found for slug: ${slug}`);
    process.exit();
  }
  console.info(`ℹ️ Workspace id found: ${workspaceId}`);

  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on('data', async (row) => {
      await wait(1000);
      const [id, name, email]: string[] = Object.values(row);

      if (!email) {
        console.warn('Skipping entry with no email');
        return;
      }

      const [firstName, ...lastName] = name?.split(' ') || ['', ''];

      try {
        const invitedMember = await inviteMember({
          workspaceId,
          firstName: firstName || '',
          lastName: lastName?.join(' ') || '',
          email,
          role: Role.COLLABORATOR,
          shouldSendInviteMail: false,
        });

        if (invitedMember) {
          console.log(`Invited member: ${invitedMember.email}`);
        } else {
          console.log(`Failed to invite member: ${email}`);
        }
      } catch (error) {
        console.error(`Error inviting member with email ${email}:`, error);
      }
    })
    .on('end', () => {
      console.log('Finished processing all customers from CSV.');
    })
    .on('error', (error) => {
      console.error('Error reading CSV file:', error);
    });
}

// First generate
// generate();

// Second invite
// invite();
