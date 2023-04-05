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
