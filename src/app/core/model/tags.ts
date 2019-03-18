import {Bookmark} from './bookmark';

export class Tag {
  name: string;
  codingmarks: Bookmark[];
  userId: String;
  shared: boolean;

  constructor (
    name: string,
    codingmarks: Bookmark[]
  ) {
    this.name = name;
    this.codingmarks = codingmarks;
  }
}
