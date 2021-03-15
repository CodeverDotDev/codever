import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Snippet } from '../../core/model/snippet';
import { ActivatedRoute } from '@angular/router';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';
import { UserInfoStore } from '../../core/user/user-info.store';

@Component({
  selector: 'app-snippet-details-page',
  templateUrl: './snippet-details-page.component.html',
  styleUrls: ['./snippet-details-page.component.scss']
})
export class SnippetDetailsPageComponent implements OnInit {

  snippet$: Observable<Snippet>;
  snippetId: string;
  userId: string;

  popup: string;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  showCloseWindowBtn: boolean;

  constructor(
    private personalSnippetsService: PersonalSnippetsService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.snippet$ = of(window.history.state.snippet);
    if (!window.history.state.snippet) {
      this.userInfoStore.getUserInfo$().subscribe(userInfo => {
        this.userId = userInfo.sub;
        this.snippetId = this.route.snapshot.paramMap.get('id');
        this.snippet$ = this.personalSnippetsService.getPersonalSnippetById(this.userId, this.snippetId);
      });
    }
  }

  closeDialog() {
    window.close();
  }
}
