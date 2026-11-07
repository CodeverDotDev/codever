import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { confirmCancel } from './confirm-cancel';
import { AuthoringProtection } from './authoring-protection';
import { DiscardDraftDialogComponent } from '../../shared/dialog/discard-draft-dialog/discard-draft-dialog.component';

describe('confirmCancel', () => {
  let protection: {
    needsDiscardConfirmation: ReturnType<typeof vi.fn>;
    discard: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let result: unknown;

  const run = () => {
    let leave: boolean | undefined;
    confirmCancel(
      protection as unknown as AuthoringProtection,
      dialog as unknown as MatDialog,
      'note'
    ).subscribe((value) => (leave = value));
    return leave;
  };

  beforeEach(() => {
    result = undefined;
    protection = {
      needsDiscardConfirmation: vi.fn(() => true),
      discard: vi.fn(),
    };
    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(result) })),
    };
  });

  afterEach(() => vi.restoreAllMocks());

  it('leaves without a dialog when no confirmation is needed', () => {
    protection.needsDiscardConfirmation.mockReturnValue(false);
    expect(run()).toBe(true);
    expect(dialog.open).not.toHaveBeenCalled();
    expect(protection.discard).not.toHaveBeenCalled();
  });

  it('leaves without a dialog when the editor has no protection', () => {
    let leave: boolean | undefined;
    confirmCancel(undefined, dialog as unknown as MatDialog, 'note').subscribe(
      (value) => (leave = value)
    );
    expect(leave).toBe(true);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('discards and leaves when the user confirms', () => {
    result = 'discard';
    expect(run()).toBe(true);
    expect(dialog.open).toHaveBeenCalledWith(
      DiscardDraftDialogComponent,
      expect.objectContaining({ data: { resourceName: 'note' } })
    );
    expect(protection.discard).toHaveBeenCalledTimes(1);
  });

  it.each(['keep', undefined])(
    'stays and keeps the draft on %s',
    (closedWith) => {
      result = closedWith;
      expect(run()).toBe(false);
      expect(protection.discard).not.toHaveBeenCalled();
    }
  );
});
