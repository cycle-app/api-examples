import {
  fetchWorkspaceId,
  createFeedback,
  wait,
  fetchWorkspaceIdWithDefaultAssignee,
  updateDocAssignee,
  getFileTypeAndSize,
  getFileTypeFromUrl,
  downloadMedia,
} from '../../utils';
import { uploadMedia } from '../../utils/cycle';
import { slug } from '../../config';
import { modjoConfig } from './config';
import dayjs from 'dayjs';
import {
  ModjoRequestBody,
  ApiResponse,
  ModjoCall,
  ModjoSpeaker,
} from './modjo.type';

function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0; // Generate a random number (0-15)
    const v = c === 'x' ? r : (r & 0x3) | 0x8; // Set bits for `y` (8, 9, A, or B)
    return v.toString(16); // Convert to hexadecimal
  });
}

const fetchModjo = async <T>(
  endpoint: string,
  body: ModjoRequestBody
): Promise<T> => {
  const response = await fetch(`https://api.modjo.ai${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': modjoConfig.apiKey,
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
        start: formattedStartDate,
        end: formattedEndDate,
      },
      minimumCallDuration: 5,
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

async function handleFile(fileUrl: string) {
  const typeFromUrl = getFileTypeFromUrl(fileUrl);
  console.info('⬇️ Downloading media file…', fileUrl);
  const localFilePath =
    typeFromUrl && (await downloadMedia(fileUrl, 'temp', typeFromUrl));
  console.info('⬆️ Upload media file:', localFilePath);
  const downloadedFileUrl =
    localFilePath && (await uploadMedia(localFilePath, typeFromUrl));
  console.info('Downloaded media file:', downloadedFileUrl);

  return downloadedFileUrl;
}

async function formatCallToHTML(callDetails: ModjoCall) {
  let htmlContent = '';

  if (callDetails.relations.recording?.url) {
    const fileType = getFileTypeFromUrl(callDetails.relations.recording.url);
    const fileDataUrl = await handleFile(callDetails.relations.recording.url);

    if (fileType === 'audio') {
      htmlContent += `<audio-tagname dataId="${generateUUIDv4()}" src="${fileDataUrl}"></audio-tagname>`;
    } else if (fileType === 'video') {
      htmlContent += `<video-tagname dataId="${generateUUIDv4()}" src="${fileDataUrl}"></video-tagname>`;
    }
  }

  // Format call details
  htmlContent += `<h2>Call details</h2>`;
  htmlContent += `<p>Duration: <b>~${Math.round(
    callDetails.duration > 60 ? callDetails.duration / 60 : callDetails.duration
  )} ${callDetails.duration > 60 ? 'min' : 'sec'}</b></p>`;

  htmlContent += `<h3>Speakers</h3><ul>`;
  callDetails.relations.speakers?.forEach((speaker) => {
    htmlContent += `<li>${speaker.name} (${speaker.email})</li>`;
  });
  htmlContent += `</ul>`;

  htmlContent += `<h2>Summary</h2>`;
  htmlContent += `<p>${
    callDetails.relations?.aiSummary?.content || 'No summary'
  }</p>`;

  // Format transcript if available
  if (callDetails.relations.transcript) {
    htmlContent += `<h3>Transcript</h3>`;
    callDetails.relations.transcript?.forEach((segment: any) => {
      const speaker = callDetails.relations.speakers?.find(
        (s: any) => s.speakerId === segment.speakerId
      );
      const speakerContent = speaker
        ? `<strong>${speaker.name}:</strong> `
        : '';
      htmlContent += `<p>${speakerContent} ${segment.content}</p>`;
    });
  } else {
    htmlContent += `<p>No transcript available</p>`;
  }

  return htmlContent;
}

function getEmailDomain(email: string) {
  return email?.split('@')[1].toLowerCase().trim() || null;
}

function identifyCustomerAndReporter(
  speakers: ModjoSpeaker[],
  givenEmail: string
): { customerEmail: string | null; reporterEmail: string | null } {
  const givenDomain = getEmailDomain(givenEmail);

  let customerEmail: string | null = null;
  let reporterEmail: string | null = null;

  speakers.forEach((speaker) => {
    if (customerEmail && reporterEmail) return;

    const speakerDomain = getEmailDomain(speaker.email);
    if (speakerDomain === givenDomain && !reporterEmail) {
      reporterEmail = speaker.email;
    } else if (speakerDomain !== givenDomain && !customerEmail) {
      customerEmail = speaker.email;
    }
  });
  return { customerEmail, reporterEmail };
}

async function main() {
  try {
    const workspace = await fetchWorkspaceIdWithDefaultAssignee({ slug });
    if (!workspace?.id) {
      console.error('No workspace found');
      return;
    }
    console.info('Workspace found:', workspace);

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
        console.info('Calls fetched:', callsFetched);
        totalCallsFetched += callsFetched;

        console.log(`Fetched ${callsFetched} call(s) on page ${page}`);
        for (const call of calls) {
          await wait(500);
          const content = await formatCallToHTML(call);
          const { customerEmail, reporterEmail } = call.relations.speakers
            ? identifyCustomerAndReporter(
                call.relations.speakers,
                workspace.defaultAssignee.email
              )
            : { customerEmail: null, reporterEmail: null };

          const feedback = await createFeedback({
            workspaceId: workspace.id,
            title: call.title || 'Modjo Call',
            attributes: [], // Add any relevant attributes here
            customerEmail: customerEmail || undefined,
            sourceUrl: 'https://modjo.ai',
            content,
          });

          if (
            feedback &&
            reporterEmail &&
            reporterEmail !== feedback?.assignee.email
          ) {
            await updateDocAssignee({
              docId: feedback.id,
              userId: feedback.assignee.id,
            });
          }

          if (feedback) {
            console.log(
              `💬 Successfully created feedback for call: ${call.title}`
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
