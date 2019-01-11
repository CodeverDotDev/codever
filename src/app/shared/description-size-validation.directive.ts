import {Directive} from '@angular/core';
import {FormControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

export const descriptionSizeValidator: ValidatorFn = (control: FormControl): ValidationErrors | null => {
  const maxNumberOfCharacters = 1500;
  const maxNumberOfLines = 100;
  const numberOfLines = control.value.split('\n').length;
  const numberOfCharacters = control.value.length;
  const validationResponse = numberOfLines > maxNumberOfLines ? {'tooManyLines': {value: numberOfLines}} : numberOfCharacters > maxNumberOfCharacters ? {'tooManyCharacters': {value: numberOfCharacters}} : null;

  return validationResponse;
};

@Directive({
  selector: '[appDescriptionSizeValidator]',
  providers: [{ provide: NG_VALIDATORS, useExisting: DescriptionSizeValidatorDirective, multi: true }]
})
export class DescriptionSizeValidatorDirective implements Validator {
  validate(control: FormControl): ValidationErrors {
    return descriptionSizeValidator(control);
  }
}
