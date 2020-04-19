import {HighLightPipe} from "./highlight.pipe";

describe('HighlightHtml Pipe', () => {
  let highLightPipe: HighLightPipe;

  beforeEach(() => {
    highLightPipe = new HighLightPipe;
  });

  it('should be defined', () => {
    expect(highLightPipe).toBeDefined();
  });

  it('should add highlight span normal text search ', () => {
    expect(highLightPipe.transform('codingpedia is great', 'codingpedia')).toBe('<span class="highlight">codingpedia</span> is great', 'simple text highlight');
    //expect(highLightPipe.transform('codingpedia', 'codingpedia')).toContain('<span class="highlight">codingpedia</span>', 'highlight not finished tag');
    //expect(highlightHtmlPipe.transform('codingpedia is great', '[codingpe')).toContain('<span class="highlight">codingpe</span>dia is great', 'highlight not finished tag');
  });

  it('should add highlight span also when searching tags ', () => {
    expect(highLightPipe.transform('codingpedia is great', '[codingpe')).toContain('<span class="highlight">codingpe</span>dia is great', 'highlight when not finished tag');
    expect(highLightPipe.transform('codingpedia is great', '[codingpedia]')).toContain('<span class="highlight">codingpedia</span> is great', 'highlight when tag completed');
    expect(highLightPipe.transform('codingpedia is a great place to find angular resources', 'angular [codingpedia]'))
                        .toContain('<span class="highlight">codingpedia</span> is a great place to find <span class="highlight">angular</span> resources', 'highlight when tag plus search text');
  });

});
