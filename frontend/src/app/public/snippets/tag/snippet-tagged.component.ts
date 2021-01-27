import { Component, OnInit } from '@angular/core';
import { SnippetTagService } from './snippet-tag.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Codelet } from '../../../core/model/codelet';
import { environment } from '../../../../environments/environment';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';


@Component({
  selector: 'app-snippets-tagged',
  templateUrl: './snippet-tagged.component.html',
  styleUrls: ['./snippet-tag.component.css']
})
export class SnippetTaggedComponent implements OnInit {

  snippetsForTag$: Observable<Codelet[]>;
  tag: string;
  orderBy = 'LATEST';
  userIsLoggedIn = false;
  currentPage = 1;
  taggedCallerPagination = 'snippet-tagged-page';

  constructor(private snippetTagService: SnippetTagService,
              private paginationNotificationService: PaginationNotificationService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    }

    this.route.paramMap.subscribe(
      params => {
        this.tag = params.get('tag');
        if (this.tag) {
          this.snippetsForTag$ = this.snippetTagService.getPublicSnippetsForTag(this.tag, this.orderBy, this.currentPage, environment.PAGINATION_PAGE_SIZE);
        } else {
          this.tag = this.route.snapshot.url[0].path;
          this.snippetsForTag$ = this.snippetTagService.getPublicSnippetsForTag(this.tag, this.orderBy, this.currentPage, environment.PAGINATION_PAGE_SIZE);
        }
      });

    this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.taggedCallerPagination) {
        this.snippetsForTag$ = this.snippetTagService.getPublicSnippetsForTag(this.tag, this.orderBy, paginationAction.page, environment.PAGINATION_PAGE_SIZE);
      }
    });
  }

  getLatestForTag() {
    this.orderBy = 'LATEST';
    this.snippetsForTag$ = this.snippetTagService.getPublicSnippetsForTag(this.tag, this.orderBy, this.currentPage, environment.PAGINATION_PAGE_SIZE);
  }

  getByLikeCount() {
    this.orderBy = 'LIKE_COUNT';
    this.snippetsForTag$ = this.snippetTagService.getPublicSnippetsForTag(this.tag, this.orderBy, this.currentPage, environment.PAGINATION_PAGE_SIZE);
  }

}
