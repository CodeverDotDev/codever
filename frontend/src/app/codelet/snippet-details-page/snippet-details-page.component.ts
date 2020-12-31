import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Codelet } from '../../core/model/codelet';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { UserInfoStore } from '../../core/user/user-info.store';

@Component({
  selector: 'app-codelet-details',
  templateUrl: './snippet-details-page.component.html',
  styleUrls: ['./snippet-details-page.component.scss']
})
export class SnippetDetailsPageComponent implements OnInit {

  snippet$: Observable<Codelet>;
  codeletId: string;
  userId: string;

  popup: string;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  showCloseWindowBtn: boolean;

  constructor(
    private personalCodeletsService: PersonalCodeletsService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.snippet$ = of(window.history.state.snippet);
    if (!window.history.state.snippet) {
      this.userInfoStore.getUserInfo$().subscribe(userInfo => {
        this.userId = userInfo.sub;
        this.codeletId = this.route.snapshot.paramMap.get('id');
        this.snippet$ = this.personalCodeletsService.getPersonalCodeletById(this.userId, this.codeletId);
      });
    }
  }

  closeDialog() {
    window.close();
  }
}
