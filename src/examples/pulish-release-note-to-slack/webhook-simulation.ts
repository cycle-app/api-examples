/**
 * DISCLAIMER
 *
 * This is a simulated example, the script doesn't work, it purpose is to
 * show you how you can use the Cycle API to publish a release note to Slack
 * from a webhook.
 */
import {
  fetchCheckboxAttributes,
  fetchWorkspaceDocTypes,
  readDocWithAttributesById,
  type DocType,
} from '../../utils';

/**
 * Let's start by listening to the incoming webhook from Cycle with the
 * following event: `STATUS_CHANGED`
 *
 * For this event, here is the data you will receive:
 * ```
 * {
 *   type: "status.change",
 *   id: "<statusId>",
 *   previousStatusId: "<previousStatusId>",
 *   docId: "<docId>",
 *   doctypeId: "<doctypeId>",
 *   productId: "<productId>",
 * }
 * ```
 */
const SIMULATED_PAYLOAD = {
  type: 'status.change',
  id: 'U3RhdHVzXzZmNWFhOzhhLWVlMmQtNDdmYy04MTIzLTE4YmMwMjFiYTFlOA==',
  previousStatusId:
    'U3RhdHVzXzA0NDBhNmNkLTI4ZjktNDZiMy05YjQyLWE2YWRkNGU0ZjI0ZA==',
  docId: 'RG9jX2Q2MTYzYzVhLTdkNjItMDk1NS04ZWUwLWM3NTNiZGU0YjE1MA==',
  doctypeId: 'RG9jdHlwZV82YuIxZjE4OS1lODc3LTQ0ZWEtYjczNy1kYjc4YjFkY2M3YmE=',
  productId: 'UHJvZHVjdF85YmZiODg3Yy1mMDM2LTQzYzktOTRkNS0zMzM5MGIxY2MwOTk=',
} as const;

async function main(payload: typeof SIMULATED_PAYLOAD) {
  /**
   * The first think you optionally want to do is to check some conditions:
   * - Is the doc the right type?
   * - Does the doc contain a specific property?
   */

  // @ts-ignore
  const docTypes = (await fetchWorkspaceDocTypes({
    workspaceId: payload.productId,
  })) as DocType[];
  /**
   * Get the doctype you need based the name for instance
   *
   * You can do that function outside of the run time since you probably
   * won't change it often.
   */
  const docTypeId = docTypes.find((d) => d.name === 'Bug');

  // Ignore if the doc is not the right type
  if (payload.doctypeId !== docTypeId?.id) {
    process.exit();
  }

  /**
   * Imagine now you have added a property to the doc called `publish-to-slack`
   */
  // @ts-ignore
  const attributes = await fetchCheckboxAttributes({
    workspaceId: payload.productId,
  });
  /**
   * You can store the attribute definition id to later comparing with the
   * concerned doc
   * If you are wanting to check a value which is from a single select or
   * multi select, you need to fetch the values as well to store the value id
   */
  const publishToSlackAttribute = attributes?.attributeDefinitions.edges.find(
    (edge) => edge.node.name === 'publish-to-slack'
  )?.node;

  // @ts-ignore
  const doc = await readDocWithAttributesById({
    docId: payload.docId,
  });

  if (
    doc?.attributes.edges.some(
      (edge) =>
        edge.node.definition.id === publishToSlackAttribute?.id &&
        edge.node?.checkboxValue?.value === true
    )
  ) {
    process.exit();
  }

  /**
   * Now you can fetch the release note and publish it to Slack
   * You can also include that release content from the previous doc fetching
   * function
   *
   * See the "Manual trigger" example to see how to publish to Slack
   */
}

/**
 * In this example, we will see a simulated example of an incoming webhook from
 * Cycle event.
 * We will see how you can configure the code based on data you need to use.
 *
 * Scenario:
 * - You want to, each time a doc from your roadmap is shipped in production,
 * you want to publish the release note to your Slack channel.
 * - But you don;t want to publish all of it, only some of them.
 * - You will tag with a specific property the doc you want to publish.
 * E.G.
 * - Property: `publish-to-slack` with value `true`
 */
try {
  main(SIMULATED_PAYLOAD);
} catch (error: any) {
  console.error('Error in main', error.message);
  process.exit();
}
