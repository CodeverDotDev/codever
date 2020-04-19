import {Injectable} from '@angular/core';

import * as showdown from 'showdown';

// const showdown = require('showdown');
const converter = new showdown.Converter();

@Injectable()
export class MarkdownService {
  // converter object is not typescript

  toHtml(text: string) {
    return converter.makeHtml(text);
  }
}
