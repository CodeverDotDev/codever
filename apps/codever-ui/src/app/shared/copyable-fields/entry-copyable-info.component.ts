import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { CopyableField } from '../../core/model/copyable-field';
import { Note } from '../../core/model/note';

@Component({
  selector: 'app-entry-copyable-info',
  templateUrl: './entry-copyable-info.component.html',
  styleUrls: ['./entry-copyable-info.component.scss'],
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
