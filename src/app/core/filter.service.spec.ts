import {BookmarkFilterService} from "./filter.service";

describe('Filter Service', () => {
  let filterService: BookmarkFilterService;

  beforeEach(() => {
    filterService = new BookmarkFilterService;
  });

  it('should be defined', () => {
    expect(filterService).toBeDefined();
  });

  it('should add split words separated by spaces ', () => {
    expect(filterService.splitSearchQuery('codingpedia is great')).toEqual([['codingpedia', 'is', 'great'], []]);
    expect(filterService.splitSearchQuery(' codingpedia is great')).toEqual([['codingpedia', 'is', 'great'], []]);
    expect(filterService.splitSearchQuery(' codingpedia   is great')).toEqual([['codingpedia', 'is', 'great'], []]);
    expect(filterService.splitSearchQuery(' codingpedia   is great')).toEqual([['codingpedia', 'is', 'great'], []]);
    expect(filterService.splitSearchQuery(' codingpedia   is great    ')).toEqual([['codingpedia', 'is', 'great'], []]);
  });

  it('should split words and tags separated by spaces ', () => {
    expect(filterService.splitSearchQuery('angular [javascript]')).toEqual([['angular'], ['javascript']]);
    expect(filterService.splitSearchQuery('angular [javascript] [web]')).toEqual([['angular'], ['javascript', 'web']]);
    expect(filterService.splitSearchQuery(' angular [javascript] [web]')).toEqual([['angular'], ['javascript', 'web']]);
    expect(filterService.splitSearchQuery(' angular [javascript] [web performance]')).toEqual([['angular'], ['javascript', 'web performance']]);
    expect(filterService.splitSearchQuery(' angular [javascript] [web performance ]  ')).toEqual([['angular'], ['javascript', 'web performance']]);
    expect(filterService.splitSearchQuery(' angular [javascript] codingpedia')).toEqual([['angular', 'codingpedia'], ['javascript']]);
    expect(filterService.splitSearchQuery(' angular [javascript] codingpedia  ')).toEqual([['angular', 'codingpedia'], ['javascript']]);
  });

  it('should split words and tags with incomplete tags ', () => {
    expect(filterService.splitSearchQuery('angular [javascript')).toEqual([['angular'], ['javascript']]);
    expect(filterService.splitSearchQuery('angular [performance] [javascript')).toEqual([['angular'], ['performance', 'javascript']], 'input: "angular [performance] [javascript"');
    expect(filterService.splitSearchQuery('angular [javascript [performance ')).toEqual([['angular'], ['javascript', 'performance']], 'input: "angular [javascript [performance "');
    expect(filterService.splitSearchQuery('angular [javascript] [performance ')).toEqual([['angular'], ['javascript', 'performance']], 'input: "angular [javascript] [performance "');
    expect(filterService.splitSearchQuery('angular [javascript] [web performance ')).toEqual([['angular'], ['javascript', 'web performance']], 'input: "angular [javascript] [performance "');
  });

});
