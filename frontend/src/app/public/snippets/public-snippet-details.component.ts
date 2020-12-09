import { Component, OnInit } from '@angular/core';
import { UserInfoStore } from '../../core/user/user-info.store';
import { ActivatedRoute } from '@angular/router';
import { PublicSnippetsService } from './public-snippets.service';
import { Observable } from 'rxjs';
import { Codelet } from '../../core/model/codelet';

@Component({
  selector: 'app-public-snippet-details',
  templateUrl: './public-snippet-details.component.html'
})
export class PublicSnippetDetailsComponent implements OnInit {
  snippetId: string;
  snippet$: Observable<Codelet>;

  constructor(
    private publicSnippetsService: PublicSnippetsService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.snippetId = this.route.snapshot.paramMap.get('id');
    this.snippet$ = this.publicSnippetsService.getPublicSnippetById(this.snippetId);
  }

}
