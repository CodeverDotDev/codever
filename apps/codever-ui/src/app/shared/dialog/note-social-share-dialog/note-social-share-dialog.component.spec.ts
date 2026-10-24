import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
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
