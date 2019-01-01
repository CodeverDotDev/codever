import { Directive } from '@angular/core';
import {
  AbstractControl, FormArray, FormGroup, NG_VALIDATORS, ValidationErrors, Validator,
  ValidatorFn
} from '@angular/forms';

/** At least one tag is required with a maximum of 8 */
export const tagsValidator: ValidatorFn = (control: FormArray): ValidationErrors | null => {
  const maxNumberOfTags = 8;
  const validationResponse = control.length === 0 ? {'tagsAreRequired': true} : control.length > maxNumberOfTags ? {'tooManyTags': true} : null;
  return validationResponse;
};

@Directive({
  selector: '[appTagsSizeValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: TagsValidatorDirective, multi: true }]
})
export class TagsValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {
    return tagsValidator(control);
  }
}
