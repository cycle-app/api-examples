# Auto tag feedback

When you have an incoming feedback in your Cycle inbox, you sometime want to
automatically tag it with specific property.
This script will show case how you can achieve this.

The example of this script:

Assuming you want to auto-tag every created feedback based on the person who
report the feedback. Because you have specific squad, because you have different
products or any case where your team member are working on a specific segment of your business.

You want then have a specific split, so each team, will have a separate inbox
to treat their feedback.

We will then have a logic who will check every reported feedback, check the
reporter email and based on this, assign the right squad.

## What this script does?

- It will listen to every cycle doc creation
- Filter out non desired event
- Update doc with the right squad based on the reporter email

## How to use the script

1. Fill your data in `./config.ts`

2. Use the `onDocCreated` function in the `./index.ts`, customize it and host it
