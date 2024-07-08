# Import from Canny

[Canny](https://canny.io/) is a customer feedback tool. This is an example of
using Cycle API to import your Canny data right into your Cycle inbox.

## What this script does?

- It will fetch each Canny post from all your boards
- For each post it will fetch votes and comments
- It will create a doc with the desired type (from config) for each post
- For each created doc, it will create a linked feedback per vote
- All of the imported docs will have a imported property. This will allow you to create views filtered on this property and bulk delete if you need. You can delete the property from your Cycle's settings if not needed anymore.

## How to use the script

1. Fill your data in `./config.ts`

2. run `npm run import:canny`
