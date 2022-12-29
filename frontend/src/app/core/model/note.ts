export interface Note {
  _id?: string;
  userId?: String;
  title: string;
  reference?: string;
  content: string;
  color: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
