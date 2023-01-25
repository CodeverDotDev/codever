import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { PublicSnippetsService } from '../public-snippets.service';
import { Snippet } from '../../../core/model/snippet';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-shared-snippet-details',
  templateUrl: './shareable-snippet-details.component.html',
  styleUrls: ['./shareable-snippet-details.component.scss']
})
export class ShareableSnippetDetailsComponent implements OnInit {

  snippet$: Observable<Snippet>;
  popup: string;

  constructor(
    private route: ActivatedRoute,
    private publicSnippetsService: PublicSnippetsService
  ) {
  }

  ngOnInit() {
    this.snippet$ = this.route.paramMap.pipe(
      switchMap(params => {
        return this.publicSnippetsService.getSharedSnippetBySharableId(params.get('shareableId'))
      }));
  }
}
