import { KeycloakEventType, KeycloakService } from 'keycloak-angular';
import { environment } from '../environments/environment';
import { UserInfoStore } from './core/user/user-info.store';
import { UserDataStore } from './core/user/userdata.store';

export function initializer(keycloak: KeycloakService, userInfoStore: UserInfoStore, userDataStore: UserDataStore): () => Promise<any> {
  return (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        keycloak.keycloakEvents$.subscribe(event => {
          if (event.type === KeycloakEventType.OnAuthSuccess) {
            userInfoStore.getUserInfo$().subscribe( userInfo => {
              userDataStore.loadInitialUserData(userInfo.sub, userInfo.given_name, userInfo.email);
              console.log('load initial userInfo');
            });
          }
          if (event.type === KeycloakEventType.OnAuthLogout) {
            this.userDataStore.resetUserDataStore();
          }
        });
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
