import { FormArray, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { CopyableField } from '../../core/model/copyable-field';

export const MAX_COPYABLE_FIELDS = 10;
export const MAX_LABEL_LENGTH = 100;
export const MAX_VALUE_LENGTH = 1000;

export function copyableTextValidator(limit: number): ValidatorFn {
  return control => {
    const value = control.value;
    return typeof value !== 'string' || !value.trim() ||
      /[\r\n\u2028\u2029]/.test(value) || value.trim().length > limit
      ? { copyableText: true } : null;
  };
}

export function copyableFieldGroup(field: CopyableField = { label: '', value: '' }) {
  return new FormGroup({
    label: new FormControl(field.label, { nonNullable: true, validators: copyableTextValidator(MAX_LABEL_LENGTH) }),
    value: new FormControl(field.value, { nonNullable: true, validators: copyableTextValidator(MAX_VALUE_LENGTH) }),
  });
}

export function copyableFieldsForm(fields: CopyableField[] = []) {
  return new FormArray(fields.map(field => copyableFieldGroup(field)), control =>
    control.value.length > MAX_COPYABLE_FIELDS ? { tooManyFields: true } : null);
}

export function copyableFieldsValue(fields: FormArray): CopyableField[] {
  return fields.getRawValue().map((field: CopyableField) => ({
    label: field.label.trim(), value: field.value.trim(),
  }));
}
