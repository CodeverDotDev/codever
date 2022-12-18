export const environment = {
  production: true,
  APP_HOME_URL: 'https://www.codever.dev',
  API_URL: 'https://www.codever.dev/api',
  HOST: 'https://www.codever.dev',
  keycloak:  {
    'realm': 'bookmarks',
    'url': 'https://www.codever.dev/auth',
    'clientId': 'bookmarks'
  },
  PAGINATION_PAGE_SIZE: 10,
  TOP_PUBLIC_USER_TAGS_LIMIT: 10,
  RECENT_PUBLIC_USER_BOOKMARKS_LIMIT: 5,
  SAVED_RECENT_SEARCH_PRO_DOMAIN_SIZE: 50,
  LOCALSTORAGE_CACHE_VERSION: 1,
  LOADER_SHOWN_DELAY: 1000
};
