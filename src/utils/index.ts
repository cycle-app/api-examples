export * from './attributes';
export * from './change-log';
export * from './doc-types';
export * from './doc';
export * from './workspace';

export const wait = (milliseconds: number = 1000) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export const formatDateAndTime = (date: Date): [string, string] => {
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(
    date
  );
  const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(
    date
  );
  return [formattedDate, formattedTime];
};
