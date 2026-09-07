import { Component, Input } from '@angular/core';
import { AssistantReference } from '../assistant.model';

/**
 * Renders a single assistant reference (bookmark or note) as a compact,
 * clickable Codever card. Notes link to their details page; bookmarks link
 * to their target URL in a new tab.
 */
@Component({
  selector: 'app-assistant-reference-card',
  templateUrl: './reference-card.component.html',
  styleUrls: ['./reference-card.component.scss'],
  standalone: false,
})
export class ReferenceCardComponent {
  @Input() reference: AssistantReference;

  get isNote(): boolean {
    return this.reference?.type === 'note';
  }
}

