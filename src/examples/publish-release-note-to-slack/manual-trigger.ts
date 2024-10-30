import { fetchReleaseNoteById, getReleaseNoteUrl } from '../../utils';
import { slug } from '../../config';
import { scriptConfig } from './config';

import { WebClient } from '@slack/web-api';
import TurndownService from 'turndown';

/**
 * @see https://slack.dev/node-slack-sdk/web-api
 */
const web = new WebClient(scriptConfig.slackToken);
const turndownService = new TurndownService();

async function main(releaseNoteId: string) {
  const releaseNoteResults = await fetchReleaseNoteById(releaseNoteId);

  /**
   * @see https://api.slack.com/surfaces/messages
   * @see https://app.slack.com/block-kit-builder/
   */
  await web.chat.postMessage({
    channel: '#general',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: releaseNoteResults?.releaseNote.title || 'No title',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: turndownService.turndown(
            releaseNoteResults?.releaseNote.htmlContent || '<p>No content</p>'
          ),
        },
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'Discover the full release not',
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Read more',
            emoji: true,
          },
          value: 'click_me_123',
          url: getReleaseNoteUrl({
            releaseId: releaseNoteResults?.releaseNote.release.id || '',
            releaseNoteId: releaseNoteResults?.releaseNote.id || '',
            slug,
          }),
          action_id: 'button-action',
        },
      },
    ],
  });

  console.info(`✅ Published to Slack`);
}

try {
  main(scriptConfig.releaseNoteId);
} catch (error: any) {
  console.error('Error in main', error.message);
  process.exit();
}
