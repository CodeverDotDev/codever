export interface Note {
  _id?: string;
  type: string; // should always be 'note'
  userId?: string;
  title: string;
  reference?: string;
  initiator?: string;
  content: string;
  // 'markdown' (default) or 'notebook' — determines how content is rendered
  contentType?: 'markdown' | 'notebook';
  // Raw .ipynb JSON for notebook notes; content holds extracted searchable text
  notebookContent?: string;
  color: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
