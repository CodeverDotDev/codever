import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Snippet } from '../../core/model/snippet';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';
import { KeycloakService } from 'keycloak-angular';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LoginRequiredDialogComponent } from '../dialog/login-required-dialog/login-required-dialog.component';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';

@Component({
  selector: 'app-snippet-details',
  templateUrl: './snippet-details.component.html',
  styleUrls: ['./snippet-details.component.scss']
})
export class SnippetDetailsComponent implements OnInit, OnChanges {

  @Input()
  snippet: Snippet;

  userId: string;
  userId$: Observable<string>;
  userIsLoggedIn$: Observable<boolean>;

  source: string; // "public" or "personal"

  @Input()
  queryText: string;

  @Input()
  inlist = false; // whether it is displayed in list (search results) or singular (details)

  constructor(
    public loginDialog: MatDialog,
    private personalCodeletsService: PersonalSnippetsService,
    private publicSnippetsService: PublicSnippetsService,
    private keycloakService: KeycloakService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute,
    private router: Router,
    private metaService: Meta, private titleService: Title
  ) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.snippet) {
      this.metaService.updateTag({property: 'og:title', content: this.snippet.title});
      this.metaService.updateTag({property: 'og:description', content: `Code snippet - ${this.snippet.title}`});
      this.titleService.setTitle(this.snippet.title);
    }
  }

  ngOnInit(): void {
    this.userIsLoggedIn$ = fromPromise(this.keycloakService.isLoggedIn());
    this.userId$ = this.userInfoStore.getUserId$();

    this.metaService.updateTag({
      property: 'og:image',
      content: `${environment.HOST}/assets/img/og-image/codever-snippets-1200x627.jpeg`
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

  editSnippet(snippet: Snippet) {
    const link = [`/my-snippets/${snippet._id}/edit`];
    this.router.navigate(link, {state: {snippet: snippet}});
  }


  copyToMine(userIsLoggedIn: boolean, snippet: Snippet): void {
    if (!userIsLoggedIn) {
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
