import {
  fetchReleaseNotes,
  fetchReleases,
  fetchWorkspaceDocTypes,
  fetchWorkspaceId,
  generateCSV,
  readDocChildrenWithSource,
  type DocWithSourceDoc,
  type Release,
  type ReleaseNoteWithDoc,
  wait,
} from '../../utils';
import { slug } from '../../config';

const fetchDocTypes = async (workspaceId: string) => {
  const docTypes = await fetchWorkspaceDocTypes({
    workspaceId,
  });
  return {
    feedback: docTypes.find((d) => d.name === 'Feedback'),
    insight: docTypes.find((d) => d.name === 'Insight'),
  };
};

const fetchAllReleases = async (workspaceId: string): Promise<Release[]> => {
  let allReleases: Release[] = [];
  let cursor: string | undefined = '';
  let hasNextPage = true;
  let page = 0;

  while (hasNextPage) {
    const response = await fetchReleases({ workspaceId, cursor });
    const releases =
      response?.node?.releases.edges.map((edge) => edge.node) || [];

    allReleases = [...allReleases, ...releases];
    hasNextPage = response?.node.releases.pageInfo.hasNextPage || false;
    cursor = response?.node.releases.pageInfo.endCursor;
    page += 1;
    console.info(`ℹ️ Page ${page} - Releases found: ${allReleases.length}`);
  }

  return allReleases;
};

const fetchAllReleaseNotesByRelease = async (releaseId: string) => {
  let allReleaseNotes: ReleaseNoteWithDoc[] = [];
  let cursor: string | undefined = '';
  let hasNextPage = true;
  let page = 0;

  while (hasNextPage) {
    const response = await fetchReleaseNotes({ releaseId, cursor });
    const releaseNotes =
      response?.release.releaseNotes.edges.map((edge) => edge.node) || [];

    allReleaseNotes = [...allReleaseNotes, ...releaseNotes];
    hasNextPage = response?.release.releaseNotes.pageInfo.hasNextPage || false;
    cursor = response?.release.releaseNotes.pageInfo.endCursor;
    page += 1;
    console.info(
      `ℹ️ Page ${page} - Release notes found: ${allReleaseNotes.length}`
    );
  }

  return allReleaseNotes;
};

const fetchAllChildren = async (
  releaseDocId: string,
  insightDocTypeId: string
) => {
  let allChildren: DocWithSourceDoc[] = [];
  let cursor: string | undefined = '';
  let hasNextPage = true;
  let page = 0;

  while (hasNextPage) {
    const childrenResult = await readDocChildrenWithSource({
      docId: releaseDocId,
      childrenDocTypeId: insightDocTypeId,
    });
    const children =
      childrenResult?.children.edges.map((edge) => edge.node) || [];
    allChildren = [...allChildren, ...children];
    hasNextPage = childrenResult?.children.pageInfo.hasNextPage || false;
    cursor = childrenResult?.children.pageInfo.endCursor;
    page += 1;
    console.info(`ℹ️ Page ${page} - Children found: ${allChildren.length}`);
  }

  return allChildren;
};

