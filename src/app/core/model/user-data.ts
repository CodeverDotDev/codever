export interface UserData {
  _id?: string;
  userId?: string;
  searches?: Search[];
  readLater?: string[]; // ids of bookmarks to read later
  stars?: string[]; // ids of bookmarks the user starred
  watchedTags?: string[];
  pinned?: string[]; // ids of pinned bookmarks
  history?: string[]; // ids of last visited bookmarks, order is important
}

export interface Search {
  text: string;
  language?: string;
  createdAt?: Date;
  lastAccessedAt?: Date;
  searchDomain?: string; // personal or public at the moment
}
