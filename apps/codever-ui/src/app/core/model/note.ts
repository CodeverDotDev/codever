export interface Note {
  _id?: string;
  shareableId?: string;
  type: string; // should always be 'note'
  userId?: string;
  title: string;
  reference?: string;
  initiator?: string;
  origin?: {
    location?: string; // URL (web) or file path (IDE extension)
    file?: string;
    project?: string;
    workspace?: string;
  };
  content: string;
  // 'markdown' (default) or 'notebook' — determines how content is rendered
  contentType?: 'markdown' | 'notebook';
  // Raw .ipynb JSON for notebook notes; content holds extracted searchable text
  notebookContent?: string;
  color: string;
  tags: string[];
  public?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
