import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  template:
    '  <div id="about-content" class="jumbotron"><h5>Snippet with the id "{{snippetId}}" was not found - the submitter might have deleted it</h5> </div>',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SnippetNotFoundComponent {
  snippetId: string;

  constructor(private route: ActivatedRoute) {
    this.snippetId = this.route.snapshot.queryParamMap.get('snippetId');
  }
}
