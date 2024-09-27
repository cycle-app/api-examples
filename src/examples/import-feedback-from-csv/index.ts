import {
  formatDateAndTime,
  wait,
  createAttribute,
  fetchWorkspaceId,
  fetchWorkspaceDocTypes,
  linkAttributeToDocType,
  createFeedback,
  extractDataFromCSV,
} from '../../utils';
import { slug } from '../../config';
import { config, type CSVDataType } from './config';
import path from 'path';

const createImportAttribute = async (workspaceId: string) => {
  const [formattedDate, formattedTime] = formatDateAndTime(
    new Date(Date.now())
  );
  const attribute = await createAttribute({
    workspaceId,
    attributeName: `Imported on ${formattedDate} at ${formattedTime}`,
    attributeDescription: '',
  });
  return attribute;
};

const fetchDocTypes = async (workspaceId: string) => {
  const docTypes = await fetchWorkspaceDocTypes({
    workspaceId,
  });
  return {
    feedback: docTypes.find((d) => d.name === 'Feedback'),
  };
};

const main = async () => {
  try {
    const workspaceId = await fetchWorkspaceId({ slug });
    if (!workspaceId) {
      console.error(`No workspace found for slug: ${slug}`);
      process.exit();
    }
    console.info(`ℹ️ Workspace id found: ${workspaceId}`);

    const importAttribute = await createImportAttribute(workspaceId);
    if (!importAttribute) {
      console.error(`Error during attribute creation`);
      process.exit();
    }
    console.info(`Import attribute created: ${importAttribute.name}`);

    const { feedback } = await fetchDocTypes(workspaceId);

    // Link to feedback
    if (feedback) {
      await linkAttributeToDocType({
        attributeDefinitionId: importAttribute.id,
        doctypeId: feedback.id,
      });
      console.info(
        `✅ Import attribute successfully linked to ${feedback.name} doc type`
      );
    }

    console.info(`ℹ️ reading from CSV…`);

    const csvFilePath = path.join(
      __dirname,
      `/input/${config.csvFileName}.csv`
    );
    //  './src/scripts/update-customers/cs-team.csv';
    const data = await extractDataFromCSV<CSVDataType>(csvFilePath);

    if (!data || !('length' in data)) {
      console.error(`❌ Error during CSV extraction`);
      process.exit();
    }

    const importAttributeData = {
      attributeDefinitionId: importAttribute.id,
      value: { checkbox: true },
    };
    const feedbackCreated = [];

    for (const row of data) {
      const feedback = await createFeedback({
        workspaceId,
        attributes: [importAttributeData],
        content: row['Text Content'],
        sourceUrl: `https://product.cycle.app/app/${slug}`,
        title: row['Node Title'],
        customerEmail: row['Customer Email'],
      });
      feedbackCreated.push(feedback);

      await wait(200);
    }
    console.info(`✅ ${feedbackCreated.length} Imported feedbacks`);
  } catch (error: any) {
    console.error('Error', error.message);
  }
};

main();
