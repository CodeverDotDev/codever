import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  template:
    '  <div id="about-content" class="jumbotron"><h5>Snippet with the id "{{snippetId}}" was not found - the submitter might have deleted it</h5> </div>',
})
export class SnippetNotFoundComponent {
  snippetId: string;

  constructor(private route: ActivatedRoute) {
    this.snippetId = this.route.snapshot.queryParamMap.get('snippetId');
  }
}
