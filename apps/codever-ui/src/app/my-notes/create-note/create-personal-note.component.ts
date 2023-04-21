import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-personal-note-create',
  templateUrl: './create-personal-note.component.html',
})
export class CreatePersonalNoteComponent {
  initiator; // which component the call is coming from (e.g 'bookmarklet')
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.initiator = this.route.snapshot.queryParamMap.get('initiator');
  }
}
