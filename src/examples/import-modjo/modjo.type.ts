type ModjoPaginationInput = {
  page: number;
  perPage: number;
};

type ModjoCallStartDateRange = {
  start: string; // ISO date format string (e.g., "2024-10-15T00:00:00.000Z")
  end: string;
};

type ModjoFilters = {
  callStartDateRange: ModjoCallStartDateRange;
  minimumCallDuration: number; // Minimum duration of the call in seconds
};

type ModjoRelations = {
  recording: boolean;
  aiSummary: boolean;
  transcript: boolean;
  speakers: boolean;
};

export type ModjoRequestBody = {
  pagination: ModjoPaginationInput;
  filters: ModjoFilters;
  relations: ModjoRelations;
};

type ErrorResponse = {
  error: string;
  message: string;
  statusCode: number;
};

type ModjoPaginationOutput = {
  page: number;
  perPage: number;
  nextPage: number;
  totalValues: number;
  lastPage: number;
};

// type ModjoContact = {
//   contactId: number;
//   name: string;
//   phoneNumber: string;
//   email: string;
//   contactCrmId: string;
// };

// type ModjoAccount = {
//   accountId: number;
//   accountCrmId: string;
//   name: string;
// };

// type ModjoDeal = {
//   dealId: number;
//   dealCrmId: string;
//   name: string;
// };

// type ModjoUser = {
//   userId: number;
//   userCrmId: string;
//   email: string;
//   name: string;
// };

// type ModjoTag = {
//   tagId: number;
//   name: string;
// };

type ModjoTopic = {
  topicId: number;
  name: string;
};

export type ModjoSpeaker = {
  userId: number;
  userCrmId: string;
  email: string;
  name: string;
  speakerId: number;
  type: 'user' | 'external';
};

type ModjoTranscript = {
  startTime: number;
  endTime: number;
  speakerId: number;
  content: string;
  topics: ModjoTopic[];
};

// type ModjoReviewQuestion = {
//   reviewQuestionId: number;
//   title: string;
//   boost: number;
// };

// type ModjoReviewAnswer = {
//   reviewAnswerId: number;
//   rating: number;
//   feedback: string;
//   question: ModjoReviewQuestion;
// };

// type ModjoReview = {
//   reviewer: ModjoUser;
//   reviewee: ModjoUser;
//   answers: ModjoReviewAnswer[];
//   rating: number;
// };

// type ModjoAIScoringResult = {
//   score: number;
//   questionsCount: number;
//   template: {
//     title: string;
//     uuid: string;
//   };
// };

type ModjoSummary = {
  content: string;
  templateUuid: string;
  summaryCrmId: string;
};

type ModjoCallRelations = {
  recording?: {
    url: string;
  };
  // contacts?: ModjoContact[];
  // account?: ModjoAccount[];
  // deal?: ModjoDeal[];
  // users?: ModjoUser[];
  // tags?: ModjoTag[];
  // topics?: ModjoTopic[];
  speakers?: ModjoSpeaker[];
  // libraries?: {
  //   libraryId: number;
  //   name: string;
  // }[];
  transcript?: ModjoTranscript[];
  // summary?: ModjoSummary;
  aiSummary?: ModjoSummary;
  // highlights?: ModjoSummary;
  // reviews?: ModjoReview[];
  // aiScoringResults?: ModjoAIScoringResult[];
};

export type ModjoCall = {
  callId: number;
  title: string;
  startDate: string; // ISO date string
  duration: number; // Duration of the call in seconds
  provider: string;
  language: string;
  callCrmId?: object;
  relations: ModjoCallRelations;
};

export type ModjoApiSuccessResponse = {
  pagination: ModjoPaginationOutput;
  values: ModjoCall[];
};

export type ApiResponse = ModjoApiSuccessResponse | ErrorResponse;
