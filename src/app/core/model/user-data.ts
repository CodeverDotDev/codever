export interface UserData {
  _id: string;
  userId: string;
  searches: Search[];
}

interface Search {
  text: string;
  language?: string;
  createdAt?: Date;
  lastAccessedAt?: Date;
}
