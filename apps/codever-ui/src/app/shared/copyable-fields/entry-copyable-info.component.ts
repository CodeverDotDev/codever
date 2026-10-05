import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { CopyableField } from '../../core/model/copyable-field';
import { Note } from '../../core/model/note';

@Component({
  selector: 'app-entry-copyable-info',
  template: `
    @for (section of sections; track section.title) {
      @if (section.fields.length) {
        <section class="my-3">
          <h3 class="fs-6">{{ section.title }}</h3>
          <dl class="mb-0">
            @for (field of section.fields; track $index) {
              <div class="copyable-row">
                <dt>{{ field.label }}</dt>
                <dd class="mb-0"><code>{{ field.value }}</code></dd>
                <button type="button" class="btn btn-sm btn-outline-secondary"
                  [attr.aria-label]="'Copy ' + field.label" (click)="copy(field)">Copy</button>
              </div>
            }
          </dl>
        </section>
      }
    }
    <span role="status" aria-live="polite">{{ feedback }}</span>
  `,
  styles: [`
    .copyable-row { display: grid; grid-template-columns: minmax(5rem, 1fr) minmax(0, 3fr) auto;
      align-items: start; gap: .5rem; margin-bottom: .5rem; }
    dt, dd { overflow-wrap: anywhere; }
    code { white-space: pre-wrap; user-select: text; }
  `],
})
export class EntryCopyableInfoComponent {
  @Input() fields: CopyableField[] = [];
  @Input() origin?: Note['origin'];
  feedback = '';

  constructor(private cd: ChangeDetectorRef) {}

  get sections(): { title: string; fields: CopyableField[] }[] {
    const source: CopyableField[] = [];
    const file = this.origin?.file?.split(/[\\/]/).pop();
    if (file) source.push({ label: 'File name', value: file });
    if (this.origin?.project) source.push({ label: 'Project', value: this.origin.project });
    return [
      { title: 'Source context', fields: source },
      { title: 'Copyable fields', fields: this.fields || [] },
    ];
  }

  async copy(field: CopyableField): Promise<void> {
    try {
      await navigator.clipboard.writeText(field.value);
      this.feedback = `${field.label} copied.`;
    } catch {
      this.feedback = 'Copy failed. Select the value and copy it manually.';
    }
    this.cd.markForCheck();
  }
}
