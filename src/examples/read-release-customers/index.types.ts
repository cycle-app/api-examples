import type {
  DocWithSourceDoc,
  Release,
  ReleaseNoteWithDoc,
} from '../../utils';

/**
 * This is the shape of the state that we will use to store the data during
 * the runtime of the script.
 */
export type State = {
  [releaseId: string]: {
    data: Release;
    notes: {
      [releaseNoteId: string]: {
        data: ReleaseNoteWithDoc;
        insights: {
          [insightId: string]: {
            data: DocWithSourceDoc;
          };
        };
      };
    };
  };
};
