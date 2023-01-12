import {Injectable} from '@angular/core';

import * as DOMPurify from 'dompurify';

import { marked } from 'marked';

@Injectable()
export class MarkdownService {
  // converter object is not typescript

  toHtml(text: string) {
    return DOMPurify.sanitize(marked.parse(text));
  }
}
