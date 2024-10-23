import { fetchWorkspaceId, createFeedback, wait } from '../../utils';
import { slug } from '../../config';
import { modjoConfig } from './config';
import dayjs from 'dayjs';
import { ModjoRequestBody, ApiResponse } from './modjo.type';

const fetchModjo = async <T>(
  endpoint: string,
  body: ModjoRequestBody
): Promise<T> => {
  const response = await fetch(`${modjoConfig.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${modjoConfig.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error fetching data from Modjo: ${data.message}`);
  }

  return data;
};

async function fetchModjoCallsForPreviousDay(
  page: number = 1,
  perPage: number = 50
) {
  const startDate = dayjs().subtract(1, 'day').startOf('day'); // Start of yesterday (00:00:00)
  const endDate = dayjs().subtract(1, 'day').endOf('day'); // End of yesterday (23:59:59)

  const formattedStartDate = startDate.toISOString();
  const formattedEndDate = endDate.toISOString();

  const requestBody: ModjoRequestBody = {
    pagination: { page, perPage },
    filters: {
      callStartDateRange: {
        from: formattedStartDate,
        to: formattedEndDate,
      },
      minimumCallDuration: 10, // avoid short calls
    },
    relations: {
      recording: true,
      aiSummary: true,
      transcript: true,
      speakers: true,
    },
  };

  const data = await fetchModjo<ApiResponse>('/v1/calls/exports', requestBody);

  return data;
}

function formatCallToHTML(callDetails: any) {
  let htmlContent = '';

  // Format call details
  htmlContent += `<h2>Call Details</h2>`;
  htmlContent += `<p>Title: ${callDetails.title}</p>`;
  htmlContent += `<p>Duration: ${callDetails.duration || 'Unknown'}</p>`;

  // Format speakers
  htmlContent += `<h3>Speakers</h3><ul>`;
  callDetails.speakers.forEach((speaker: any) => {
    htmlContent += `<li>${speaker.name} (${speaker.email})</li>`;
  });
  htmlContent += `</ul>`;

  // Format transcript if available
  if (callDetails.transcript) {
    htmlContent += `<h3>Transcript</h3>`;
    callDetails.transcript.forEach((segment: any) => {
      htmlContent += `<p><strong>${segment.speakerName}:</strong> ${segment.text}</p>`;
    });
  } else {
    htmlContent += `<p>No transcript available</p>`;
  }

  return htmlContent;
}

async function main() {
  try {
    const workspaceId = await fetchWorkspaceId({ slug });
    if (!workspaceId) {
      console.error('No workspace ID found');
      return;
    }

    console.log('Fetching calls from Modjo…');

    let page = 1;
    let fetchCalls = true;
    let callsFetched = 0;
    let totalCallsFetched = 0;

    do {
      const modjoCalls = await fetchModjoCallsForPreviousDay(page);
      if ('error' in modjoCalls) {
        console.error('Error fetching calls from Modjo:', modjoCalls);
        fetchCalls = false;
      }
      if ('values' in modjoCalls) {
        const calls = modjoCalls.values || [];
        callsFetched = calls.length;
        totalCallsFetched += callsFetched;

        console.log(`Fetched ${callsFetched} call(s) on page ${page}`);
        for (const call of calls) {
          await wait(500); // To avoid rate limiting

          const content = formatCallToHTML(call);
          const customerEmail = call.relations.contacts?.[0]?.email || '';
          // const customerEmail = call.speakers.find((s: any) => s.type === 'External')?.email || 'unknown@example.com';

          const feedback = await createFeedback({
            workspaceId,
            title: call.title || 'Modjo Call',
            attributes: [], // Add any relevant attributes here
            // companyName: call.company?.name || 'Unknown Company',
            customerEmail,
            sourceUrl: 'https://modjo.ai',
            content,
          });

          if (feedback) {
            console.log(
              `Successfully created feedback for call: ${call.title}`
            );
          } else {
            console.log(`Failed to create feedback for call: ${call.title}`);
          }
        }
        page += 1;
      } else {
        console.error('Error fetching calls from Modjo:', modjoCalls);
        fetchCalls = false;
      }
    } while (fetchCalls);

    console.log(
      `Finished fetching and pushing ${totalCallsFetched} calls to Cycle`
    );
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

main();
