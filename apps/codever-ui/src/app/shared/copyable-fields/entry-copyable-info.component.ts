import { ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { CopyableField } from '../../core/model/copyable-field';
import { Note } from '../../core/model/note';

@Component({
  selector: 'app-entry-copyable-info',
  templateUrl: './entry-copyable-info.component.html',
  styleUrls: ['./entry-copyable-info.component.scss'],
})
export class EntryCopyableInfoComponent implements OnDestroy {
  @Input() fields: CopyableField[] = [];
  @Input() origin?: Note['origin'];
  copiedField: CopyableField | null = null;
  feedback = '';
  private copyTimeout?: ReturnType<typeof setTimeout>;

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
      this.feedback = '';
      this.copiedField = field;
      clearTimeout(this.copyTimeout);
      this.copyTimeout = setTimeout(() => {
        this.copiedField = null;
        this.cd.markForCheck();
      }, 2000);
    } catch {
      clearTimeout(this.copyTimeout);
      this.copiedField = null;
      this.feedback = 'Copy failed. Select the value and copy it manually.';
    }
    this.cd.markForCheck();
  }

  ngOnDestroy(): void {
    clearTimeout(this.copyTimeout);
  }
}
