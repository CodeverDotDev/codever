import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { AuthenticationService } from '../../../core/auth/authentication.service';
import { Router } from '@angular/router';
import { KeycloakServiceWrapper } from '../../../core/keycloak-service-wrapper.service';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './login-required-dialog.component.html',
  styleUrls: ['./login-required-dialog.component.scss'],
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions],
})
export class LoginRequiredDialogComponent {
  message: string;

  constructor(
    private keycloakService: AuthenticationService,
    private keycloakServiceWrapper: KeycloakServiceWrapper,
    private dialogRef: MatDialogRef<LoginRequiredDialogComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.message =
      data.message || 'You need to be logged in to be able execute this action';
  }

  login() {
    this.dialogRef.close('LOGIN_CONFIRMED');
    this.keycloakServiceWrapper.login();
  }

  cancel() {
    this.dialogRef.close();
  }
}
