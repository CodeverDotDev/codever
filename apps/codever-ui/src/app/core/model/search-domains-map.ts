import { SearchDomain } from './search-domain.enum';

export const searchDomains: any = new Map([
  [SearchDomain.ALL_MINE, 'All Mine'],
  [SearchDomain.MY_BOOKMARKS, 'My Bookmarks'],
  [SearchDomain.PUBLIC_BOOKMARKS, 'Public Bookmarks'],
  [SearchDomain.MY_NOTES, 'My Notes'],
  [SearchDomain.PUBLIC_NOTES, 'Public Notes'],
]);
