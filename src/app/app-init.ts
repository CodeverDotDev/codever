import { KeycloakService } from 'keycloak-angular';

export function initializer(keycloak: KeycloakService): () => Promise<any> {
  return (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        await keycloak.init({
          config: {
            url: 'http://localhost:8380/auth/', // .ie: http://localhost:8080/auth/
            realm: 'codingpedia', // .ie: master
            clientId: 'bookmarks' // .ie: account
          },
          initOptions: {
            onLoad: 'check-sso',
            checkLoginIframe: false
          },
          bearerExcludedUrls: [
            '/api/public'
          ]
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}
