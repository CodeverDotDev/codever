import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Codelet } from '../../core/model/codelet';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';
import { KeycloakService } from 'keycloak-angular';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LoginRequiredDialogComponent } from '../login-required-dialog/login-required-dialog.component';

@Component({
  selector: 'app-snippet-details',
  templateUrl: './snippet-details.component.html',
  styleUrls: ['./snippet-details.component.scss']
})
export class SnippetDetailsComponent implements OnInit {

  @Input()
  snippet$: Observable<Codelet>;

  userIsLoggedIn = false;

  userId: string;

  source: string; // "public" or "personal"

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  inlist = false; // whether it is displayed in list (search results) or singular (details)

  constructor(
    public loginDialog: MatDialog,
    private personalCodeletsService: PersonalCodeletsService,
    private publicSnippetsService: PublicSnippetsService,
    private keycloakService: KeycloakService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute,
    private router: Router) {

  }

  ngOnInit(): void {

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
        });
      }
    });
  }

  copyMessage(val: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  editCodelet(snippet: Codelet) {
    const link = [`/my-snippets/${snippet._id}/edit`];
    this.router.navigate(link, {state: {codelet: snippet}});
  }


  copyToMine(snippet: Codelet): void {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to copy it to your personal list'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      const link = [`./my-snippets/${snippet._id}/copy-to-mine`];
      this.router.navigate(link, {state: {snippet: snippet}});
    }
  }
}
