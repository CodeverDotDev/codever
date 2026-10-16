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
      '<p>codingpedia</p>',
      'paragraph wrapping'
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
    expect(
      markdownService.toHtml('[Codingpedia](http://www.codingpedia.org)')
    ).toContain(
      '<p><a href="http://www.codingpedia.org">Codingpedia</a></p>',
      'Hyperlink generation'
    );
    expect(
      markdownService.toHtml(
        '[Codingpedia](http://www.codingpedia.org "Sharing coding knowledge")'
      )
    ).toContain(
      '<p><a href="http://www.codingpedia.org" title="Sharing coding knowledge">Codingpedia</a></p>',
      'hyperlink generation with title'
    );
  });
});
