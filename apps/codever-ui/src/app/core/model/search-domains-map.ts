import { SearchDomain } from './search-domain.enum';

export const searchDomains: any = new Map([
  [SearchDomain.ALL_MINE, 'Personal'],
  [SearchDomain.PUBLIC_BOOKMARKS, 'Public Bookmarks'],
  [SearchDomain.PUBLIC_NOTES, 'Public Notes'],
]);
