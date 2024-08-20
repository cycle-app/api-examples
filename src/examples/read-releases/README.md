# Read releases

Cycle let you use a public change-log (entirely for free). You can then publish any release on it.

Each release is a list of release notes, containing text, images and else.

In this example, you will see who retrieve those in a fully public way, so no need token or else.

## What this script does?

- It will fetch each public releases from a workspace
- It will then get all the releases notes

\*Note that the default pagination is 30 elements.

## How to use the script

1. Fill your data in `./config.ts` your can omit the `token` since it won't be necessary.

2. run `npm run releases:read`
