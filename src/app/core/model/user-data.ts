export interface UserData {
  _id: string;
  userId: string;
  searches: Search[];
}

export interface Search {
  text: string;
  language?: string;
  createdAt?: Date;
  lastAccessedAt?: Date;
}
