import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import * as DOMPurify from 'dompurify';
import { marked } from 'marked';
import hljs from 'highlight.js';

/**
 * Renders a Jupyter Notebook (.ipynb) from its raw JSON string.
 *
 * Supports:
 *  - Markdown cells   → rendered via marked + DOMPurify (same as md2html pipe)
 *  - Code cells        → syntax-highlighted via highlight.js with the notebook's kernel language
 *  - Outputs           → text/plain, text/html, image/png, image/jpeg, error tracebacks
 *
 * The raw .ipynb JSON is passed via the [ipynbJson] input.
 * Parsed once on change and stored as a list of renderable cells.
 */
@Component({
  selector: 'app-notebook-renderer',
  templateUrl: './notebook-renderer.component.html',
  styleUrls: ['./notebook-renderer.component.scss'],
  encapsulation: ViewEncapsulation.None, // allow hljs theme classes to apply
})
export class NotebookRendererComponent implements OnChanges {
  @Input() ipynbJson: string;

  /** Parsed cells ready for the template */
  cells: NotebookCell[] = [];

  /** Language detected from notebook metadata (e.g. 'python') */
  language = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ipynbJson'] && this.ipynbJson) {
      this.parseNotebook();
    }
  }

  // ---------------------------------------------------------------------------
  // Parsing
  // ---------------------------------------------------------------------------

  private parseNotebook(): void {
    try {
      const nb = JSON.parse(this.ipynbJson);

      // Detect the kernel language from notebook metadata (e.g. 'python', 'r', 'julia')
      this.language =
        nb.metadata?.kernelspec?.language?.toLowerCase() ||
        nb.metadata?.language_info?.name?.toLowerCase() ||
        '';

      this.cells = (nb.cells || []).map((cell: any, index: number) =>
        this.parseCell(cell, index)
      );
    } catch (e) {
      // If JSON is invalid, show an error cell
      this.cells = [
        {
          type: 'error',
          executionCount: null,
          sourceHtml: `<pre class="notebook-error">Failed to parse notebook: ${e.message}</pre>`,
          outputs: [],
        },
      ];
    }
  }

  private parseCell(cell: any, index: number): NotebookCell {
    const source = this.joinSource(cell.source);

    if (cell.cell_type === 'markdown') {
      return {
        type: 'markdown',
        executionCount: null,
        sourceHtml: DOMPurify.sanitize(marked.parse(source)),
        outputs: [],
      };
    }

    if (cell.cell_type === 'code') {
      return {
        type: 'code',
        executionCount: cell.execution_count ?? null,
        sourceHtml: this.highlightCode(source),
        outputs: (cell.outputs || []).map((o: any) => this.parseOutput(o)),
      };
    }

    // raw cells or unknown types — render as plain preformatted text
    return {
      type: 'raw',
      executionCount: null,
      sourceHtml: `<pre>${this.escapeHtml(source)}</pre>`,
      outputs: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Code highlighting
  // ---------------------------------------------------------------------------

  /** Highlight code using the notebook's kernel language, falling back to auto-detection */
  private highlightCode(code: string): string {
    const lang =
      this.language && hljs.getLanguage(this.language)
        ? this.language
        : null;
    const highlighted = lang
      ? hljs.highlight(code, { language: lang }).value
      : hljs.highlightAuto(code).value;
    return `<pre><code class="hljs${lang ? ' language-' + lang : ''}">${highlighted}</code></pre>`;
  }

  // ---------------------------------------------------------------------------
  // Output parsing
  // ---------------------------------------------------------------------------

  private parseOutput(output: any): NotebookOutput {
    // Stream output (stdout / stderr)
    if (output.output_type === 'stream') {
      return {
        type: output.name === 'stderr' ? 'stderr' : 'text',
        html: `<pre class="notebook-output-text">${this.escapeHtml(this.joinSource(output.text))}</pre>`,
      };
    }

    // Error traceback
    if (output.output_type === 'error') {
      const traceback = (output.traceback || [])
        .map((line: string) => this.stripAnsiCodes(line))
        .join('\n');
      return {
        type: 'error',
        html: `<pre class="notebook-output-error">${this.escapeHtml(traceback)}</pre>`,
      };
    }

    // Rich display output (execute_result or display_data)
    const data = output.data || {};

    // Prefer HTML, then images, then plain text
    if (data['text/html']) {
      return {
        type: 'html',
        html: DOMPurify.sanitize(this.joinSource(data['text/html'])),
      };
    }
    if (data['image/png']) {
      return {
        type: 'image',
        html: `<img src="data:image/png;base64,${data['image/png']}" alt="output image" class="notebook-output-image" />`,
      };
    }
    if (data['image/jpeg']) {
      return {
        type: 'image',
        html: `<img src="data:image/jpeg;base64,${data['image/jpeg']}" alt="output image" class="notebook-output-image" />`,
      };
    }
    if (data['text/plain']) {
      return {
        type: 'text',
        html: `<pre class="notebook-output-text">${this.escapeHtml(this.joinSource(data['text/plain']))}</pre>`,
      };
    }

    return { type: 'text', html: '' };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Notebook cell sources can be a string or an array of strings */
  private joinSource(source: string | string[]): string {
    return Array.isArray(source) ? source.join('') : source || '';
  }

  /** Strip ANSI escape codes (used in error tracebacks) */
  private stripAnsiCodes(text: string): string {
    return text.replace(
      /\x1b\[[0-9;]*[a-zA-Z]/g,
      ''
    );
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ---------------------------------------------------------------------------
// Types used by the template
// ---------------------------------------------------------------------------

export interface NotebookCell {
  type: 'markdown' | 'code' | 'raw' | 'error';
  executionCount: number | null;
  sourceHtml: string;
  outputs: NotebookOutput[];
}

export interface NotebookOutput {
  type: 'text' | 'html' | 'image' | 'error' | 'stderr';
  html: string;
}

