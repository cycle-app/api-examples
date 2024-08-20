/**
 * @see https://gong.app.gong.io/settings/api/documentation#get-/v2/calls
 */
export type CallResponse =
  | {
      requestId: string;
      records: GongApiPaginationResponse;
      calls: Call[];
    }
  | GongApiErrorResponse;

/**
 * @see https://gong.app.gong.io/settings/api/documentation#post-/v2/calls/transcript
 */
export type CallTranscriptResponse =
  | {
      requestId: string;
      records: GongApiPaginationResponse;
      callTranscripts: CallTranscript[];
    }
  | GongApiErrorResponse;

/**
 * @see https://gong.app.gong.io/settings/api/documentation#post-/v2/calls/extensive
 */
export type CallDetailsResponse =
  | {
      requestId: string;
      records: GongApiPaginationResponse;
      calls: CallDetails[];
    }
  | GongApiErrorResponse;

/**
 * @see https://gong.app.gong.io/settings/api/documentation#get-/v2/users/-id-
 */
export type UserResponse =
  | {
      requestId: string;
      user: User;
    }
  | GongApiErrorResponse;

type GongApiErrorResponse = {
  requestId: string;
  errors: string[];
};

type GongApiPaginationResponse = {
  totalRecords: number; // Total number of records.
  currentPageSize: number; // Number of records in the current page.
  currentPageNumber: number; // Current page number.
  cursor: string; // Returned only when there are more records to be retrieved. Repeat the API call and pass this cursor value in the request to retrieve the next page of records.
};

export type Call = {
  id: string; // Gong's unique numeric identifier for the call (up to 20 digits).
  url: string; // The URL to the page in the Gong web application where the call is available.
  title: string; // The title of the call.
  scheduled: string; // Scheduled date and time of the call in the ISO-8601 format (e.g., '2018-02-18T02:30:00-07:00' or '2018-02-18T08:00:00Z', where Z stands for UTC).
  started: string; // The date and time when the call was recorded in the ISO-8601 format (e.g., '2018-02-18T02:30:00-07:00' or '2018-02-18T08:00:00Z', where Z stands for UTC).
  duration: number; // The duration of the call, in seconds.
  primaryUserId: string; // The primary user ID of the team member who hosted the call.
  direction: 'Inbound' | 'Outbound' | 'Conference' | 'Unknown';
  system: string; // The system with which the call was carried out (e.g., WebEx, ShoreTel, etc.).
  scope: 'Internal' | 'External' | 'Unknown'; // The scope of the call: 'internal' if all the participants are from the company, 'external' if some participants are not from the company, or 'unknown' if the scope is unknown.
  media: 'Video' | 'Audio';
  language: string; // The language codes (as defined by ISO-639-2B). E.g., eng, fre, spa, ger, and ita. Also used are und (unsupported language), and zxx (not enough speech content for identification).
  workspaceId: string; // Gong's unique numeric identifier for the call's workspace (up to 20 digits).
  sdrDisposition: string; // The SDR disposition of the call. This can be an automated value provided by the provider, or manually entered by the rep.
  clientUniqueId: string; // The call's unique identifier in the origin recording system (typically a telephony recording system). The identifier is provided to Gong during the call creation via the Public API or through telephony systems integrations.
  customData: string; // Metadata as was provided to Gong during the call creation via the Public API.
  purpose: string; // The purpose of the call.
  meetingUrl: string; // The meeting provider URL on which the web conference was recorded.
  isPrivate: boolean; // If the call is private.
  calendarEventId: string; // The Id of the meeting in Google or Outlook Calendar.
};

export type CallTranscript = {
  callId: string; // Gong's unique numeric identifier for the call (up to 20 digits).
  transcript: {
    speakerId: string; // Unique ID of the speaker. Cross-reference this with the 'speakerId' field of objects in the 'parties' array returned from endpoint '/v2/calls/extensive' to identify the participant.
    topic: string; // The name of the topic.
    sentences: {
      start: number; // The starting time of the sentence, in milliseconds from the start of the call.
      end: number; // The end time of the sentence, in milliseconds from the start of the call.
      text: string; // The sentence.
    }[];
  }[];
};

