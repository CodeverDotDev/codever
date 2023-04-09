import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { Snippet } from '../../core/model/snippet';
import { ActivatedRoute } from '@angular/router';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-snippet-details-page',
  templateUrl: './snippet-details-page.component.html',
  styleUrls: ['./snippet-details-page.component.scss'],
})
export class SnippetDetailsPageComponent implements OnInit {
  snippet$: Observable<Snippet>;

  popup: string;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  showCloseWindowBtn: boolean;

  environment = environment;

  snippetTitle: string;

  constructor(
    private personalSnippetsService: PersonalSnippetsService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    if (window.history.state.snippet) {
      this.snippetTitle = window.history.state.snippet.title;
      this.snippet$ = of(window.history.state.snippet);
    } else {
      this.snippet$ = combineLatest([
        this.userInfoStore.getUserId$(),
        this.route.paramMap,
      ]).pipe(
        take(1),
        switchMap(([userId, paramMap]) => {
          return this.personalSnippetsService.getPersonalSnippetById(
            userId,
            paramMap.get('id')
          );
        })
      );
    }
  }

  closeDialog() {
    window.close();
  }
}
