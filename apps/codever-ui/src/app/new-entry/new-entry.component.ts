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
  workspace; // value of "initiator" query parameter if present
  project; // value of "initiator" query parameter if present
  file; // value of "initiator" query parameter if present

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.url = this.route.snapshot.queryParamMap.get('url');
    this.selection =
      this.route.snapshot.queryParamMap.get('selection') ||
      this.route.snapshot.queryParamMap.get('desc');
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.initiator = this.route.snapshot.queryParamMap.get('initiator');
    this.workspace = this.route.snapshot.queryParamMap.get('worskpace');
    this.project = this.route.snapshot.queryParamMap.get('project');
    this.file = this.route.snapshot.queryParamMap.get('file');
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
        location: this.url,
        code: this.selection,
        title: this.title,
        popup: this.popup,
        initiator: this.initiator,
        workspace: this.workspace,
        project: this.project,
        file: this.file,
      },
    });
  }

  redirectToNewNote() {
    this.router.navigate(['/my-notes/new'], {
      queryParams: {
        reference: this.url,
        content: this.selection,
        title: this.title,
        popup: this.popup,
        initiator: this.initiator,
      },
    });
  }
}
