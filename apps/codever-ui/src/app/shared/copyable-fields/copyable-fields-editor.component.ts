import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import {
  copyableFieldGroup, copyableFieldsForm, MAX_COPYABLE_FIELDS,
  MAX_LABEL_LENGTH, MAX_VALUE_LENGTH,
} from './copyable-fields.form';

@Component({
  selector: 'app-copyable-fields-editor',
  imports: [ReactiveFormsModule, MatTooltip],
  templateUrl: './copyable-fields-editor.component.html',
  styleUrls: ['./copyable-fields-editor.component.scss'],
})
export class CopyableFieldsEditorComponent implements OnChanges {
  @Input({ required: true }) fields: ReturnType<typeof copyableFieldsForm>;
  readonly maxFields = MAX_COPYABLE_FIELDS;
  readonly labelLimit = MAX_LABEL_LENGTH;
  readonly valueLimit = MAX_VALUE_LENGTH;
  readonly description = 'Add optional label/value pairs for information you want to copy quickly.';
  isExpanded = false;

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.fields?.length) this.isExpanded = true;
  }

  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }

  fieldError(control: AbstractControl, fieldName: string, limit: number): string {
    const value = control.value as string;
    if (!value?.trim()) return `${fieldName} is required.`;
    if (/[\r\n\u2028\u2029]/.test(value)) return `${fieldName} must use a single line.`;
    if (value.trim().length > limit) return `${fieldName} must be at most ${limit} characters.`;
    return `${fieldName} is invalid.`;
  }

  add(): void {
    if (this.fields.length < this.maxFields) {
      this.fields.push(copyableFieldGroup());
      this.fields.markAsDirty();
    }
  }

  remove(index: number): void {
    this.fields.removeAt(index);
    this.fields.markAsDirty();
  }

  move(index: number, direction: number): void {
    const target = index + direction;
    if (target < 0 || target >= this.fields.length) return;
    const row = this.fields.at(index);
    this.fields.removeAt(index);
    this.fields.insert(target, row);
    this.fields.markAsDirty();
  }
}
