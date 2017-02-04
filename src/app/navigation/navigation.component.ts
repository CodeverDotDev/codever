import {Component} from "@angular/core";
import {KeycloakService} from "../keycloak/keycloak.service";
import {Router} from "@angular/router";

@Component({
  selector: 'my-navigation',
  templateUrl: './navigation.component.html',
})
export class NavigationComponent {


  constructor(private keycloakService: KeycloakService,  private router: Router){}

  logout(){
    this.keycloakService.logout();
    this.router.navigate(['/']);
  }

  login(){
    this.keycloakService.login();
  }
}
