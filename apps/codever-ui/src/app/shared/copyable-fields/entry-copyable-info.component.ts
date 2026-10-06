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
  copiedKey: string | null = null;
  feedback = '';
  private copyTimeout?: ReturnType<typeof setTimeout>;

  constructor(private cd: ChangeDetectorRef) {}

  get sections(): { title: string; fields: CopyableField[] }[] {
    const source: CopyableField[] = [];
    const file = this.origin?.file?.split(/[\\/]/).pop();
    if (file) source.push({ label: 'File name', value: file });
    if (this.origin?.project)
      source.push({ label: 'Project', value: this.origin.project });
    return [
      { title: 'Source context', fields: source },
      { title: 'Additional fields (copyable)', fields: this.fields || [] },
    ];
  }

  async copy(field: CopyableField, key = ''): Promise<void> {
    try {
      await navigator.clipboard.writeText(field.value);
      this.feedback = '';
      this.copiedField = field;
      this.copiedKey = key;
      clearTimeout(this.copyTimeout);
      this.copyTimeout = setTimeout(() => {
        this.copiedField = null;
        this.copiedKey = null;
        this.cd.markForCheck();
      }, 2000);
    } catch {
      clearTimeout(this.copyTimeout);
      this.copiedField = null;
      this.copiedKey = null;
      this.feedback = 'Copy failed. Select the value and copy it manually.';
    }
    this.cd.markForCheck();
  }

  isCopied(key: string): boolean {
    return this.copiedKey === key;
  }

  ngOnDestroy(): void {
    clearTimeout(this.copyTimeout);
  }
}
