import { Component, OnInit } from '@angular/core';
import { UserInfoStore } from '../../core/user/user-info.store';
import { ActivatedRoute } from '@angular/router';
import { PublicSnippetsService } from './public-snippets.service';
import { Observable } from 'rxjs';
import { Snippet } from '../../core/model/snippet';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-public-snippet-details',
  templateUrl: './public-snippet-details.component.html'
})
export class PublicSnippetDetailsComponent implements OnInit {
  snippetId: string;
  snippet$: Observable<Snippet>;

  constructor(
    private publicSnippetsService: PublicSnippetsService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.snippet$ = this.route.paramMap.pipe(
      switchMap(params => {
        this.snippetId = params.get('id');
        return this.publicSnippetsService.getPublicSnippetById(this.snippetId);
      })
    );
  }

}
