import { beforeEach, describe, expect, it } from 'vitest';
import { MarkdownService } from './markdown.service';

describe('Markdown transformer service', () => {
  let markdownService: MarkdownService;

  beforeEach(() => {
    markdownService = new MarkdownService();
  });

  it('should be defined', () => {
    expect(markdownService).toBeDefined();
  });

  it('should generate paragraph wrapping text', () => {
    expect(markdownService.toHtml('codingpedia')).toContain(
      '<p>codingpedia</p>'
    );
  });

  it('should preserve multiline equations through Markdown and sanitization', () => {
    const math = String.raw`\delta^{m+1}
=
\frac{\partial L}{\partial z^{m+1}}
=
\frac{\partial L}{\partial a^{m+1}}
\odot
\phi'_{m+1}(z^{m+1})`;
    const container = document.createElement('div');
    container.innerHTML = markdownService.toHtml(`\\[\n${math}\n\\]`);

    expect(container.querySelectorAll('.katex').length).toBe(1);
    expect(container.querySelector('annotation')?.textContent).toBe(math);
    expect(container.querySelector('.katex-html')).not.toBeNull();
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('.katex-error')).toBeNull();
    expect(container.textContent).not.toContain('CODEVERMATH');
  });

  it('should generate hyperlinks', () => {
    const html = markdownService.toHtml(
      '[Codingpedia](http://www.codingpedia.org)'
    );
    expect(html).toContain('href="http://www.codingpedia.org"');
    expect(html).toContain('Codingpedia</a>');

    const htmlWithTitle = markdownService.toHtml(
      '[Codingpedia](http://www.codingpedia.org "Sharing coding knowledge")'
    );
    expect(htmlWithTitle).toContain('href="http://www.codingpedia.org"');
    expect(htmlWithTitle).toContain('title="Sharing coding knowledge"');
    expect(htmlWithTitle).toContain('Codingpedia</a>');
  });

  it('sanitizes executable HTML embedded in shared Markdown content', () => {
    const rendered = markdownService.toHtml(
      '<script>alert(1)</script><img src=x onerror="alert(1)">'
    );

    expect(rendered).not.toContain('<script');
    expect(rendered).not.toContain('onerror');
  });
});
