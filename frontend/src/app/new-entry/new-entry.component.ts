import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-entry-redirection',
  templateUrl: './new-entry.component.html',
  styleUrls: ['./new-entry.component.scss']
})
export class NewEntryComponent implements OnInit {

  url; // value of "url" query parameter if present
  popup; // if present will go popup to the submitted url
  popupExt; // set from the popup of the extension (firefox currently)}
  selection; // value of "selection" query parameter if present
  title; // value of "title" query parameter if present

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.url = this.route.snapshot.queryParamMap.get('url');
    this.selection = this.route.snapshot.queryParamMap.get('selection') || this.route.snapshot.queryParamMap.get('desc');
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.popupExt = this.route.snapshot.queryParamMap.get('popupExt');
  }

  redirectToNewBookmark() {
    this.router.navigate(['/my-bookmarks/new'],
      {
        queryParams: {
          url: this.url,
          desc: this.selection,
          title: this.title,
          popup: this.popup
        }
      });
  }

  redirectToNewSnippet() {
    this.router.navigate(['/my-snippets/new'],
      {
        queryParams: {
          sourceUrl: this.url,
          code: this.selection,
          title: this.title,
          popup: this.popup
        }
      });
  }

}
