// Assuming token is stored in Script Properties for security purposes
const token = PropertiesService.getScriptProperties().getProperty('token');
const graphqlEndpoint = 'https://api.product.cycle.app/graphql';
const MAX_RETRIES = 3;

function queryCycle(query, variables) {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;

      if (attempt > 1) {
        console.log(`Attempt ${attempt} to fetch data from ${graphqlEndpoint}`);
      }

      const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          query: query,
          variables: variables,
        }),
        muteHttpExceptions: true, // So we can capture non-200 responses
      };
      if (token) {
        options.headers = { Authorization: 'Bearer ' + token };
      }

      const response = UrlFetchApp.fetch(graphqlEndpoint, options);
      const responseCode = response.getResponseCode();
      if (responseCode !== 200) {
        const errorText = response.getContentText();

        if (attempt >= MAX_RETRIES) {
          throw new Error(`HTTP Error ${responseCode}: ${errorText}`);
        } else {
          console.error(
            `Error fetching data (HTTP ${responseCode}), trying again…`
          );
        }
      } else {
        const responseData = JSON.parse(response.getContentText());
        return responseData;
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed due to error:`, error);
      if (attempt >= MAX_RETRIES) {
        throw new Error(error.message);
      }
    }

    Utilities.sleep(1000);
  }

  return null;
}

function fetchWorkspaceId(slug) {
  const query = `
    query workspaceBySlug($slug: DefaultString!) {
      getProductBySlug(slug: $slug) {
        id
      }
    }
  `;
  const variables = { slug };
  const response = queryCycle(query, variables);
  let workspaceId = null;
  if (
    response &&
    response.data &&
    response.data.getProductBySlug &&
    response.data.getProductBySlug.id
  ) {
    workspaceId = response.data.getProductBySlug.id;
  }
  return workspaceId;
}

function createFeedback({
  workspaceId,
  title,
  attributes,
  companyName,
  customerEmail,
  sourceUrl,
  content,
}) {
  const query = `
  mutation createFeedback(
    $workspaceId: ID!
    $title: DefaultString!
    $company: CompanyInput
    $customerEmail: EmailAddress
    $source: SourceInput!
    $content: DefaultString
    $attributes: [AddNewDocAttributeValue!]
  ) {
    createFeedback(
      productId: $workspaceId
      title: $title
      company: $company
      customer: $customerEmail
      source: $source
      contentHTML: $content
      attributes: $attributes
    ) {
      id
      title
      customer {
        id
        name
        email
        company {
          id
          name
        }
      }
    }
  }
`;
  const variables = {
    workspaceId,
    title,
    company: companyName ? { name: companyName } : undefined,
    customerEmail: companyName ? undefined : customerEmail,
    source: { sourceWeb: { url: sourceUrl } },
    content,
    attributes,
  };

  const response = queryCycle(query, variables);
  return response?.data?.createFeedback || null;
}
