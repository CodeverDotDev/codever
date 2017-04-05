import {Bookmark} from "./bookmark";

export class Tag {
  name: string;
  bookmarks: Bookmark[];
  userId: String;
  shared: boolean;

  constructor (
    name: string,
    bookmarks: Bookmark[]
  ){
    this.name = name;
    this.bookmarks = bookmarks;
  }
}
