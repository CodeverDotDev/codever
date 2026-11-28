import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditShortcutService } from './edit-shortcut.service';

describe('EditShortcutService', () => {
  let service: EditShortcutService;
  let dialog: { openDialogs: unknown[] };

  const keydown = (
    init: KeyboardEventInit & { target?: EventTarget }
  ): KeyboardEvent => {
    const { target, ...eventInit } = init;
    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      ...eventInit,
    });
    if (target) {
      Object.defineProperty(event, 'target', { value: target });
    }
    return event;
  };

  const context = (canEdit = true) => ({
    canEdit: () => canEdit,
    edit: vi.fn<() => void>(),
  });

  beforeEach(() => {
    dialog = { openDialogs: [] };
    TestBed.configureTestingModule({
      providers: [
        EditShortcutService,
        { provide: MatDialog, useValue: dialog },
      ],
    });
    service = TestBed.inject(EditShortcutService);
  });

  it('runs the edit action of the registered context on e', () => {
    const page = context();
    service.register(page);
    const event = keydown({ key: 'e' });

    expect(service.handleKeydown(event)).toBe(true);
    expect(page.edit).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('accepts E (Caps Lock or Shift)', () => {
    const page = context();
    service.register(page);

    expect(service.handleKeydown(keydown({ key: 'E', shiftKey: true }))).toBe(
      true
    );
    expect(page.edit).toHaveBeenCalled();
  });

  it('does nothing without a context or when editing is not offered', () => {
    expect(service.handleKeydown(keydown({ key: 'e' }))).toBe(false);

    const page = context(false);
    service.register(page);
    expect(service.handleKeydown(keydown({ key: 'e' }))).toBe(false);
    expect(page.edit).not.toHaveBeenCalled();
  });

  it.each([
    ['Ctrl+E', { key: 'e', ctrlKey: true }],
    ['Cmd+E', { key: 'e', metaKey: true }],
    ['Alt+E', { key: 'e', altKey: true }],
    ['auto-repeat', { key: 'e', repeat: true }],
    ['another key', { key: 'k' }],
  ])('ignores %s', (_label, init: KeyboardEventInit) => {
    const page = context();
    service.register(page);

    expect(service.handleKeydown(keydown(init))).toBe(false);
    expect(page.edit).not.toHaveBeenCalled();
  });

  it.each(['input', 'textarea', 'select'])('ignores e typed in a %s', (tag) => {
    const page = context();
    service.register(page);

    const event = keydown({ key: 'e', target: document.createElement(tag) });

    expect(service.handleKeydown(event)).toBe(false);
    expect(page.edit).not.toHaveBeenCalled();
  });

  it('ignores e in a contenteditable element', () => {
    const page = context();
    service.register(page);
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });

    expect(service.handleKeydown(keydown({ key: 'e', target: editable }))).toBe(
      false
    );
    expect(page.edit).not.toHaveBeenCalled();
  });

  it('ignores e while a dialog is open', () => {
    const page = context();
    service.register(page);
    dialog.openDialogs = [{}];

    expect(service.handleKeydown(keydown({ key: 'e' }))).toBe(false);
    expect(page.edit).not.toHaveBeenCalled();
  });

  it('ignores an event already handled elsewhere', () => {
    const page = context();
    service.register(page);
    const event = keydown({ key: 'e' });
    event.preventDefault();

    expect(service.handleKeydown(event)).toBe(false);
    expect(page.edit).not.toHaveBeenCalled();
  });

  it('uses only the latest context and forgets unregistered ones', () => {
    const first = context();
    const second = context();
    service.register(first);
    service.register(second);

    service.handleKeydown(keydown({ key: 'e' }));
    expect(second.edit).toHaveBeenCalledTimes(1);
    expect(first.edit).not.toHaveBeenCalled();

    service.unregister(second);
    service.handleKeydown(keydown({ key: 'e' }));
    expect(first.edit).toHaveBeenCalledTimes(1);

    service.unregister(first);
    expect(service.handleKeydown(keydown({ key: 'e' }))).toBe(false);
  });
});
