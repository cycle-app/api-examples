import {
  extractQuotes,
  fetchWorkspaceId,
  removeQuote,
  searchDocs,
  wait,
} from '../../utils';
import { slug } from '../../config';

const feedbackDocTypeId = '';
const toProcessStatusId = '';

async function main() {
  if (!feedbackDocTypeId) {
    console.error('Please provide a feedback doc type id.');
    return;
  }

  if (!toProcessStatusId) {
    console.error('Please provide a "to-process" status id.');
    return;
  }

  const workspaceId = await fetchWorkspaceId({ slug });
  if (!workspaceId) {
    console.error(`No workspace found for slug: ${slug}`);
    return;
  }
  console.info(`ℹ️ Workspace id found: ${workspaceId}`);

  const searchParams = {
    productId: workspaceId,
    doctypeIds: [feedbackDocTypeId],
    statusIds: [toProcessStatusId],
    size: 50,
    cursor: '',
  };

  try {
    let hasNextPage = true;
    let cursor = '';

    while (hasNextPage) {
      const response = await searchDocs({ ...searchParams, cursor });
      if (!response) {
        console.log("No feedback found in 'to-process' status.");
        break;
      }

      for (const edge of response.edges) {
        const feedback = edge.node.doc;

        if (feedback.quotes?.edges.length) {
          for (const quoteEdge of feedback.quotes.edges) {
            const quote = quoteEdge.node;
            await wait(250);
            await removeQuote({ quoteId: quote.id });
            console.log(`Quote removed: ${quote.id}`);
          }
        }

        await extractQuotes({ docId: feedback.id });
      }

      hasNextPage = response.pageInfo.hasNextPage;
      cursor = response.pageInfo.endCursor;
    }
    console.log('All feedback processed.');
  } catch (error) {
    console.error("Error fetching 'to-process' feedback:", error);
  }
}

main();
