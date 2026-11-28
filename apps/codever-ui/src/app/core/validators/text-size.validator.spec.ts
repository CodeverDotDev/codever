import { FormControl } from '@angular/forms';
import { textSizeValidator } from './text-size.validator';

describe('textSizeValidator', () => {
  const validate = (value: string, maxCharacters: number, maxLines?: number) =>
    textSizeValidator(maxCharacters, maxLines)(new FormControl(value));

  it('accepts empty and short text', () => {
    expect(validate('', 5)).toBeNull();
    expect(validate('abc', 5)).toBeNull();
  });

  it('reports too many characters', () => {
    expect(validate('abcdef', 5)).toEqual({ tooManyCharacters: { value: 6 } });
  });

  it('does not limit lines when no line limit is given', () => {
    expect(validate('a\n'.repeat(1000), 100000)).toBeNull();
  });

  it('reports too many lines when a line limit is given', () => {
    expect(validate('a\nb\nc', 100, 2)).toEqual({ tooManyLines: { value: 3 } });
  });
});