async function main() {
  const workspaceId = await fetchWorkspaceId({ slug });
  if (!workspaceId) {
    console.error(`No workspace found for slug: ${slug}`);
    process.exit();
  }
  console.info(`ℹ️ Workspace id found: ${workspaceId}`);

  const docTypes = await fetchDocTypes(workspaceId);
  if (!docTypes.feedback || !docTypes.insight) {
    console.error(`Feedback/Insight doc types not found for slug: ${slug}`);
    process.exit();
  }
  console.info(`ℹ️ Doc types found`);

  const state: {
    [releaseId: string]: {
      data: Release;
      notes: {
        [releaseNoteId: string]: {
          data: ReleaseNoteWithDoc;
          insights: {
            [insightId: string]: {
              data: DocWithSourceDoc;
            };
          };
        };
      };
    };
  } = {};

  /**
   * Fetch all releases for the workspace
   */
  const releasesResults = await fetchAllReleases(workspaceId);
  releasesResults.forEach((release) => {
    if (release.date) {
      state[release.id] = {
        data: release,
        notes: {},
      };
    }
  });
  console.info(`ℹ️ Releases found: ${Object.keys(state).length}`);

  /**
   * For each release, fetch all release notes with the associated doc
   */
  let releaseNotesTotal = 0;
  for (const releaseData of Object.values(state)) {
    await wait(500);
    const releaseNodeWithDocResult = await fetchAllReleaseNotesByRelease(
      releaseData.data.id
    );
    state[releaseData.data.id].notes = releaseNodeWithDocResult.reduce(
      (acc, releaseNote) => {
        return {
          ...acc,
          [releaseNote.id]: {
            data: releaseNote,
            insights: [],
          },
        };
      },
      {}
    );
    releaseNotesTotal += releaseNodeWithDocResult.length;
  }
  console.info(`ℹ️ Release notes found: ${releaseNotesTotal}`);

  /**
   * For each release note, fetch all insights and their associated customers
   */
  let insightsTotal = 0;
  for (const releaseData of Object.values(state)) {
    for (const releaseNoteData of Object.values(releaseData.notes)) {
      await wait(500);
      const children = await fetchAllChildren(
        releaseNoteData.data.doc.id,
        docTypes.insight.id
      );
      for (const child of children) {
        state[releaseData.data.id].notes[releaseNoteData.data.id].insights[
          child.id
        ] = { data: child };
      }
      insightsTotal += children.length;
    }
  }
  console.info(`ℹ️ Insights found: ${insightsTotal}`);

  /**
   * Generate a CSV with all the data
   */
  const globalStatsCSV = await generateCSV(
    './src/examples/read-release-customers/output/global_stats.csv',
    [
      { id: 'keyId', title: '' },
      { id: 'amount', title: 'Amount' },
    ],
    true
  );
  await globalStatsCSV.writeRecords([
    { keyId: '', amount: 'Amount' },
    { keyId: 'Releases', amount: Object.keys(state).length },
    { keyId: 'Release Notes', amount: releaseNotesTotal },
    { keyId: 'Insights Amount', amount: insightsTotal },
  ]);

  const byReleaseStatsCSV = await generateCSV(
    './src/examples/read-release-customers/output/by_releases_stats.csv',
    [
      { id: 'releaseId', title: 'ReleaseId' },
      { id: 'releaseDate', title: 'Date' },
      { id: 'releaseTitle', title: 'Title' },
      { id: 'releaseNotesAmount', title: 'Release Notes Amount' },
      { id: 'insightsAmount', title: 'Insights Amount' },
      { id: 'uniqueCustomerAmount', title: 'Unique Customers Amount' },
      { id: 'uniqueCompaniesAmount', title: 'Unique Companies Amount' },
    ],
    true
  );
  await byReleaseStatsCSV.writeRecords([
    {
      releaseId: 'Release ID',
      releaseDate: 'Release Date',
      releaseTitle: 'Release Title',
      releaseNotesAmount: 'Release Notes Amount',
      insightsAmount: 'Insights Amount',
      uniqueCustomerAmount: 'Unique Customers Amount',
      uniqueCompaniesAmount: 'Unique Companies Amount',
    },
  ]);

  const byReleaseNotesStatsCSV = await generateCSV(
    './src/examples/read-release-customers/output/by_release_notes_stats.csv',
    [
      { id: 'releaseId', title: 'ReleaseId' },
      { id: 'releaseDate', title: 'ReleaseDate' },
      { id: 'releaseNoteId', title: 'ReleaseNoteId' },
      { id: 'releaseNoteTitle', title: 'Title' },
      { id: 'insightsAmount', title: 'Insights Amount' },
      { id: 'uniqueCustomerAmount', title: 'Unique Customers Amount' },
      { id: 'uniqueCompaniesAmount', title: 'Unique Companies Amount' },
    ],
    true
  );
  await byReleaseNotesStatsCSV.writeRecords([
    {
      releaseId: 'Release ID',
      releaseDate: 'Release Date',
      releaseNoteId: 'Release Note ID',
      releaseNoteTitle: 'Release Note Title',
      insightsAmount: 'Insights Amount',
      uniqueCustomerAmount: 'Unique Customers Amount',
      uniqueCompaniesAmount: 'Unique Companies Amount',
    },
  ]);

  Object.values(state).forEach(async (releaseData) => {
    let insightsAmount = 0;
    const customers = new Set<string>();
    const companies = new Set<string>();

    Object.values(releaseData.notes).forEach(async (releaseNoteData) => {
      const customersByReleaseNote = new Set<string>();
      const companiesByReleaseNote = new Set<string>();
      Object.values(releaseNoteData.insights).forEach(async (insightData) => {
        insightsAmount += 1;
        customers.add(insightData.data.docSource?.doc?.customer?.id || '');
        customersByReleaseNote.add(
          insightData.data.docSource?.doc?.customer?.id || ''
        );
        companies.add(
          insightData.data.docSource?.doc?.customer?.company?.id || ''
        );
        companiesByReleaseNote.add(
          insightData.data.docSource?.doc?.customer?.company?.id || ''
        );
      });

      await byReleaseNotesStatsCSV.writeRecords([
        {
          releaseId: releaseData.data.id,
          releaseDate: releaseData.data.date,
          releaseNoteId: releaseNoteData.data.id,
          releaseNoteTitle: releaseNoteData.data.title,
          insightsAmount: Object.keys(releaseNoteData.insights).length,
          uniqueCustomerAmount: customersByReleaseNote.size,
          uniqueCompaniesAmount: companiesByReleaseNote.size,
        },
      ]);
    });

    await byReleaseStatsCSV.writeRecords([
      {
        releaseId: releaseData.data.id,
        releaseDate: releaseData.data.date,
        releaseTitle: releaseData.data.title,
        releaseNotesAmount: Object.keys(releaseData.notes).length,
        insightsAmount,
        uniqueCustomerAmount: customers.size,
        uniqueCompaniesAmount: companies.size,
      },
    ]);
  });

  console.info(`✅ Done`);
}

try {
  main();
} catch (error: any) {
  console.error('Error in main', error.message);
  process.exit();
}
