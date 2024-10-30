# Publish release note to Slack

A very common use case is to communicate about something you released. Using
Cycle releases, you can create a release and publish on you change-log some
content about your release.

## What does this script do?

### Manual trigger

- Based on a release note, grab the public content
- Publish the content on a specific Slack channel

### Webhook simulation

- Based on a simulated payload from the `STATUS_CHANGE` Cycle webhook
- Fetch the needed data from API
- Show optional filter based on properties

## How to use the script

1. Update the configuration in `./config.ts` with your workspace details.
2. Update your Slack token in `./src/example/publish-release-note-to-slack/config.ts`
3. Run the script using the command:

   ```bash
   npm run publish:release-to-slack
   ```

4. The script will fetch the data and publish if to Slack
