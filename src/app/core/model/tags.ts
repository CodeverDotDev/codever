import {Codingmark} from "./codingmark";

export class Tag {
  name: string;
  bookmarks: Codingmark[];
  userId: String;
  shared: boolean;

  constructor (
    name: string,
    bookmarks: Codingmark[]
  ){
    this.name = name;
    this.bookmarks = bookmarks;
  }
}
