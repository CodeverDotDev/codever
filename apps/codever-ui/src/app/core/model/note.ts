export interface Note {
  _id?: string;
  type: string; // should always be 'note'
  userId?: string;
  title: string;
  reference?: string;
  initiator?: string;
  content: string;
  color: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