export type User = {
  id: string; // Gong's unique numeric identifier for the user (up to 20 digits).
  emailAddress: string; // The email addres of the Gong user.
  created: string; // Creation time in the ISO-8601 format (e.g., '2018-02-18T02:30:00-07:00' or '2018-02-18T08:00:00Z', where Z stands for UTC);of the Gong user.
  active: boolean; // True if the user is active, false if not.
  emailAliases: string[]; // List of email address aliases of the Gong user.
  trustedEmailAddress: string; // The trusted authentication email assigned to the Gong user
  firstName: string; // The first name of the Gong user.
  lastName: string; // The last name of the Gong user.
  title: string; // The job title of the Gong user.
  phoneNumber: string; // The phone number of the Gong user.
  extension: string; // The extension number of the Gong user.
  personalMeetingUrls: [string]; // The list of personal meeting URLs of the Gong user.
  settings: {
    webConferencesRecorded: boolean; // True if the team member is set to be recorded by Gong, false if not.
    preventWebConferenceRecording: boolean; // If true, invitation of this user to a web conference will prevent its recording (even if other users invited are set to record).
    telephonyCallsImported: boolean; // True if the team member is set to import telephony calls from by Gong, false if not.
    emailsImported: boolean; // True if the team member is set to import emails by Gong, false if not.
    preventEmailImport: boolean; // True if the team member is set to prevent import of emails by Gong, false if not.
    nonRecordedMeetingsImported: boolean; // True if the team member is set to import non recorded meetings by Gong, false if not.
    gongConnectEnabled: boolean; // True if the team member has Gong Connect enabled, false if not.
  };
  managerId: string; // The manager ID of the Gong user.
  meetingConsentPageUrl: string; // The Gong recording consent meeting link
  spokenLanguages: {
    language: string; // Language spoken by the user encoded according to the BCP-47 standard.
    primary: boolean; // Indicates the primary language (one per user). The language will be assumed when the system cannot identify the language of a call, e.g., due to poor quality or the call being too short.
  }[];
};

export type CallDetails = {
  metaData: {
    id: string; //  Gong's unique numeric identifier for the call (up to 20 digits).
    url: string; // The URL to the page in the Gong web application where the call is available.
    title: string; // The title of the call.
    scheduled: string; //  Scheduled date and time of the call in the ISO-8601 format (e.g., '2018-02-18T02:30:00-07:00' or '2018-02-18T08:00:00Z', where Z stands for UTC).
    started: string; // The date and time when the call was recorded in the ISO-8601 format (e.g., '2018-02-18T02:30:00-07:00' or '2018-02-18T08:00:00Z', where Z stands for UTC).
    duration: number; //  The duration of the call, in seconds.
    primaryUserId: string; // The primary user ID of the team member who hosted the call.
    direction: 'Inbound' | 'Outbound' | 'Conference' | 'Unknown';
    system: string; // The system with which the call was carried out (e.g., WebEx, ShoreTel, etc.).
    scope: 'Internal' | 'External' | 'Unknown'; // The scope of the call: 'internal' if all the participants are from the company, 'external' if some participants are not from the company, or 'unknown' if the scope is unknown.
    media: 'Video' | 'Audio'; // Media type
    language: string; // The language codes (as defined by ISO-639-2B). E.g., eng, fre, spa, ger, and ita. Also used are und (unsupported language), and zxx (not enough speech content for identification).
    workspaceId: string; // Gong's unique numeric identifier for the call's workspace (up to 20 digits).
    sdrDisposition: string; // The SDR disposition of the call. This can be an automated value provided by the provider, or manually entered by the rep.
    clientUniqueId: string; // The call's unique identifier in the origin recording system (typically a telephony recording system). The identifier is provided to Gong during the call creation via the Public API or through telephony systems integrations.
    customData: string; // Metadata as was provided to Gong during the call creation via the Public API.
    purpose: string; // The purpose of the call.
    meetingUrl: string; // The meeting provider URL on which the web conference was recorded.
    isPrivate: boolean; // If the call is private.
    calendarEventId: string; // The Id of the meeting in Google or Outlook Calendar.
  };
  parties?: {
    id: string; //  Unique ID of the participant in the call.
    emailAddress: string; // Email address.
    name: string; // The name of the participant.
    title: string; // The job title of the participant
    userId: string; // The user ID of the participant within the Gong system, if the participant exists in the system.
    speakerId: string; // Unique ID of a participant that spoke in the call. References to this id will appear in the '/v2/calls/transcript' endpoint response.
    context: any[];
    affiliation: 'Internal' | 'External' | 'Unknown';
    phoneNumber: string; // The phone number of the participant.
    methods: ('Invitee' | 'Attendee')[];
  }[];
  content?: {
    // There are other fields here that we do not selected
    brief: string; // The brief of the call. Returned when it is available and contentSelector.exposedFields.content.brief = true.
  };
};
