import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as DOMPurify from 'dompurify';

import { marked } from 'marked';
import hljs from 'highlight.js';
import { renderLatex } from '../render-latex.util';

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

// DOMPurify config that allows KaTeX-generated MathML elements
const KATEX_SANITIZE_CONFIG = {
  ADD_TAGS: [
    'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn',
    'msup', 'msub', 'mfrac', 'msqrt', 'mroot', 'mover', 'munder',
    'munderover', 'mtable', 'mtr', 'mtd', 'mtext', 'mspace', 'mpadded',
    'menclose', 'mglyph', 'mmultiscripts', 'mprescripts', 'none',
  ],
  ADD_ATTR: ['encoding', 'xmlns', 'mathvariant', 'displaystyle', 'scriptlevel'],
};

@Pipe({ name: 'md2html' })
export class Markdown2HtmlPipe implements PipeTransform {
  transform(text: string): string {
    // Pre-process LaTeX math delimiters before markdown parsing
    const withLatex = renderLatex(text);
    return DOMPurify.sanitize(marked.parse(withLatex), KATEX_SANITIZE_CONFIG);
  }
}
