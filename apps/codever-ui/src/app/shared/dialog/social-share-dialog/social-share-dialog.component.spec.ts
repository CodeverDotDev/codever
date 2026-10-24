import { DatePipe } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ShareLinksService } from '../../../core/share-links.service';
import { SocialShareDialogComponent } from './social-share-dialog.component';

describe('SocialShareDialogComponent sharing', () => {
  const makeComponent = (
    userOwnsBookmark: boolean,
    service: Partial<ShareLinksService>,
    dialog: any = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of('CONFIRM') }),
    }
  ) =>
    new SocialShareDialogComponent(
      new DatePipe('en-US'),
      { close: vi.fn() } as unknown as MatDialogRef<SocialShareDialogComponent>,
      service as ShareLinksService,
      dialog,
      {
        bookmark: {
          _id: 'bookmark-id',
          name: 'Bookmark',
          location: 'https://example.com',
          type: 'bookmark',
          tags: [],
        },
        userId: 'owner',
        userIsLoggedIn: true,
        userOwnsBookmark,
      }
    );

  it('checks status without creating a link when the owner opens the dialog', () => {
    const service = {
      getStatus: vi.fn().mockReturnValue(of({ active: false })),
      create: vi.fn(),
    };

    const component = makeComponent(true, service);

    expect(service.getStatus).toHaveBeenCalledWith(
      'owner',
      'bookmark',
      'bookmark-id'
    );
    expect(service.create).not.toHaveBeenCalled();
    expect(component.shareStatus).toBe('inactive');
  });

  it('does not call management endpoints for a non-owner', () => {
    const service = { getStatus: vi.fn(), create: vi.fn() };

    const component = makeComponent(false, service);

    expect(component.canManageSharing).toBe(false);
    expect(service.getStatus).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates only after explicit action and makes the reusable URL available', () => {
    const service = {
      getStatus: vi.fn().mockReturnValue(of({ active: false })),
      create: vi.fn().mockReturnValue(
        of({
          active: true,
          shareLinkId: 'link-id',
          resourceType: 'bookmark',
          resourceId: 'bookmark-id',
          createdAt: '2026-01-01',
          token: 'A'.repeat(43),
        })
      ),
    };
    const component = makeComponent(true, service);

    component.createShareLink();

    expect(service.create).toHaveBeenCalledWith(
      'owner',
      'bookmark',
      'bookmark-id'
    );
    expect(component.shareStatus).toBe('active');
    expect(component.shareUrl).toContain('/bookmarks/shared/');
  });

  it('shows a load error and allows the owner to retry status', () => {
    const service = {
      getStatus: vi
        .fn()
        .mockReturnValueOnce(throwError(() => new Error('offline')))
        .mockReturnValueOnce(of({ active: false })),
    };
    const component = makeComponent(true, service);

    expect(component.shareStatus).toBe('error');
    component.loadShareStatus();
    expect(component.shareStatus).toBe('inactive');
    expect(service.getStatus).toHaveBeenCalledTimes(2);
  });

  it('keeps a link active when stop-sharing confirmation is declined', () => {
    const service = {
      getStatus: vi.fn().mockReturnValue(of({ active: false })),
      revoke: vi.fn(),
    };
    const component = makeComponent(true, service);
    component.shareLink = {
      active: true,
      shareLinkId: 'link-id',
      resourceType: 'bookmark',
      resourceId: 'bookmark-id',
      createdAt: '2026-01-01',
      token: 'A'.repeat(43),
    };
    const dialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of('CANCEL') }),
    };
    const componentWithCancel = makeComponent(true, service, dialog);
    componentWithCancel.shareLink = {
      active: true,
      shareLinkId: 'link-id',
      resourceType: 'bookmark',
      resourceId: 'bookmark-id',
      createdAt: '2026-01-01',
      token: 'A'.repeat(43),
    };
    componentWithCancel.shareStatus = 'active';

    componentWithCancel.stopSharing();

    expect(dialog.open).toHaveBeenCalled();
    expect(service.revoke).not.toHaveBeenCalled();
    expect(componentWithCancel.shareStatus).toBe('active');
    expect(componentWithCancel.shareUrl).not.toBeNull();
  });

  it('reloads inactive status after a successful revocation', () => {
    const service = {
      getStatus: vi
        .fn()
        .mockReturnValueOnce(
          of({
            active: true,
            shareLinkId: 'link-id',
            resourceType: 'bookmark',
            resourceId: 'bookmark-id',
            createdAt: '2026-01-01',
            token: 'A'.repeat(43),
          })
        )
        .mockReturnValueOnce(of({ active: false })),
      revoke: vi.fn().mockReturnValue(of(undefined)),
    };
    const component = makeComponent(true, service);

    component.stopSharing();
    component.loadShareStatus();

    expect(service.revoke).toHaveBeenCalledWith('owner', 'link-id');
    expect(component.shareStatus).toBe('inactive');
    expect(component.shareUrl).toBeNull();
  });

  it('reports clipboard rejection without claiming the link was copied', async () => {
    const component = makeComponent(true, {
      getStatus: vi.fn().mockReturnValue(of({ active: false })),
    });
    component.shareLink = {
      active: true,
      shareLinkId: 'link-id',
      resourceType: 'bookmark',
      resourceId: 'bookmark-id',
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
    expect(component.copyLinkButtonShareableText).toBe('Copy');
  });
});
