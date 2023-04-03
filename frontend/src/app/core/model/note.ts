export interface Note {
  _id?: string;
  type: string; // should always by 'note'
  userId?: string;
  title: string;
  reference?: string;
  content: string;
  color: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
