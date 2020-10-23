import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Codelet } from '../../core/model/codelet';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';
import { UserInfoStore } from '../../core/user/user-info.store';

@Component({
  selector: 'app-codelet-details',
  templateUrl: './codelet-details.component.html',
  styleUrls: ['./codelet-details.component.scss']
})
export class CodeletDetailsComponent implements OnInit {

  codelet$: Observable<Codelet>;
  codeletId: string;
  userId: string;

  popup: string;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  constructor(
    private personalCodeletsService: PersonalCodeletsService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute,
    private router: Router) {

  }

  ngOnInit(): void {
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.codelet$ = of(window.history.state.codelet);
    if (!window.history.state.codelet) {
      this.userInfoStore.getUserInfo$().subscribe(userInfo => {
        this.userId = userInfo.sub;
        this.codeletId = this.route.snapshot.paramMap.get('id');
        this.codelet$ = this.personalCodeletsService.getPersonalCodeletById(this.userId, this.codeletId);
      });
    }
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

  editCodelet(codelet: Codelet) {
    const link = [`/my-snippets/${codelet._id}/edit`];
    this.router.navigate(link, {state: {codelet: codelet}});
  }

  closeDialog() {
    window.close();
  }
}
