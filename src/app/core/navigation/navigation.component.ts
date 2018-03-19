import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {KeycloakService} from 'keycloak-angular';

@Component({
  selector: 'my-navigation',
  templateUrl: './navigation.component.html',
})
export class NavigationComponent  implements OnInit {

  isLoggedIn: boolean;

  async ngOnInit(): Promise<void> {
    this.isLoggedIn = await this.keycloakService.isLoggedIn();
  }

  constructor(private keycloakService: KeycloakService,  private router: Router) {}

  logout() {
    this.keycloakService.logout();
    this.router.navigate(['/']);
  }

  login() {
    this.keycloakService.login().then(() => this.isLoggedIn = true);
  }
}
