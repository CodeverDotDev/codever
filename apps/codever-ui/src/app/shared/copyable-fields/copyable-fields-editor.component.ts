import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  copyableFieldGroup, copyableFieldsForm, MAX_COPYABLE_FIELDS,
  MAX_LABEL_LENGTH, MAX_VALUE_LENGTH,
} from './copyable-fields.form';

@Component({
  selector: 'app-copyable-fields-editor',
  imports: [ReactiveFormsModule],
  template: `
    <fieldset class="border rounded p-2 mb-3">
      <legend class="fs-6 mb-0">
        <button type="button" class="copyable-fields-toggle" (click)="toggle()"
          [attr.aria-expanded]="isExpanded" aria-controls="copyable-fields-editor-content">
          <span>Additional fields (copyable)</span>
          <i class="fas fa-info-circle" [attr.title]="description" aria-hidden="true"></i>
          <i class="fas" [class.fa-chevron-down]="!isExpanded" [class.fa-chevron-up]="isExpanded"
            aria-hidden="true"></i>
        </button>
      </legend>
      @if (isExpanded) {
        <div id="copyable-fields-editor-content">
          <p class="text-body-secondary">{{ description }}</p>
          @for (row of fields.controls; track row; let i = $index) {
            <div [formGroup]="row" class="row g-2 mb-2">
              <label class="col-sm-3">Label
                <textarea rows="1" wrap="off" class="form-control" formControlName="label"
                  required [attr.aria-invalid]="row.controls.label.invalid" aria-label="Field label"></textarea>
              </label>
              <label class="col-sm-6">Value
                <textarea rows="1" wrap="off" class="form-control" formControlName="value"
                  required [attr.aria-invalid]="row.controls.value.invalid" aria-label="Field value"></textarea>
              </label>
              <div class="col-sm-3 d-flex align-items-end gap-1">
                <button type="button" class="btn btn-sm btn-outline-secondary" (click)="move(i, -1)"
                  [disabled]="i === 0" [attr.aria-label]="'Move field ' + (i + 1) + ' up'">Up</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" (click)="move(i, 1)"
                  [disabled]="i === fields.length - 1" [attr.aria-label]="'Move field ' + (i + 1) + ' down'">Down</button>
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="remove(i)"
                  [attr.aria-label]="'Remove field ' + (i + 1)">Remove</button>
              </div>
              @if (row.invalid && (row.dirty || row.touched)) {
                <p class="text-danger mb-0" role="alert">Both fields require nonempty single-line text.
                  Maximum {{ labelLimit }} characters for the label and {{ valueLimit }} for the value.</p>
              }
            </div>
          }
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="add()"
            [disabled]="fields.length >= maxFields">Add field</button>
          <small class="ms-2">{{ fields.length }} / {{ maxFields }}</small>
          @if (fields.hasError('tooManyFields')) {
            <p class="text-danger" role="alert">Remove fields to keep at most {{ maxFields }}.</p>
          }
        </div>
      }
    </fieldset>
  `,
  styles: [`
    textarea { resize: none; white-space: pre; }
    .copyable-fields-toggle { display: inline-flex; align-items: center; gap: .5rem; border: 0;
      padding: 0 .25rem; background: var(--bs-body-bg); color: inherit; font: inherit; }
    .copyable-fields-toggle .fa-info-circle { font-size: .85em; }
  `],
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
