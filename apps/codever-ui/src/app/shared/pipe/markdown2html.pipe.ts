import { Pipe, PipeTransform } from '@angular/core';
import * as DOMPurify from 'dompurify';

import { marked } from 'marked';

@Pipe({ name: 'md2html' })
export class Markdown2HtmlPipe implements PipeTransform {
  transform(text: string): string {
    return DOMPurify.sanitize(marked.parse(text));
  }
}
