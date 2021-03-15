import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Snippet } from '../../core/model/snippet';
import { PublicSnippetsService } from '../snippets/public-snippets.service';
import { ActivatedRoute } from '@angular/router';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-public-snippets',
  templateUrl: './public-snippets.component.html',
  styleUrls: ['./public-snippets.component.css']
})
export class PublicSnippetsComponent implements OnInit {

  snippets$: Observable<Snippet[]>;

  currentPage = 1;
  callerPaginationPublicSnippets = 'public-snippets';

  constructor(private publicSnippetsService: PublicSnippetsService, private route: ActivatedRoute, private paginationNotificationService: PaginationNotificationService) { }

  ngOnInit(): void {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    }

    this.snippets$ = this.publicSnippetsService.getRecentPublicSnippets(this.currentPage, environment.PAGINATION_PAGE_SIZE);

    this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.callerPaginationPublicSnippets) {
        this.snippets$ = this.publicSnippetsService.getRecentPublicSnippets(paginationAction.page, environment.PAGINATION_PAGE_SIZE);
      }
    });
  }

}
