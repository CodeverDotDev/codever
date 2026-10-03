import { Directive } from '@angular/core';
import { MAX_TAGS, normalizeTags } from '../tags/tag-policy';
import {
  AbstractControl,
  UntypedFormArray,
  FormGroup,
  NG_VALIDATORS,
  ValidationErrors,
  Validator,
  ValidatorFn,
} from '@angular/forms';

/** At least one tag is required, with a maximum of thirteen unique tags. */
export const tagsValidator: ValidatorFn = (
  control: UntypedFormArray
): ValidationErrors | null => {
  const values = control.getRawValue();
  if (
    !Array.isArray(values) ||
    values.some((tag) => typeof tag !== 'string' || !tag.trim())
  ) {
    return { invalidTags: true };
  }
  const normalized = normalizeTags(values);
  const validationResponse: ValidationErrors = {};
  let invalid = false;
  if (control.length === 0) {
    validationResponse['tagsAreRequired'] = true;
    invalid = true;
  }

  if (normalized.length > MAX_TAGS) {
    validationResponse['tooManyTags'] = true;
    invalid = true;
  }

  let blockedTags = '';
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i].startsWith('awesome')) {
      blockedTags = blockedTags.concat(' ' + normalized[i]);
      invalid = true;
      break;
    }
  }

  if (blockedTags) {
    validationResponse['blockedTags'] = { value: blockedTags };
    invalid = true;
  }

  if (invalid) {
    return validationResponse;
  } else {
    return null;
  }
};

@Directive({
  selector: '[appTagsSizeValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: TagsValidatorDirective,
      multi: true,
    },
  ],
})
export class TagsValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {
    return tagsValidator(control);
  }
}

/*export const blockedTags = [
  'awesome'
];*/
