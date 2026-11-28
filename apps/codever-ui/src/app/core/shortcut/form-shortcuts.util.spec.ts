import { FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { describe, expect, it, vi } from 'vitest';
import {
  shouldLeaveFormOnEscape,
  submitFormOnShortcut,
} from './form-shortcuts.util';

describe('form shortcuts', () => {
  const keydown = (init: KeyboardEventInit = {}) =>
    new KeyboardEvent('keydown', { cancelable: true, ...init });

  describe('submitFormOnShortcut', () => {
    const form = () =>
      ({ onSubmit: vi.fn() } as unknown as FormGroupDirective & {
        onSubmit: ReturnType<typeof vi.fn>;
      });

    it('submits like the Save button when Save is enabled', () => {
      const directive = form();
      const event = keydown({ key: 'Enter', ctrlKey: true });

      expect(submitFormOnShortcut(event, directive, true)).toBe(true);
      expect(directive.onSubmit).toHaveBeenCalledWith(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('does not submit, nor insert a line break, when Save is disabled', () => {
      const directive = form();
      const event = keydown({ key: 'Enter', metaKey: true });

      expect(submitFormOnShortcut(event, directive, false)).toBe(false);
      expect(directive.onSubmit).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('shouldLeaveFormOnEscape', () => {
    const dialog = (open: number) =>
      ({ openDialogs: new Array(open) } as unknown as MatDialog);

    it('leaves on a plain Escape without open dialogs', () => {
      expect(
        shouldLeaveFormOnEscape(keydown({ key: 'Escape' }), dialog(0))
      ).toBe(true);
    });

    it('stays when a panel already handled Escape', () => {
      const event = keydown({ key: 'Escape' });
      event.preventDefault();

      expect(shouldLeaveFormOnEscape(event, dialog(0))).toBe(false);
    });

    it('stays while a dialog is open or on auto-repeat', () => {
      expect(
        shouldLeaveFormOnEscape(keydown({ key: 'Escape' }), dialog(1))
      ).toBe(false);
      expect(
        shouldLeaveFormOnEscape(
          keydown({ key: 'Escape', repeat: true }),
          dialog(0)
        )
      ).toBe(false);
    });
  });
});
