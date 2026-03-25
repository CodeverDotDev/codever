import { Pipe, PipeTransform } from '@angular/core';
import * as DOMPurify from 'dompurify';

import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({
  highlight: function (code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

@Pipe({ name: 'md2html' })
export class Markdown2HtmlPipe implements PipeTransform {
  transform(text: string): string {
    return DOMPurify.sanitize(marked.parse(text));
  }
}
