import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdminConfirmDialogComponent } from './admin-confirm-dialog.component';

const render = (items: string[]) => {
  const close = vi.fn();
  TestBed.configureTestingModule({
    imports: [AdminConfirmDialogComponent],
    providers: [
      { provide: MatDialogRef, useValue: { close } },
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          title: 'Delete 12 entries',
          message: 'Delete 12 public entries?',
          confirmLabel: 'Delete',
          items,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AdminConfirmDialogComponent);
  fixture.detectChanges();
  return { element: fixture.nativeElement as HTMLElement, close };
};

describe('AdminConfirmDialogComponent', () => {
  it('shows the action, the count and at most ten titles', () => {
    const items = Array.from({ length: 12 }, (_, i) => `Spam ${i}`);
    const { element } = render(items);

    expect(element.textContent).toContain('Delete 12 entries');
    expect(element.querySelectorAll('li')).toHaveLength(11);
    expect(element.textContent).toContain('... and 2 more');
  });

  it('closes with true on confirm and false on cancel', () => {
    const { element, close } = render([]);

    (element.querySelector('.confirm-button') as HTMLButtonElement).click();
    (element.querySelector('.cancel-button') as HTMLButtonElement).click();

    expect(close.mock.calls).toEqual([[true], [false]]);
  });
});
