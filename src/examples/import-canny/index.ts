import {
  formatDateAndTime,
  wait,
  createAttribute,
  fetchWorkspaceId,
  fetchWorkspaceDocTypes,
  linkAttributeToDocType,
  createDoc,
  createFeedback,
} from '../../utils';
import { slug } from '../../config';
import { cannyConfig } from './config';
import type { Board, Comment, Post, Vote } from './canny.types';

const fetchCanny = async <T>(
  endpoint: string,
  body = {},
  pagination = { skip: 0, limit: 10 }
): Promise<T> => {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: cannyConfig.cannySecretKey,
      skip: pagination.skip,
      limit: pagination.limit,
      ...body,
    }),
  };

  const response = await fetch(
    `https://canny.io/api/v1/${endpoint}`,
    requestOptions
  );
  if (!response.ok) throw Error('Failed to fetch');
  const json = await response.json();
  return json;
};

const retrieveBoards = async () => {
  const response = await fetchCanny<{ boards: Board[] }>('boards/list');
  return response.boards;
};

const filterBoardWithPosts = (boards: Board[]) => {
  const boardsWithPosts = boards.filter((b) => b.postCount >= 1);
  return boardsWithPosts;
};

const fetchAllPosts = async (
  boardID: string,
  skip: number = 0,
  accumulatedPosts: Post[] = []
): Promise<Post[]> => {
  const { hasMore, posts } = await fetchCanny<{
    hasMore: boolean;
    posts: Post[];
  }>('posts/list', { boardID }, { limit: 100, skip });
  accumulatedPosts.push(...posts);

  if (hasMore) {
    // console.info(`Fetching more posts, skip: ${skip + posts.length}`);
    return fetchAllPosts(boardID, skip + posts.length, accumulatedPosts);
  } else {
    return accumulatedPosts;
  }
};

const fetchAllComments = async (
  postID: string,
  skip: number = 0,
  accumulatedComments: Comment[] = []
): Promise<Comment[]> => {
  const { hasMore, comments } = await fetchCanny<{
    hasMore: boolean;
    comments: Comment[];
  }>('comments/list', { postID }, { limit: 100, skip });
  accumulatedComments.push(...comments);

  if (hasMore) {
    // console.info(`Fetching more comments, skip: ${skip + comments.length}`);
    return fetchAllComments(
      postID,
      skip + comments.length,
      accumulatedComments
    );
  } else {
    return accumulatedComments;
  }
};

const fetchAllVotes = async (
  postID: string,
  skip: number = 0,
  accumulatedVotes: Vote[] = []
): Promise<Vote[]> => {
  const { hasMore, votes } = await fetchCanny<{
    hasMore: boolean;
    votes: Vote[];
  }>('votes/list', { postID }, { limit: 100, skip });
  accumulatedVotes.push(...votes);

  if (hasMore) {
    return fetchAllVotes(postID, skip + votes.length, accumulatedVotes);
  } else {
    return accumulatedVotes;
  }
};

const createImportAttribute = async (workspaceId: string) => {
  const [formattedDate, formattedTime] = formatDateAndTime(
    new Date(Date.now())
  );
  const attribute = await createAttribute({
    workspaceId,
    attributeName: `Imported on ${formattedDate} at ${formattedTime}`,
    attributeDescription: '',
  });
  return attribute;
};

const fetchDocTypes = async (workspaceId: string) => {
  const docTypes = await fetchWorkspaceDocTypes({
    workspaceId,
  });
  return {
    docTypeToImport: docTypes.find((d) => d.name === cannyConfig.docTypeName),
    feedback: docTypes.find((d) => d.name === 'Feedback'),
    insight: docTypes.find((d) => d.name === 'Insight'),
  };
};

interface FormattedComment {
  type: string;
  content: Array<{
    type: string;
    text: string;
    marks?: Array<{ type: string }>;
  }>;
}

const getFormattedComments = (comments: Comment[]) => {
  const formattedComments = comments.reduce<Array<FormattedComment>>(
    (prev, curr) => [
      ...prev,
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'From: ' },
          { type: 'text', marks: [{ type: 'bold' }], text: curr.author.name },
          { type: 'text', text: ` on ${curr.created}` },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: curr.value || ' ' }], // Always have a non empty value
      },
    ],
    []
  );

  return [
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Comments' }],
    },
    ...formattedComments,
  ];
};

type FormattedCommentsSection = (
  | FormattedComment
  | {
      type: string;
      attrs: {
        level: number;
      };
      content: {
        type: string;
        text: string;
      }[];
    }
)[];

const getJSONDocContent = ({
  post,
  comments,
}: {
  post: Post;
  comments: FormattedCommentsSection;
}) => {
  const content = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Post details' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: post.details || ' ' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    marks: [{ type: 'bold' }],
                    text: `Category: `,
                  },
                  { type: 'text', text: post.category?.name || 'no category' },
                ],
              },
            ],
          },
        ],
      },
      ...comments,
    ],
  };
  return JSON.stringify(content);
};

