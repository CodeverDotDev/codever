import { Clipboard } from '@angular/cdk/clipboard';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Note } from '../../../../core/model/note';
import { NoteSocialShareDialogContentComponent } from './note-social-share-dialog-content.component';

describe('NoteSocialShareDialogContentComponent copy with details', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard'
  );

  afterEach(() => {
    vi.useRealTimers();
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  const note: Note = {
    _id: 'note-id',
    type: 'note',
    title: 'Probes',
    content: 'Liveness restarts stuck containers.',
    tags: ['kubernetes', 'devops'],
    public: true,
  };
  const publicUrl = 'https://www.codever.dev/notes/note-id';

  const mockClipboard = (writeText) =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

  const makeComponent = () => {
    const component = new NoteSocialShareDialogContentComponent(
      {} as Clipboard
    );
    component.note = note;
    component.shareableUrl = publicUrl;
    component.ngOnChanges();
    return component;
  };

  it('copies the title, tags and public note URL without the content', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const component = makeComponent();

    component.copyWithDetails();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith(
      `Probes #kubernetes #devops\n${publicUrl}`
    );
    expect(writeText.mock.calls[0][0]).not.toContain('Liveness');
    expect(component.copyDetailsButtonText).toBe('Copied');
    vi.advanceTimersByTime(1300);
    expect(component.copyDetailsButtonText).toBe('Copy with details');
  });

  it('shows an error when the copy fails', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const component = makeComponent();

    component.copyWithDetails();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.copyDetailsError).toBe('The details could not be copied.');
  });

  it('renders the action after Copy link for a public note', () => {
    const fixture = TestBed.createComponent(
      NoteSocialShareDialogContentComponent
    );
    fixture.componentRef.setInput('note', { ...note, public: false });
    fixture.componentRef.setInput('shareableUrl', publicUrl);
    fixture.detectChanges();
    const labels = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('a, button')
      ).map((el) => el.textContent.trim());

    expect(labels()).not.toContain('Copy with details');

    fixture.componentRef.setInput('note', note);
    fixture.detectChanges();

    const current = labels();
    expect(current.indexOf('Copy with details')).toBe(
      current.indexOf('Copy link') + 1
    );
  });
});
