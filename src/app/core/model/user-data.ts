export interface UserData {
  _id?: string;
  userId?: string;
  searches?: Search[];
  readLater?: string[]; // ids of codingmarks to read later
}

export interface Search {
  text: string;
  language?: string;
  createdAt?: Date;
  lastAccessedAt?: Date;
}
