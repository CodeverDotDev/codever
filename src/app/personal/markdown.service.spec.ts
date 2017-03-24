import {MarkdownService} from "./markdown.service";

describe('Markdown transformer service', () => {
  let markdownService: MarkdownService;

  beforeEach(() => {
    markdownService = new MarkdownService;
  });

  it('tests test setup', () => {
    expect(markdownService).toBeDefined();
  });

});
