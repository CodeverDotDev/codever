import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function textSizeValidator(
  maxNumberOfCharacters: number,
  maxNumberOfLines: number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const numberOfLines = control.value.split('\n').length;
    const numberOfCharacters = control.value.length;
    const validationResponse =
      numberOfLines > maxNumberOfLines
        ? { tooManyLines: { value: numberOfLines } }
        : numberOfCharacters > maxNumberOfCharacters
        ? { tooManyCharacters: { value: numberOfCharacters } }
        : null;
    return validationResponse;
  };
}
