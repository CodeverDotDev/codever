import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Snippet } from '../../core/model/snippet';
import { PersonalSnippetsService } from '../../core/personal-snippets.service';

@Component({
  selector: 'app-update-snippet',
  templateUrl: './update-snippet.component.html',
  styleUrls: ['./update-snippet.component.scss']
})
export class UpdateSnippetComponent implements OnInit {

  snippet: Snippet;
  snippetId: string;
  userId: string;

  constructor(private route: ActivatedRoute,
              private personalSnippetsService: PersonalSnippetsService,
              private userInfoStore: UserInfoStore) {

  }

  ngOnInit(): void {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;
      this.snippet = window.history.state.snippet;
      if (!window.history.state.snippet) {
        this.snippetId = this.route.snapshot.paramMap.get('id');
        this.personalSnippetsService.getPersonalSnippetById(this.userId, this.snippetId).subscribe(snippet =>
          this.snippet = snippet
        );
      }
    });
  }
}
