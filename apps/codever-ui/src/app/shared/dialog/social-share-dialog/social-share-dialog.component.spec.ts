import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

describe('SocialShareDialogComponent copy with details', () => {
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

  const bookmark = {
    _id: 'bookmark-id',
    name: 'Probes',
    location: 'https://example.com/probes',
    type: 'bookmark',
    tags: ['kubernetes', 'devops'],
  };

  const mockClipboard = (writeText) =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

  const makeComponent = () =>
    new SocialShareDialogComponent(
      new DatePipe('en-US'),
      { close: vi.fn() } as unknown as MatDialogRef<SocialShareDialogComponent>,
      { getStatus: vi.fn() } as unknown as ShareLinksService,
      {} as MatDialog,
      { bookmark, userIsLoggedIn: false, userOwnsBookmark: false }
    );

  it('copies the title, tags and the bookmark URL and shows Copied', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const component = makeComponent();

    component.copyWithDetails();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith(
      'Probes #kubernetes #devops\nhttps://example.com/probes'
    );
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
    expect(component.copyDetailsButtonText).toBe('Copy with details');
  });

  it.each([
    [true, 'public', 'fa-globe'],
    [false, 'private', 'fa-eye-slash'],
  ])(
    'shows the visibility in the title (public: %s)',
    (isPublic, label, icon) => {
      TestBed.configureTestingModule({
        imports: [SocialShareDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: { close: vi.fn() } },
          { provide: MatDialog, useValue: {} },
          { provide: ShareLinksService, useValue: {} },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              bookmark: { ...bookmark, public: isPublic },
              userIsLoggedIn: false,
              userOwnsBookmark: false,
            },
          },
        ],
      });
      const fixture = TestBed.createComponent(SocialShareDialogComponent);
      fixture.detectChanges();
      const title: HTMLElement =
        fixture.nativeElement.querySelector('[mat-dialog-title]');

      expect(title.textContent).toContain(`Bookmark's main URL (${label})`);
      expect(title.querySelector(`i.${icon}`)).not.toBeNull();
    }
  );

  it('shows the action next to Link but not in the revocable-link row', async () => {
    TestBed.configureTestingModule({
      imports: [SocialShareDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MatDialog, useValue: {} },
        {
          provide: ShareLinksService,
          useValue: {
            getStatus: vi.fn().mockReturnValue(
              of({
                active: true,
                shareLinkId: 'link-id',
                resourceType: 'bookmark',
                resourceId: 'bookmark-id',
                createdAt: '2026-01-01',
                token: 'A'.repeat(43),
              })
            ),
          },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            bookmark: { ...bookmark, public: false },
            userId: 'owner',
            userIsLoggedIn: true,
            userOwnsBookmark: true,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(SocialShareDialogComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    const buttons = Array.from(element.querySelectorAll('button')).filter(
      (button) => button.textContent.trim() === 'Copy with details'
    );
    expect(buttons).toHaveLength(1);
    expect(buttons[0].closest('section')).toBeNull();
    expect(
      element.querySelector('input[aria-label="Revocable share link"]')
    ).not.toBeNull();
  });
});
