export const environment = {
  production: false,
  APP_HOME_URL: 'http://localhost:4200',
  API_URL: 'http://localhost:3000/api',
  HOST: 'http://localhost:4200',
  keycloak:  {
    'realm': 'bookmarks',
    'url': 'http://localhost:8480/auth',
    'clientId': 'bookmarks'
  },
  PAGINATION_PAGE_SIZE: 5,
  TOP_PUBLIC_USER_TAGS_LIMIT: 10,
  RECENT_PUBLIC_USER_BOOKMARKS_LIMIT: 5,
  SAVED_RECENT_SEARCH_PRO_DOMAIN_SIZE: 20,
  LOCALSTORAGE_CACHE_VERSION: 1,
  LOADER_SHOWN_DELAY: 500
};
