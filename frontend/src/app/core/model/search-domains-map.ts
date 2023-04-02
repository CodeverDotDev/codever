import { SearchDomain } from './search-domain.enum';

export const searchDomains: any = new Map([
  [SearchDomain.ALL_MINE, 'All Mine'],
  [SearchDomain.MY_BOOKMARKS, 'My Bookmarks'],
  [SearchDomain.PUBLIC_BOOKMARKS, 'Public Bookmarks'],
  [SearchDomain.MY_SNIPPETS, 'My Snippets'],
  [SearchDomain.PUBLIC_SNIPPETS, 'Public Snippets'],
  [SearchDomain.MY_NOTES, 'My Notes'],
]);
