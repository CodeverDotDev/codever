import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
import { Router, RouterStateSnapshot } from '@angular/router';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './login-required-dialog.component.html',
  styleUrls: ['./login-required-dialog.component.scss']
})
export class LoginRequiredDialogComponent implements OnInit {

  message: string;

  constructor(
    private keycloakService: KeycloakService,
    private dialogRef: MatDialogRef<LoginRequiredDialogComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.message = data.message || 'You need to be logged in to be able execute this action';
  }

  ngOnInit() {
  }

  login() {
    const routerStateSnapshot: RouterStateSnapshot = this.router.routerState.snapshot;
    this.dialogRef.close('LOGIN_CONFIRMED');
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = environment.APP_HOME_URL  + routerStateSnapshot.url;
    this.keycloakService.login(options);
  }

  cancel() {
    this.dialogRef.close();
  }

}
