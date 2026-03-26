import { Pipe, PipeTransform } from '@angular/core';
import * as DOMPurify from 'dompurify';

import { marked } from 'marked';
import hljs from 'highlight.js';

// Custom renderer to apply highlight.js syntax highlighting to fenced code blocks
// and add the 'hljs' CSS class so the github-dark theme (included in angular.json) is applied
const renderer = new marked.Renderer();
renderer.code = function (code: string, language: string) {
  const lang = language && hljs.getLanguage(language) ? language : null;
  const highlighted = lang
    ? hljs.highlight(code, { language: lang }).value
    : hljs.highlightAuto(code).value;
  return `<pre><code class="hljs${lang ? ' language-' + lang : ''}">${highlighted}</code></pre>`;
};

marked.setOptions({ renderer });

@Pipe({ name: 'md2html' })
export class Markdown2HtmlPipe implements PipeTransform {
  transform(text: string): string {
    return DOMPurify.sanitize(marked.parse(text));
  }
}
