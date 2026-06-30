import { Injectable } from '@angular/core';

import * as DOMPurify from 'dompurify';

import { marked } from 'marked';
import { renderLatex } from '../../shared/render-latex.util';

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

@Injectable()
export class MarkdownService {
  // converter object is not typescript

  toHtml(text: string) {
    const withLatex = renderLatex(text);
    return DOMPurify.sanitize(marked.parse(withLatex), KATEX_SANITIZE_CONFIG);
  }
}
