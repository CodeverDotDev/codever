import { TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShareLinksService } from '../../../core/share-links.service';
import { NoteSocialShareDialogComponent } from './note-social-share-dialog.component';

describe('NoteSocialShareDialogComponent sharing', () => {
  const note = {
    _id: 'note-id',
    type: 'note',
    title: 'Note',
    content: 'Content',
    tags: [],
    userId: 'owner',
    public: true,
  };

  const makeComponent = (
    data: { note: typeof note; userId: string },
    service: Partial<ShareLinksService>,
    dialog: any = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of('CONFIRM') }),
    }
  ) =>
    new NoteSocialShareDialogComponent(
      { close: vi.fn() } as unknown as MatDialogRef<NoteSocialShareDialogComponent>,
      service as ShareLinksService,
      dialog,
      data
    );

  it('keeps the public URL separate from the optional owner link', () => {
    const service = {
      getStatus: vi.fn().mockReturnValue(of({ active: false })),
      create: vi.fn(),
    };

    const component = makeComponent({ note, userId: 'owner' }, service);

    expect(component.ordinaryPublicUrl).toContain('/notes/note-id');
    expect(service.getStatus).toHaveBeenCalledWith('owner', 'note', 'note-id');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('does not request owner status when the viewer does not own the note', () => {
    const service = { getStatus: vi.fn() };
    const publicNote = { ...note, userId: 'another-owner' };

    const component = makeComponent(
      { note: publicNote, userId: 'viewer' },
      service
    );

    expect(component.userOwnsNote).toBe(false);
    expect(service.getStatus).not.toHaveBeenCalled();
  });

  it('reports status and revocation failures without losing the active link', () => {
    const service = {
      getStatus: vi.fn().mockReturnValue(throwError(() => new Error('offline'))),
      revoke: vi.fn().mockReturnValue(throwError(() => new Error('offline'))),
    };
    const component = makeComponent({ note, userId: 'owner' }, service);
    component.shareLink = {
      active: true,
      shareLinkId: 'link-id',
      resourceType: 'note',
      resourceId: 'note-id',
      createdAt: '2026-01-01',
      token: 'A'.repeat(43),
    };

    expect(component.shareStatus).toBe('error');
    component.shareStatus = 'active';
    component.stopSharing();

    expect(component.shareStatus).toBe('active');
    expect(component.shareLink).not.toBeNull();
    expect(component.shareError).toBe('The sharing link could not be revoked.');
  });

  it('reports a clipboard failure without marking the link copied', async () => {
    const component = makeComponent(
      { note, userId: 'owner' },
      { getStatus: vi.fn().mockReturnValue(of({ active: false })) }
    );
    component.shareLink = {
      active: true,
      shareLinkId: 'link-id',
      resourceType: 'note',
      resourceId: 'note-id',
      createdAt: '2026-01-01',
      token: 'A'.repeat(43),
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    component.copyShareLink();
    await Promise.resolve();

    expect(component.shareError).toBe('The link could not be copied.');
    expect(component.copyButtonText).toBe('Copy link');
  });
});

describe('NoteSocialShareDialogComponent copy with details', () => {
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

  const activeLink = {
    active: true as const,
    shareLinkId: 'link-id',
    resourceType: 'note' as const,
    resourceId: 'note-id',
    createdAt: '2026-01-01',
    token: 'A'.repeat(43),
  };
  const privateNote = {
    _id: 'note-id',
    type: 'note',
    title: 'Secret plan',
    content: 'Do not copy this content.',
    tags: ['ops'],
    userId: 'owner',
    public: false,
  };

  const mockClipboard = (writeText) =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

  const render = (note, status) => {
    TestBed.configureTestingModule({
      imports: [NoteSocialShareDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MatDialog, useValue: {} },
        {
          provide: ShareLinksService,
          useValue: { getStatus: vi.fn().mockReturnValue(of(status)) },
        },
        { provide: MAT_DIALOG_DATA, useValue: { note, userId: 'owner' } },
      ],
    });
    const fixture = TestBed.createComponent(NoteSocialShareDialogComponent);
    fixture.detectChanges();
    return fixture;
  };

  const detailsButtons = (fixture): HTMLButtonElement[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button')
    ).filter(
      (button: HTMLButtonElement) =>
        button.textContent.trim() === 'Copy with details'
    ) as HTMLButtonElement[];

  it('copies title, tags and the revocable link for a private note', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const fixture = render(privateNote, activeLink);
    const component = fixture.componentInstance;

    const buttons = detailsButtons(fixture);
    expect(buttons).toHaveLength(1);
    buttons[0].click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith(
      `Secret plan #ops\n${component.shareUrl}`
    );
    expect(component.shareUrl).toContain('/notes/shared/');
    expect(writeText.mock.calls[0][0]).not.toContain('Do not copy');
    expect(component.copyDetailsButtonText).toBe('Copied');
    vi.advanceTimersByTime(1300);
    expect(component.copyDetailsButtonText).toBe('Copy with details');
  });

  it('does not show the action for a private note without an active link', () => {
    const fixture = render(privateNote, { active: false });

    expect(detailsButtons(fixture)).toHaveLength(0);
  });

  it('shows the action once for a public note, not in its revocable row', () => {
    const fixture = render({ ...privateNote, public: true }, activeLink);

    const buttons = detailsButtons(fixture);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].closest('.input-group')).toBeNull();
  });

  it('shows an error when the copy fails', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const fixture = render(privateNote, activeLink);
    const component = fixture.componentInstance;

    component.copyShareLinkWithDetails();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.shareError).toBe('The details could not be copied.');
    expect(component.copyDetailsButtonText).toBe('Copy with details');
  });
});
