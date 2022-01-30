import { KeycloakEventType, KeycloakService } from 'keycloak-angular';
import { environment } from '../environments/environment';
import { UserInfoStore } from './core/user/user-info.store';
import { UserDataStore } from './core/user/userdata.store';
import { SystemService } from './core/cache/system.service';

export function initializer(keycloak: KeycloakService, userInfoStore: UserInfoStore, userDataStore: UserDataStore,
                            _systemService: SystemService): () => Promise<any> {
  return (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        _systemService.checkVersion();
        keycloak.keycloakEvents$.subscribe(event => {
          if (event.type === KeycloakEventType.OnAuthSuccess) {
            userInfoStore.getUserInfo$().subscribe(userInfo => {
              userDataStore.loadInitialUserData(userInfo.sub, userInfo.given_name, userInfo.email);
              console.log('load initial userInfo');
            });
          }
          if (event.type === KeycloakEventType.OnAuthLogout) {
            this.userDataStore.resetUserDataStore();
          }
          if (event.type === KeycloakEventType.OnTokenExpired) {
            keycloak.updateToken(20);
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
            silentCheckSsoRedirectUri:
              window.location.origin + '/assets/silent-check-sso.html'
          },
          bearerExcludedUrls: [
            '/api/public',
            '/assets'
          ]
        });
        resolve('true');
      } catch (error) {
        reject(error);
      }
    });
  };
}
