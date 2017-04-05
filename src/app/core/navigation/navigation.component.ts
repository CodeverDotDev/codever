import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {KeycloakService} from "../keycloak/keycloak.service";

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
