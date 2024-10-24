import {
  fetchWorkspaceId,
  readDocWithReporterAndDocTypeById,
  updateDocSelectAttribute,
} from '../../utils';
import { slug } from '../../config';
import { config } from './config';

/**
 * On every doc creation
 * @see https://docs.cycle.app/the-graphql-api/webhooks#doc_created
 */

type CycleDocCreatedPayload = {
  type: 'doc.create';
  id: string;
  doctypeId: string;
  productId: string;
};

async function onDocCreated(payload: CycleDocCreatedPayload) {
  try {
    /**
     * If the event is not a doc creation, we can stop here
     */
    if (payload.type !== 'doc.create') {
      console.log('Not a doc creation event');
      return;
    }

    const workspaceId = await fetchWorkspaceId({ slug });
    if (!workspaceId) {
      console.error(`No workspace found for slug: ${slug}`);
      return;
    }

    /**
     * If for any reason webhook is plugged on your URL from another workspace
     */
    if (payload.productId !== workspaceId) {
      console.log('Not a doc from the right workspace');
      return;
    }

    const doc = await readDocWithReporterAndDocTypeById({ docId: payload.id });

    /**
     * If the doc is not a feedback, we can stop here
     */
    if (doc?.doctype.name !== config.docTypeName) {
      console.log('Not a feedback');
      return;
    }

    const value = config.values.find((v) =>
      v.customerEmails.includes(doc.assignee.email)
    );

    if (!value) {
      console.log('No value found for the reporter email');
      return;
    }

    /**
     * Assign the value as property to the feedback
     */
    const updatedDocResponse = await updateDocSelectAttribute({
      attributeDefinitionId: config.propertyDefinitionId,
      docId: payload.id,
      selectValueId: value.id,
    });

    console.log('Doc property updated', updatedDocResponse?.id);
  } catch (e) {
    console.error('Error in catch');
    console.error(e);
  }
}

/**
 * Trigger the function with mock data
 */
onDocCreated({
  type: 'doc.create',
  productId: '[PRODUCT_ID]',
  doctypeId: '[DOC_TYPE_ID]',
  id: '[DOC_ID]',
});
