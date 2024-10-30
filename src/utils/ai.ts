import { queryCycle } from './cycle';

type MutationExtractQuotesResponse = {
  data: {
    extractQuotes: boolean;
  };
};

export const extractQuotes = async ({ docId }: { docId: string }) => {
  const query = `
    mutation ExtractQuotes($docId: ID!) {
      extractQuotes(docId: $docId)
    }
  `;

  const variables = {
    docId,
  };

  const response = await queryCycle<MutationExtractQuotesResponse>({
    query,
    variables,
  });

  if (response?.data?.extractQuotes) {
    console.log(`Quotes extracted successfully for docId: ${docId}`);
    return true;
  } else {
    console.error(`Failed to extract quotes for docId: ${docId}`);
    return false;
  }
};

type MutationRemoveQuoteResponse = {
  data: {
    removeQuote: {
      id: string;
    };
  };
};

export const removeQuote = async ({ quoteId }: { quoteId: string }) => {
  const query = `
    mutation RemoveQuote($id: ID!) {
      removeQuote(id: $id) {
        id
      }
    }
  `;
  const variables = { id: quoteId };

  const response = await queryCycle<MutationRemoveQuoteResponse>({
    query,
    variables,
  });

  return response?.data?.removeQuote || null;
};

type MutationVerifyQuoteResponse = {
  data: {
    verifyQuote: {
      id: string;
      title: string;
    };
  };
};

export const verifyQuote = async ({ quoteId }: { quoteId: string }) => {
  const query = `
    mutation VerifyQuote($id: ID!) {
      verifyQuote(id: $id) {
        ...DocTargetDoc
      }
    }

    fragment DocTargetDoc on Doc {
      id
      title
    }
  `;
  const variables = { id: quoteId };

  const response = await queryCycle<MutationVerifyQuoteResponse>({
    query,
    variables,
  });

  return response?.data?.verifyQuote || null;
};
