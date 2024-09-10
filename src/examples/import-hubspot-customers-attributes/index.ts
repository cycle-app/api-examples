import { Client } from '@hubspot/api-client';
import { hubSpotConfig } from './config';
import { slug } from '../../config';
import {
  getCompanies,
  fetchWorkspaceId,
  updateCompanyArr,
  CompanyWithAttributes,
} from '../../utils';
import fs from 'fs';
import path from 'path';

const hubSpot = new Client({ accessToken: hubSpotConfig.token });
const now = new Date();
const year = now.getFullYear(); // YYYY
const month = String(now.getMonth() + 1).padStart(2, '0'); // MM
const day = String(now.getDate()).padStart(2, '0'); // DD
const hours = String(now.getHours()).padStart(2, '0'); // HH
const minutes = String(now.getMinutes()).padStart(2, '0'); // m
const formattedDate = `${year}-${month}-${day}:${hours}-${minutes}`;
const logFilePath = path.join(__dirname, `/output/log-${formattedDate}.txt`);

const log = (message: string) => {
  console.log(message);
  fs.appendFileSync(logFilePath, message + '\n', { encoding: 'utf-8' });
};

const fetchDealDetails = async (dealIds: string[]) => {
  const deals = [];

  for (const dealId of dealIds) {
    const dealResponse = await hubSpot.crm.deals.basicApi.getById(dealId, [
      'amount',
      'annual_revenue',
    ]);
    deals.push(dealResponse);
  }

  return deals;
};

const getDealsForCompany = async (companyId: string) => {
  try {
    // Fetch associated deals for the company
    const dealsResponse = await hubSpot.crm.associations.v4.basicApi.getPage(
      'company',
      companyId,
      'deal'
    );
    const dealIds = dealsResponse?.results?.map((result) => result.toObjectId);

    if (!dealIds.length) return [];

    const deals = await fetchDealDetails(dealIds);

    return deals;
  } catch (error) {
    console.error('Error fetching deals for the company:', error);
    return [];
  }
};

async function main() {
  const workspaceId = await fetchWorkspaceId({ slug });
  if (!workspaceId) {
    log(`No workspace found for slug: ${slug}`);
    process.exit();
  }
  log(`ℹ️ Workspace id found: ${workspaceId}`);
  log(`ℹ️ Start fetching companies…`);

  let cursor: string | undefined = '';

  do {
    log(`ℹ️ Fetching batch of 50 companies…`);
    let response: { data: CompanyWithAttributes[]; nextCursor?: string } = {
      data: [],
      nextCursor: '',
    };
    try {
      response = await getCompanies({ workspaceId, cursor, size: 100 });
    } catch (err) {
      response = { data: [], nextCursor: cursor };
    }

    if (!!response.data.length) {
      cursor = undefined;
    }

    for (const company of response.data) {
      if (!company.hubspotId) {
        log(`ℹ️ No HubSpot ID for ${company.name} (ID:${company.id})`);
        continue;
      }

      const deals = await getDealsForCompany(company.hubspotId);

      if (!deals.length) {
        log(`ℹ️ No associated deals for ${company.name} (ID:${company.id})`);
        continue;
      }

      const annualRevenue = deals.reduce((acc, deal) => {
        const dealAmount = Number(deal?.properties?.amount);
        return acc + (Number.isNaN(dealAmount) ? 0 : dealAmount);
      }, 0);

      if (!annualRevenue) {
        log(`ℹ️ No annual revenue for ${company.name} (ID:${company.id})`);
        continue;
      }

      console.log('annualRevenue', annualRevenue);
      const updatedCompany = await updateCompanyArr({
        companyId: company.id,
        arr: annualRevenue,
      });
      if (updatedCompany?.id) {
        log(
          `✅ Company ARR updated: ${company.name} (ID:${company.id}) -> $${annualRevenue}`
        );
      }
    }

    cursor = response.nextCursor;
  } while (typeof cursor === 'string');
  log(`✅ Done`);
}

try {
  main();
} catch (error) {
  console.error('Error in main:', error);
  process.exit();
}
