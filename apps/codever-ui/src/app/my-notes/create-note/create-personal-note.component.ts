import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-personal-note-create',
  templateUrl: './create-personal-note.component.html',
})
export class CreatePersonalNoteComponent {
  initiator; // which component the call is coming from (e.g 'bookmarklet')
  title; // title if passed on
  content; // content if passed ond
  reference; // content if passed ond
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.content = this.route.snapshot.queryParamMap.get('content');
    this.initiator = this.route.snapshot.queryParamMap.get('initiator');
    this.reference = this.route.snapshot.queryParamMap.get('reference');
  }
}
