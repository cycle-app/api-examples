import {
  fetchReleaseNotes,
  fetchReleases,
  fetchWorkspaceDocTypes,
  fetchWorkspaceId,
  generateCSV,
  readDocChildren,
  readDocWithCustomerByDocTargetId,
  type Doc,
  // type DocWithCustomer,
  type Release,
  type ReleaseNoteWithDoc,
  wait,
  type DocWithCustomer,
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

  while (hasNextPage) {
    const response = await fetchReleases({ workspaceId, cursor });
    const releases =
      response?.node?.releases.edges.map((edge) => edge.node) || [];

    allReleases = [...allReleases, ...releases];
    hasNextPage = response?.node.releases.pageInfo.hasNextPage || false;
    cursor = response?.node.releases.pageInfo.endCursor;
  }

  return allReleases;
};

const fetchAllReleaseNotesByRelease = async (releaseId: string) => {
  let allReleaseNotes: ReleaseNoteWithDoc[] = [];
  let cursor: string | undefined = '';
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetchReleaseNotes({ releaseId, cursor });
    const releaseNotes =
      response.release.releaseNotes.edges.map((edge) => edge.node) || [];

    allReleaseNotes = [...allReleaseNotes, ...releaseNotes];
    hasNextPage = response?.release.releaseNotes.pageInfo.hasNextPage || false;
    cursor = response?.release.releaseNotes.pageInfo.endCursor;
  }

  return allReleaseNotes;
};

