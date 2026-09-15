import { Directive } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  FormGroup,
  NG_VALIDATORS,
  ValidationErrors,
  Validator,
  ValidatorFn,
} from '@angular/forms';

/** At least one tag is required with a maximum of 8 */
export const tagsValidator: ValidatorFn = (
  control: UntypedFormArray
): ValidationErrors | null => {
  const maxNumberOfTags = 8;
  const validationResponse: ValidationErrors = {};
  let invalid = false;
  if (control.length === 0) {
    validationResponse['tagsAreRequired'] = true;
    invalid = true;
  }

  if (control.length > maxNumberOfTags) {
    validationResponse['tooManyTags'] = true;
    invalid = true;
  }

  const values: string[] = control.getRawValue();
  let blockedTags = '';
  for (let i = 0; i < values.length; i++) {
    if (values[i].startsWith('awesome')) {
      blockedTags = blockedTags.concat(' ' + values[i]);
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
