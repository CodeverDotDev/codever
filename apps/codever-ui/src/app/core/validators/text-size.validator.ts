import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Limits the number of characters and, when `maxNumberOfLines` is given, the
 * number of lines of a text control.
 */
export function textSizeValidator(
  maxNumberOfCharacters: number,
  maxNumberOfLines?: number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const numberOfLines = control.value.split('\n').length;
    const numberOfCharacters = control.value.length;
    const validationResponse =
      maxNumberOfLines !== undefined && numberOfLines > maxNumberOfLines
        ? { tooManyLines: { value: numberOfLines } }
        : numberOfCharacters > maxNumberOfCharacters
        ? { tooManyCharacters: { value: numberOfCharacters } }
        : null;
    return validationResponse;
  };
}
