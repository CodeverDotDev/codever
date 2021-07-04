export interface UserData {
  _id?: string;
  userId?: string;
  profile?: Profile;
  searches?: Search[];
  recentSearches?: Search[];
  readLater?: string[]; // ids of bookmarks to read later
  likes?: string[]; // ids of bookmarks the user liked
  favorites?: string[]; // ids of bookmarks marked as favorite
  watchedTags?: string[];
  ignoredTags?: string[];
  pinned?: string[]; // ids of pinned bookmarks
  history?: string[]; // ids of last visited bookmarks, order is important
  following?: Following;
  followers?: string[];
  showAllPublicInFeed?: boolean;
  enableLocalStorage?: boolean;
  welcomeAck?: boolean; // acknowledges the welcome dialog
}

export interface Profile {
  displayName: string,
  imageUrl?: string,
  summary?: string,
  websiteLink?: string,
  twitterLink?: string,
  githubLink?: string,
  linkedinLink?: string
}

export interface Following {
  users?: string[];
  tags?: string[];
}

export interface Search {
  text: string;
  language?: string;
  createdAt?: Date;
  lastAccessedAt?: Date;
  searchDomain?: string; // personal or public at the moment
  count?: number; // number of times search was used
  saved?: boolean // whether it is a saved search, they are meant to live forever
}

