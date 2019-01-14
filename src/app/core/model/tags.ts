import {Codingmark} from './codingmark';

export class Tag {
  name: string;
  codingmarks: Codingmark[];
  userId: String;
  shared: boolean;

  constructor (
    name: string,
    codingmarks: Codingmark[]
  ) {
    this.name = name;
    this.codingmarks = codingmarks;
  }
}