const fetchAllChildren = async (
  releaseDocId: string,
  insightDocTypeId: string
) => {
  let allChildren: Doc[] = [];
  let cursor: string | undefined = '';
  let hasNextPage = true;

  while (hasNextPage) {
    const childrenResult = await readDocChildren({
      docId: releaseDocId,
      childrenDocTypeId: insightDocTypeId,
    });
    const children =
      childrenResult.children.edges.map((edge) => edge.node) || [];
    allChildren = [...allChildren, ...children];
    hasNextPage = childrenResult.children.pageInfo.hasNextPage || false;
    cursor = childrenResult.children.pageInfo.endCursor;
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

  /**
   * Fetch all releases for the workspace
   */
  const releasesResults = await fetchAllReleases(workspaceId);
  // Exclude the "No release" release (the only one without a date)
  const releases = releasesResults.filter((r) => !!r.date);
  console.info(`ℹ️ Releases found: ${releases.length}`);

  /**
   * For each release, fetch all release notes with the associated doc
   */
  const releaseNotesTotal = [];
  const releaseNotesByRelease: { [key: string]: ReleaseNoteWithDoc[] } = {};
  for (const release of releases) {
    await wait(500);
    const releaseNodeWithDocResult = await fetchAllReleaseNotesByRelease(
      release.id
    );
    releaseNotesTotal.push(...releaseNodeWithDocResult);
    if (releaseNotesByRelease[release.id]) {
      releaseNotesByRelease[release.id].push(...releaseNodeWithDocResult);
    } else {
      releaseNotesByRelease[release.id] = releaseNodeWithDocResult;
    }
  }
  console.info(`ℹ️ Release notes found: ${releaseNotesTotal.length}`);

  /**
   * For each release note, fetch all insights and their associated customers
   */
  const insights = [];
  const insightsByReleaseNote: { [releaseNoteId: string]: Doc[] } = {};
  for (const releaseNote of releaseNotesTotal) {
    await wait(500);
    const children = await fetchAllChildren(
      releaseNote.doc.id,
      docTypes.insight.id
    );
    insights.push(...children);
    insightsByReleaseNote[releaseNote.id] = children;
  }

  /**
   * For each insight, fetch feedback linked who contain the customer and we
   * put them together
   */
  const feedbacksWithInsights: {
    insight: Doc;
    feedback: DocWithCustomer;
  }[] = [];
  for (const insight of insights) {
    await wait(500);
    const doc = await readDocWithCustomerByDocTargetId({
      docId: insight.id,
    });
    feedbacksWithInsights.push({ insight, feedback: doc.docSource.doc });
  }
  console.info(`ℹ️ Feedbacks found: ${feedbacksWithInsights.length}`);

  /**
   * Generate a CSV with all the data
   */
  const data: {
    releaseId: string;
    releaseDate: string;
    releaseTitle: string;
    releaseNoteId: string;
    releaseNoteTitle: string;
    nbQuotes: string;
    nbFeedback: string;
    nbCustomer: string;
    nbCompany: string;
  }[] = [];

  releases.forEach((release) => {
    const releaseId = release.id;
    const releaseDate = release.date;
    const releaseTitle = release.title;
    const releaseNotes = releaseNotesByRelease[releaseId];

    releaseNotes.forEach((releaseNote) => {
      const insights = insightsByReleaseNote[releaseNote.id];
      const feedbacks = insights.map((insight) => {
        return feedbacksWithInsights.find(
          (item) => item.insight.id === insight.id
        );
      });

      const uniqueCustomers = new Set(
        feedbacks.map((item) => item?.feedback.customer?.id || '')
      );
      const uniqueCompanies = new Set(
        feedbacks.map((item) => item?.feedback.customer.company?.id || '')
      );

      data.push({
        releaseId,
        releaseDate,
        releaseTitle,
        releaseNoteId: releaseNote.id,
        releaseNoteTitle: releaseNote.title,
        nbQuotes: insights.length.toString(),
        nbFeedback: feedbacks.length.toString(),
        nbCustomer: uniqueCustomers.size.toString(),
        nbCompany: uniqueCompanies.size.toString(),
      });
    });
  });

  await generateCSV(
    './src/examples/read-release-customers/output/test.csv',
    data,
    [
      { id: 'releaseId', title: 'Release ID' },
      { id: 'releaseDate', title: 'Release Date' },
      { id: 'releaseTitle', title: 'Release Title' },
      { id: 'releaseNoteId', title: 'Release Note ID' },
      { id: 'releaseNoteTitle', title: 'Release Note Title' },
      { id: 'nbQuotes', title: 'Quote amount' },
      { id: 'nbFeedback', title: 'Feedback amount' },
      { id: 'nbCustomer', title: 'Customer amount' },
      { id: 'nbCompany', title: 'Company amount' },
    ]
  );

  const data2: { key: string; value: string }[] = [];

  releases.forEach((release) => {
    const releaseId = release.id;
    const releaseDate = release.date;
    const releaseTitle = release.title || 'Untitled Release';
    const releaseNotes = releaseNotesByRelease[releaseId];

    releaseNotes.forEach((releaseNote) => {
      const insights = insightsByReleaseNote[releaseNote.id];
      const feedbacks = insights.map((insight) => {
        return feedbacksWithInsights.find(
          (item) => item.insight.id === insight.id
        );
      });

      const uniqueCustomers = new Set(
        feedbacks.map((item) => item?.feedback.customer?.id || '')
      );
      const uniqueCompanies = new Set(
        feedbacks.map((item) => item?.feedback.customer.company?.id || '')
      );

      // Push each field as a separate entry into the data array
      data2.push({ key: 'Release ID', value: releaseId });
      data2.push({ key: 'Release Date', value: releaseDate });
      data2.push({ key: 'Release Title', value: releaseTitle });
      data2.push({ key: 'Release Note ID', value: releaseNote.id });
      data2.push({ key: 'Release Note Title', value: releaseNote.title });
      data2.push({ key: 'Quote amount', value: insights.length.toString() });
      data2.push({
        key: 'Feedback amount',
        value: feedbacks.length.toString(),
      });
      data2.push({
        key: 'Customer amount',
        value: uniqueCustomers.size.toString(),
      });
      data2.push({
        key: 'Company amount',
        value: uniqueCompanies.size.toString(),
      });
    });
  });

  await generateCSV(
    './src/examples/read-release-customers/output/test2.csv',
    data2,
    [
      { id: 'key', title: 'Key' },
      { id: 'value', title: 'Value' },
    ]
  );

  console.info(`✅ Done`);
}

try {
  main();
} catch (error: any) {
  console.error('Error in main', error.message);
}
