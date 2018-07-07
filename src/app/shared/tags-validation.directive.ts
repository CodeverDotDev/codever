import { Directive } from '@angular/core';
import {
  AbstractControl, FormArray, FormGroup, NG_VALIDATORS, ValidationErrors, Validator,
  ValidatorFn
} from '@angular/forms';

/** A hero's name can't match the hero's alter ego */
export const tagsValidator: ValidatorFn = (control: FormArray): ValidationErrors | null => {
  const validationResponse = control.length === 0 ? {'tagsAreRequired': true} : control.length > 5 ? {'tooManyTags': true} : null;
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
