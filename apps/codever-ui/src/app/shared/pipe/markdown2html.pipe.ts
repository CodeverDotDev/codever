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

// Running count of task-list checkboxes rendered during the current parse.
// Incremented in document order (the same order NoteContentComponent reads the
// checkboxes from the DOM), so `renderer.list` can tag each checklist with the
// global start/end index of the items it contains — used by the reset button.
let renderedTaskCount = 0;

// Render GFM task-list checkboxes (`- [ ]` / `- [x]`) as *interactive* inputs.
// marked v4's default emits a `disabled` checkbox; we drop `disabled` and tag it
// with a class so NoteContentComponent can intercept clicks and persist the change.
// Plain list items (no `[ ]`) are unaffected — marked only calls this for task items.
renderer.checkbox = function (checked: boolean) {
  renderedTaskCount++;
  return `<input type="checkbox" class="note-task-checkbox"${
    checked ? ' checked' : ''
  } />`;
};

// Mark task-list items so we can hide the default list bullet (GitHub-style);
// plain list items keep their normal bullet/number.
renderer.listitem = function (text: string, task: boolean) {
  return task
    ? `<li class="note-task-list-item">${text}</li>\n`
    : `<li>${text}</li>\n`;
};

// Append a single "Reset" button after each *top-level* checklist. A nested
// sub-list renders first and returns its own button inside the parent's `body`;
// we strip those bubbled-up buttons so only the outermost list keeps one — and
// its index range then spans the whole checklist, nested sub-items included.
// The button carries the global index range (`data-task-start`/`data-task-end`)
// of its checkboxes so NoteContentComponent can uncheck exactly this checklist.
// `renderer.list` runs *after* its items, so `renderedTaskCount` is already the
// end index; subtracting the items in this list gives the start index.
renderer.list = function (body: string, ordered: boolean, start: number) {
  // Remove reset buttons emitted by nested task lists inside this list's body.
  const cleanBody = body.replace(
    /<button[^>]*class="note-task-reset"[^>]*>[\s\S]*?<\/button>\n?/g,
    ''
  );
  const type = ordered ? 'ol' : 'ul';
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
  const listHtml = `<${type}${startAttr}>\n${cleanBody}</${type}>\n`;

  const taskCount = (cleanBody.match(/class="note-task-checkbox"/g) || [])
    .length;
  if (taskCount === 0) {
    return listHtml;
  }
  const endIndex = renderedTaskCount;
  const startIndex = endIndex - taskCount;
  const resetButton =
    `<button type="button" class="note-task-reset"` +
    ` data-task-start="${startIndex}" data-task-end="${endIndex}"` +
    ` title="Uncheck all items in this checklist">↺ Reset</button>\n`;
  return listHtml + resetButton;
};

marked.setOptions({ renderer });

// DOMPurify config that allows KaTeX-generated MathML elements
const KATEX_SANITIZE_CONFIG = {
  ADD_TAGS: [
    'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn',
    'msup', 'msub', 'mfrac', 'msqrt', 'mroot', 'mover', 'munder',
    'munderover', 'mtable', 'mtr', 'mtd', 'mtext', 'mspace', 'mpadded',
    'menclose', 'mglyph', 'mmultiscripts', 'mprescripts', 'none',
    // Keep interactive task-list checkboxes through sanitization
    'input',
  ],
  ADD_ATTR: [
    'encoding', 'xmlns', 'mathvariant', 'displaystyle', 'scriptlevel',
    // Attributes needed for task-list checkboxes
    'type', 'checked',
  ],
};

@Pipe({ name: 'md2html' })
export class Markdown2HtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    // Reset the per-note task counter so reset-button indices start at 0.
    renderedTaskCount = 0;
    // Pre-process LaTeX math delimiters before markdown parsing
    const withLatex = renderLatex(text);
    const clean = DOMPurify.sanitize(marked.parse(withLatex), KATEX_SANITIZE_CONFIG);
    // Bypass Angular's built-in sanitizer which strips inline style attributes
    // that KaTeX needs for proper math layout. DOMPurify already handles sanitization.
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
