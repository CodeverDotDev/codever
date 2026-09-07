import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    template: '  <div id="about-content" class="jumbotron"><h5>Note with the id "{{noteId}}" was not found - the submitter might have deleted it</h5> </div>',
    standalone: false
})
export class NoteNotFoundComponent {
  noteId: string;

  constructor(private route: ActivatedRoute) {
    this.noteId = this.route.snapshot.queryParamMap.get('noteId');
  }
}

