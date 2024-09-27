# Import feedback from CSV

This script show case the feedback import from CSV

## What this script does?

- It will read a CSV file (CSV data are define in `./config.ts`)
- For each row it will create a feedback
- All of imported feedback will have a imported property. This will allow you to create views filtered on this property and bulk delete if you need. You can delete the property from your Cycle's settings if not needed anymore.

## How to use the script

1. Fill your data in `./config.ts`

2. run `npm run import:csv`
