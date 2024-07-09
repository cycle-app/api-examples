export type Board = {
  created: string;
  id: string;
  isPrivate: boolean;
  name: string;
  postCount: number;
  privateComments: boolean | null;
  token: string;
  url: string;
};

export type Post = {
  id: string;
  author: User;
  board: Board;
  by: User;
  category: Category;
  clickup: Clickup;
  commentCount: number;
  created: string;
  customFields: CustomField[];
  details: string;
  eta: string;
  imageURLs: string[];
  jira: Jira;
  mergeHistory: MergeHistory[];
  owner: User;
  score: number;
  status: string;
  statusChangedAt: string;
  tags: Tag[];
  title: string;
  url: string;
};

export type Comment = {
  id: string;
  author: User;
  board: Board;
  created: string;
  imageURLs: string[];
  internal: boolean;
  likeCount: number;
  mentions: [];
  parentID: string;
  post: Post;
  private: boolean;
  reactions: {
    like: number;
  };
  value: string;
};

export type Vote = {
  id: string;
  board: Pick<Board, 'created' | 'id' | 'name' | 'postCount' | 'url'>;
  by: User | null;
  created: string;
  post: Post;
  voter: User;
  zendeskTicket: {
    url: string;
    id: number;
    created: string;
    subject: string;
    description: string;
  };
  votePriority: string;
};

export type User = {
  id: string;
  created: string;
  email: string;
  isAdmin: boolean;
  name: string;
  url: string;
  userID: string;
};

export type Category = {
  id: string;
  name: string;
  parentID: string | null;
  postCount: number;
  url: string;
};

export type Clickup = {
  linkedTasks: ClickupTask[];
};

export type ClickupTask = {
  id: string;
  linkID: string;
  name: string;
  postID: string;
  status: string;
  url: string;
};

export type CustomField = {
  id: string;
  name: string;
  value: string;
};

export type Jira = {
  linkedIssues: JiraIssue[];
};

export type JiraIssue = {
  id: string;
  key: string;
  url: string;
};

export type MergeHistory = {
  created: string;
  post: Post;
};

export type Tag = {
  id: string;
  name: string;
  postCount: number;
  url: string;
};
