import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable, of } from 'rxjs';
import { Codelet } from '../../core/model/codelet';
import { PersonalCodeletsService } from '../../core/personal-codelets.service';

@Component({
  selector: 'app-update-snippet',
  templateUrl: './update-codelet.component.html',
  styleUrls: ['./update-codelet.component.scss']
})
export class UpdateCodeletComponent implements OnInit {

  snippet: Codelet;
  snippetId: string;
  userId: string;

  constructor(private route: ActivatedRoute,
              private personalCodeletsService: PersonalCodeletsService,
              private userInfoStore: UserInfoStore) {

  }

  ngOnInit(): void {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;
      this.snippet = window.history.state.codelet;
      if (!window.history.state.codelet) {
        this.snippetId = this.route.snapshot.paramMap.get('id');
        this.personalCodeletsService.getPersonalCodeletById(this.userId, this.snippetId).subscribe(snippet =>
          this.snippet = snippet
        );
      }
    });
  }
}
