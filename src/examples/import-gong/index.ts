import { fetchWorkspaceId, createFeedback } from '../../utils';
import { slug } from '../../config';
import { gongConfig } from './config';
import type {
  Call,
  CallResponse,
  CallTranscriptResponse,
  CallTranscript,
  CallDetailsResponse,
  CallDetails,
} from './gong.type';

function generateGongAuthHeader() {
  const token = `${gongConfig.accessKey}:${gongConfig.secretKey}`;
  const encodedToken = btoa(token);
  return `Basic ${encodedToken}`;
}

const fetchGong = async <T>(
  endpoint: string,
  body: any | null = null
): Promise<T> => {
  const requestOptions = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: generateGongAuthHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(
    `${gongConfig.baseUrl}/v2/${endpoint}`,
    requestOptions
  );
  const json = await response.json();
  return json;
};

const getLastPeriodCalls = async (
  period: number,
  unit: 'days' | 'weeks' | 'months' | 'years' = 'days',
  cursor: string | null = null,
  accumulatedCalls: Call[] = []
) => {
  const endDate = new Date();
  let startDate = new Date();

  switch (unit) {
    case 'years':
      startDate.setFullYear(endDate.getFullYear() - period);
      break;
    case 'months':
      startDate.setMonth(endDate.getMonth() - period);
      break;
    case 'weeks':
      startDate.setDate(endDate.getDate() - period * 7);
      break;
    default:
    case 'days':
      startDate.setDate(endDate.getDate() - period);
      break;
  }

  const queryString = `fromDateTime=${
    startDate.toISOString().split('T')[0]
  }T00:00:00Z&toDateTime=${endDate.toISOString().split('T')[0]}T00:00:00Z${
    cursor ? `&cursor=${cursor}` : ''
  }`;

  const callsResponse: CallResponse = await fetchGong(`calls?${queryString}`);

  if (!('records' in callsResponse)) {
    throw new Error(`Error fetching calls: ${callsResponse.errors.join(', ')}`);
  }

  const totalCalls = [...accumulatedCalls, ...callsResponse.calls];
  const remainingRecords =
    callsResponse.records.totalRecords - totalCalls.length;

  if (remainingRecords > 0 && callsResponse.records.cursor) {
    return await getLastPeriodCalls(
      period,
      unit,
      callsResponse.records.cursor,
      totalCalls
    );
  }

  return totalCalls;
};

const retrieveCallTranscript = async (callId: string) => {
  const response: CallTranscriptResponse = await fetchGong(`calls/transcript`, {
    filter: {
      callIds: [callId],
    },
  });
  if ('callTranscripts' in response) {
    return response.callTranscripts[0].transcript;
  }
  return null;
};

const retrieveCallDetails = async (callId: string) => {
  const response: CallDetailsResponse = await fetchGong(`calls/extensive`, {
    filter: {
      callIds: [callId],
    },
    contentSelector: {
      context: 'Extended',
      exposedFields: {
        parties: true,
        content: {
          brief: true,
        },
      },
    },
  });
  if ('calls' in response) {
    return response.calls[0];
  }
  return null;
};

const formatHeaderCallToHTML = (data: CallDetails) => {
  let htmlContent = '';
  htmlContent += `<h3>Speakers: ${data.parties?.length}</h3>`;
  htmlContent += `<ul>`;
  for (const parti of data?.parties || []) {
    htmlContent += `<li>`;
    htmlContent += `${parti.affiliation}: ${parti.name}${
      parti.title ? ` - (${parti.title})` : ''
    }`;
    htmlContent += `</li>`;
  }
  htmlContent += `</ul>`;
  htmlContent += `<h3>Brief</h3>`;
  htmlContent += `<p>${data.content?.brief || 'No brief found'}</p>`;

  return htmlContent;
};

const formatTranscriptToHTML = (
  transcriptData: CallTranscript['transcript'],
  parties: CallDetails['parties']
) => {
  let htmlContent = '';

  transcriptData.forEach((transcriptPart) => {
    const parti = parties?.find(
      (p) => p.speakerId === transcriptPart.speakerId
    );
    htmlContent += `<div>`;
    htmlContent += `<h4>Speaker: ${parti ? parti.name : 'Unknown'}</h4>`;
    transcriptPart.sentences.forEach((sentence) => {
      const startTime = formatTime(sentence.start);
      const endTime = formatTime(sentence.end);
      htmlContent += `<p><strong>${startTime} - ${endTime}:</strong> ${sentence.text}</p>`;
    });
    htmlContent += `</div>`;
  });

  return htmlContent;
};

function retrieveCustomerEmail(parties: CallDetails['parties']) {
  if (!parties?.length) return null;
  const externalPartiEmail = parties.find(
    (p) => p.affiliation === 'External'
  )?.emailAddress;
  const fallbackEmail = parties[0]?.emailAddress;
  return externalPartiEmail || fallbackEmail;
}

function formatTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.length === 1 ? '0' : ''}${seconds}`;
}

const main = async () => {
  const feedbackImported = [];
  if (!gongConfig.accessKey || !gongConfig.secretKey || !gongConfig.baseUrl) {
    console.error(
      `Your gong config data should be filled, check the README file`
    );
    process.exit();
  }
  try {
    const workspaceId = await fetchWorkspaceId({ slug });
    if (!workspaceId) {
      console.error(`No workspace found for slug: ${slug}`);
      process.exit();
    }
    console.info(`ℹ️ Workspace id found: ${workspaceId}`);

    console.info('ℹ️ Fetching calls…');
    const calls = await getLastPeriodCalls(12, 'months');
    console.info(`ℹ️ ${calls.length} call(s) fetched`);

    const calls2 = calls.slice(30);
    for (const call of calls2) {
      const callTranscript = await retrieveCallTranscript(call.id);
      const callDetails = await retrieveCallDetails(call.id);
      const formattedTranscript = callTranscript
        ? formatTranscriptToHTML(callTranscript, callDetails?.parties || [])
        : '';
      const formattedHeader = callDetails
        ? formatHeaderCallToHTML(callDetails)
        : '';
      const content = `
        <h2>Call details</h2>
        <div>${formattedHeader || 'No details found'}</div>
        <h2>Transcript</h2>
        <div>${formattedTranscript || 'No transcript found'}</div>
      `;
      const customerEmail =
        retrieveCustomerEmail(callDetails?.parties || []) || 'john@union.ai';
      const feedback = await createFeedback({
        workspaceId,
        attributes: [],
        content,
        sourceUrl: call.url,
        title: call.title,
        customerEmail,
      });
      if (feedback) {
        console.log(`Feedback created: ${feedback.title}`);
        feedbackImported.push(feedback.id);
      } else {
        console.log(`❌ Feedback no created`, call.id, call.title);
      }
    }
    console.info(
      `✅ Import done, ${feedbackImported.length} feedback imported`
    );
  } catch (error: any) {
    console.error('Error', error.message, feedbackImported.length);
  }
};

main();
