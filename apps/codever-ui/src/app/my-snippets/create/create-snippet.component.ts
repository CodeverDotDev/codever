import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-new-personal-snippet-form',
  templateUrl: './create-snippet.component.html',
  styleUrls: ['./create-snippet.component.scss'],
})
export class CreateSnippetComponent implements OnInit {
  title; // value of "title" query parameter if present
  code; // value of "desc" query parameter if present
  location; // value of "url" query parameter if present
  popup; // value of "url" query parameter if present
  tagsStr; // value of "tags" query parameter if present
  comment; // value of "comment" query parameter if present
  ext; // which extension the call is coming from (e.g 'vscode' from visual studio code extension)
  initiator; // which extension the call is coming from (e.g 'vscode' from visual studio code extension)
  file; // which extension the call is coming from (e.g 'vscode' from visual studio code extension)
  project; // which extension the call is coming from (e.g 'vscode' from visual studio code extension)
  workspace; // which extension the call is coming from (e.g 'vscode' from visual studio code extension)

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.code = this.route.snapshot.queryParamMap.get('code');
    this.location =
      this.route.snapshot.queryParamMap.get('sourceUrl') || // "sourceUrl" is present for legacy reasons of extensions
      this.route.snapshot.queryParamMap.get('location');
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.tagsStr = this.route.snapshot.queryParamMap.get('tags');
    this.comment = this.route.snapshot.queryParamMap.get('comment');
    this.ext = this.route.snapshot.queryParamMap.get('ext');
    this.initiator = this.route.snapshot.queryParamMap.get('initiator');
    this.file = this.route.snapshot.queryParamMap.get('file');
    this.project = this.route.snapshot.queryParamMap.get('project');
    this.workspace = this.route.snapshot.queryParamMap.get('workspace');
  }
}
