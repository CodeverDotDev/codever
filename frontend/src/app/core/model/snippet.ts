export interface Snippet {
  _id?: string;
  type: string; // should always by 'snippet'
  title: string;
  codeSnippets: CodeSnippet[];
  tags: string[];
  userId?: string;
  sourceUrl: string; // the location the snippet might have been inspired from to follow for further analysis
  public?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastAccessedAt?: Date;
  likeCount?: number;
  copiedFromId?: string; // id of the snippet where this snippet was copied from
}

export interface CodeSnippet {
  code: string;
  comment: string;
  commentAfter: string;
}
