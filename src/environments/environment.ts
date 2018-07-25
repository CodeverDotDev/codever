// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  APP_HOME_URL: 'http://localhost:4200',
  API_URL: 'https://www.codingmarks.org/api',
  HOST: 'http://localhost:4200/',
    keycloak:  {
        'realm': 'codingpedia',
        'url': 'https://www.codingmarks.org/auth',
        'clientId': 'codingmarks'
    }
};
