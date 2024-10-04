import {
  fetchWorkspaceId,
  getCompanies,
  updateCompany,
  updateCompanyAttribute,
  createCompany,
  wait,
} from '../../utils';
import { slug } from '../../config';
import { config } from './config';
import { Company, PlanhatUser } from './planhat.types';

const fetchPlanhat = async <T>(
  endpoint: string,
  body: any | null = null
): Promise<T> => {
  const requestOptions = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(
    `https://api.planhat.com/${endpoint}`,
    requestOptions
  );
  const json = await response.json();
  return json;
};

const fetchAllCompanies = async () => {
  let allCompanies: Company[] = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;

  while (hasMore) {
    const response = await fetchPlanhat<Company[]>(
      `companies?limit=${limit}&offset=${offset}`
    );

    if (response.length === 0) {
      hasMore = false;
    } else {
      allCompanies = [...allCompanies, ...response];
      offset += limit;
    }
  }
  return allCompanies;
};

const getUserById = async (userId: string): Promise<PlanhatUser> => {
  const user = await fetchPlanhat<PlanhatUser>(`users/${userId}`);
  return user;
};

const main = async () => {
  try {
    const allCompanies = await fetchAllCompanies();
    console.info(`Fetched ${allCompanies.length} companies`);
    const workspaceId = await fetchWorkspaceId({ slug });
    if (!workspaceId) {
      console.error(`No workspace found for slug: ${slug}`);
      process.exit();
    }
    console.info(`ℹ️ Workspace id found: ${workspaceId}`);

    for (const company of allCompanies) {
      await wait(1000);
      console.info(`🔍 Processing company: ${company.name}`);
      // Filter out companies that are not in the 'churn' or 'exclude' phase
      const phase = company.phase?.trim().toLowerCase();
      if (phase === 'churn' || phase === 'exclude') {
        console.info(`ℹ️ Skipping company, phase: ${phase}`);
        continue;
      }

      let owner = null;
      if (company.owner) {
        owner = await getUserById(company.owner);
        console.info(`ℹ️ Owner found: ${owner.firstName} ${owner.lastName}`);
      }
      let implLead = null;
      if (company.custom?.['Imp lead']) {
        implLead = await getUserById(company.custom['Imp lead']);
        console.info(
          `ℹ️ Impl lead found: ${implLead.firstName} ${implLead.lastName}`
        );
      }

      const companyNameSearch = company.name.trim().toLowerCase();
      const existingCompany = await getCompanies({
        workspaceId,
        search: companyNameSearch,
      });

      let cycleCompany = existingCompany.data?.[0];

      if (!cycleCompany) {
        const newCompany = await createCompany({
          name: company.name,
          workspaceId,
        });
        if (newCompany) {
          console.info(`🆕 Created company: ${company.name}`);
          cycleCompany = newCompany;
        }
      }

      const updateArr = await updateCompany({
        companyId: cycleCompany.id,
        data: {
          arr: company.arr || 0,
          externalId: {
            custom: company._id,
          },
        },
      });
      console.info(`ℹ️ Updated company ARR: ${updateArr.data?.name}`);

      if (config.customAttributeId.phase) {
        await updateCompanyAttribute({
          companyId: cycleCompany.id,
          attributeDefinitionId: config.customAttributeId.phase,
          value: company.phase || '',
        });
        console.info(`ℹ️ Updated company phase: ${company.phase}`);
      }

      if (owner && config.customAttributeId.owner) {
        await updateCompanyAttribute({
          companyId: cycleCompany.id,
          attributeDefinitionId: config.customAttributeId.owner,
          value: `${owner.firstName} ${owner.lastName}`,
        });
        console.info(`ℹ️ Updated company owner: ${owner.firstName}`);
      }

      if (implLead && config.customAttributeId.implLead) {
        await updateCompanyAttribute({
          companyId: cycleCompany.id,
          attributeDefinitionId: config.customAttributeId.implLead,
          value: `${implLead.firstName} ${implLead.lastName}`,
        });
        console.info(`ℹ️ Updated company impl lead: ${implLead.firstName}`);
      }
    }

    console.info(`✅ Done`);
  } catch (error: any) {
    console.error('Error', error.message);
  }
};

main();
