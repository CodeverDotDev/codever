import { KeycloakService } from 'keycloak-angular';
import {environment} from '../environments/environment';

export function initializer(keycloak: KeycloakService): () => Promise<any> {
  return (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        await keycloak.init({
          config: {
            url: environment.keycloak.url, // .ie: http://localhost:8080/auth/
            realm: environment.keycloak.realm, // .ie: master
            clientId: environment.keycloak.clientId // .ie: account
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
