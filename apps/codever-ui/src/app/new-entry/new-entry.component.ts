import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-entry-redirection',
  templateUrl: './new-entry.component.html',
  styleUrls: ['./new-entry.component.scss'],
})
export class NewEntryComponent implements OnInit {
  url; // value of "url" query parameter if present
  popup; // if present will go popup to the submitted url
  selection; // value of "selection" query parameter if present
  title; // value of "title" query parameter if present
  initiator; // value of "initiator" query parameter if present

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.url = this.route.snapshot.queryParamMap.get('url');
    this.selection =
      this.route.snapshot.queryParamMap.get('selection') ||
      this.route.snapshot.queryParamMap.get('desc');
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.initiator = this.route.snapshot.queryParamMap.get('initiator');
  }

  redirectToNewBookmark() {
    this.router.navigate(['/my-bookmarks/new'], {
      queryParams: {
        url: this.url,
        desc: this.selection,
        title: this.title,
        popup: this.popup,
        initiator: this.initiator,
      },
    });
  }

  redirectToNewSnippet() {
    this.router.navigate(['/my-snippets/new'], {
      queryParams: {
        sourceUrl: this.url,
        code: this.selection,
        title: this.title,
        popup: this.popup,
        initiator: this.initiator,
      },
    });
  }

  redirectToNewNote() {
    this.router.navigate(['/my-notes/new'], {
      queryParams: {
        sourceUrl: this.url,
        code: this.selection,
        title: this.title,
        popup: this.popup,
        initiator: this.initiator,
      },
    });
  }
}
