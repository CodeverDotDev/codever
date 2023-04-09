import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Snippet } from '../../core/model/snippet';
import { PublicSnippetsService } from '../../public/snippets/public-snippets.service';

@Component({
  selector: 'app-copy-to-mine-snippet',
  templateUrl: './copy-to-mine-snippet.component.html',
  styleUrls: ['./copy-to-mine-snippet.component.scss'],
})
export class CopyToMineSnippetComponent implements OnInit {
  snippet: Snippet;

  constructor(
    private route: ActivatedRoute,
    private publicSnippetsService: PublicSnippetsService
  ) {}

  ngOnInit(): void {
    this.snippet = window.history.state.snippet;
    if (!this.snippet) {
      const id = this.route.snapshot.paramMap.get('id');
      this.publicSnippetsService
        .getPublicSnippetById(id)
        .subscribe((snippet) => (this.snippet = snippet));
    }
  }
}
