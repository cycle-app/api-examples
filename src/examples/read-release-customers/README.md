# Export Release Data

Cycle allows you to manage and publish a public changelog for your workspace, showcasing your product's releases and related notes. This script enables you to fetch detailed data from your releases and export it into CSV files for further analysis or reporting.

## What does this script do?

- Fetches the workspace ID based on a given slug.
- Retrieves all releases associated with the workspace.
- For each release, fetches all related release notes.
- For each release note, fetches all associated docs along with related insights and attached customer information.
- Generates CSV files

## How to use the script

1. Update the configuration in `./config.ts` with your workspace details.
2. Run the script using the command:

   ```bash
   npm run releases:export-customers
   ```

3. The script will generate CSV files in the current directory under the `output` folder, containing all the fetched data.