const main = async () => {
  if (!cannyConfig.cannySecretKey) {
    console.error(`You canny api secret key should be defined`);
    process.exit();
  }
  try {
    const workspaceId = await fetchWorkspaceId({ slug });
    if (!workspaceId) {
      console.error(`No workspace found for slug: ${slug}`);
      process.exit();
    }
    console.info(`ℹ️ Workspace id found: ${workspaceId}`);

    const importAttribute = await createImportAttribute(workspaceId);
    if (!importAttribute) {
      console.error(`Error during attribute creation`);
      process.exit();
    }
    console.info(`Import attribute created: ${importAttribute.name}`);

    const { docTypeToImport, feedback, insight } = await fetchDocTypes(
      workspaceId
    );
    if (!docTypeToImport) {
      console.error(
        `Error during doc type recuperation, are sure about the doc type name you've entered?`
      );
      process.exit();
    }
    console.info(`ℹ️ Doc will be imported as: ${docTypeToImport.name}`);

    // Link to desired doc type
    const linkedDocTypeResults = await linkAttributeToDocType({
      attributeDefinitionId: importAttribute.id,
      doctypeId: docTypeToImport.id,
    });
    // Link to feedback
    if (feedback) {
      await linkAttributeToDocType({
        attributeDefinitionId: importAttribute.id,
        doctypeId: feedback.id,
      });
    }
    // Link to insight
    if (insight) {
      await linkAttributeToDocType({
        attributeDefinitionId: importAttribute.id,
        doctypeId: insight.id,
      });
    }
    if (!linkedDocTypeResults) {
      console.error(`Error during linking the attribute to the doc type`);
      process.exit();
    }
    console.info(
      `✅ Import attribute successfully linked to ${docTypeToImport.name} doc type`
    );

    console.info('ℹ️ Fetching boards…');
    const boards = await retrieveBoards();
    let boardsWithPosts = filterBoardWithPosts(boards);

    const postsCount = boardsWithPosts.reduce((p, c) => c.postCount + p, 0);
    if (boardsWithPosts.length) {
      console.info(
        `✅ ${boardsWithPosts.length} boards has posts with a total of ${postsCount} posts`
      );
    } else {
      console.info(`No boards with posts found`);
      process.exit();
    }

    console.info(`ℹ️ Fetching ${postsCount} posts…`);
    boardsWithPosts = boardsWithPosts.slice(0, 1);
    for (const boardsWithPost of boardsWithPosts) {
      console.info(`ℹ️ -- Fetching posts from board: ${boardsWithPost.name}…`);
      let posts = await fetchAllPosts(boardsWithPost.id);
      console.info(`✅ posts ${posts.length} fetched`);

      posts = posts.filter((p) => !!p.commentCount);
      posts.slice(2, 5);
      console.info(`✅ posts ${posts.length} with comment`);
      for (const post of posts) {
        console.info(`ℹ️ -- -- Fetching comments from post: ${post.title}…`);
        let comments: Comment[] = [];
        if (post.commentCount) {
          comments = await fetchAllComments(post.id);
        }

        const importAttributeData = {
          attributeDefinitionId: importAttribute.id,
          value: { checkbox: true },
        };

        const createdDoc = await createDoc({
          workspaceId,
          attributes: [importAttributeData],
          contentJSON: getJSONDocContent({
            post,
            comments: getFormattedComments(comments),
          }),
          doctypeId: docTypeToImport.id,
          title: post.title,
        });

        if (createdDoc) {
          console.info(`ℹ️ -- -- Fetching votes from post: ${post.title}…`);
          const votes = await fetchAllVotes(post.id);
          if (votes.length) {
            for (const vote of votes) {
              if (insight?.id) {
                const voteFeedback = await createFeedback({
                  workspaceId,
                  attributes: [importAttributeData],
                  content: `Vote for ${post.title}`,
                  sourceUrl: post.url,
                  title: `Vote from ${vote.voter?.name || 'unknown'} on ${
                    post.title
                  }`,
                  customerEmail: vote.voter.email,
                });
                const voteInsight = await createDoc({
                  doctypeId: insight.id,
                  workspaceId,
                  attributes: [importAttributeData],
                  contentJSON: '',
                  title: `Vote from ${vote.voter?.name || 'unknown'} on ${
                    post.title
                  }`,
                  customerId: voteFeedback.customer.id,
                  docSourceId: voteFeedback.id,
                  parentId: createdDoc.id,
                });
              }
            }
          }
        } else {
          console.error(
            `❌ -- -- Error creating ${docTypeToImport.name} for post: ${post.title}`
          );
        }
        console.error(`✅ -- -- Doc imported: ${createdDoc?.title}`);
      }

      await wait();
    }
    console.info('✅ Import done ✅');
  } catch (error: any) {
    console.error('Error', error.message);
  }
};

main();
