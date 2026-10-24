import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { ShareLinksService } from '../../../core/share-links.service';
import { ShareLinkListItem } from '../../../core/model/share-link';
import { SharedByMeComponent } from './shared-by-me.component';

describe('SharedByMeComponent', () => {
  let service: {
    list: ReturnType<typeof vi.fn>;
    getStatus: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let component: SharedByMeComponent;
  const item: ShareLinkListItem = {
    shareLinkId: 'link-id',
    resourceType: 'note',
    resourceId: 'note-id',
    title: 'Shared note',
    public: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    service = {
      list: vi.fn().mockReturnValue(
        of({ items: [item], page: 1, limit: 20, total: 1 })
      ),
      getStatus: vi.fn(),
      revoke: vi.fn(),
    };
    router = { navigate: vi.fn() };
    dialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of('CONFIRM') }),
    };
    component = new SharedByMeComponent(
      service as unknown as ShareLinksService,
      router as unknown as Router,
      dialog as any
    );
    component.userId = 'owner';
  });

  it('loads an active mixed-resource page without requesting credentials', () => {
    component.loadPage(1);

    expect(service.list).toHaveBeenCalledWith('owner', 1, 20);
    expect(component.items).toEqual([item]);
    expect(component.total).toBe(1);
  });

  it('does not recreate a link that became inactive before copying', () => {
    service.getStatus.mockReturnValue(of({ active: false }));

    component.copyLink(item);

    expect(service.getStatus).toHaveBeenCalledWith('owner', 'note', 'note-id');
    expect(component.actionError).toContain('no longer active');
    expect(component.pendingShareLinkId).toBeNull();
  });

  it('does not revoke when dialog is cancelled', () => {
    component.items = [item];
    dialog.open.mockReturnValueOnce({ afterClosed: () => of('CANCEL') });

    component.stopSharing(item);

    expect(dialog.open).toHaveBeenCalled();
    expect(service.revoke).not.toHaveBeenCalled();
  });

  it('keeps the row when revocation fails and reports the error', () => {
    component.items = [item];
    service.revoke.mockReturnValue(throwError(() => new Error('offline')));

    component.stopSharing(item);

    expect(dialog.open).toHaveBeenCalled();
    expect(component.items).toEqual([item]);
    expect(component.actionError).toBe('The sharing link could not be revoked.');
  });

  it('refreshes after successful revocation and opens the owner resource route', () => {
    service.revoke.mockReturnValue(of(undefined));

    component.stopSharing(item);
    component.openResource(item);

    expect(dialog.open).toHaveBeenCalled();
    expect(service.revoke).toHaveBeenCalledWith('owner', 'link-id');
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith([
      '/my-notes',
      'note-id',
      'details',
    ]);
  });

  it('backs up to the last valid page after the active list shrinks', () => {
    service.list
      .mockReturnValueOnce(of({ items: [], page: 2, limit: 20, total: 0 }))
      .mockReturnValueOnce(of({ items: [], page: 1, limit: 20, total: 0 }));

    component.loadPage(2);

    expect(service.list).toHaveBeenNthCalledWith(1, 'owner', 2, 20);
    expect(service.list).toHaveBeenNthCalledWith(2, 'owner', 1, 20);
    expect(component.page).toBe(1);
    expect(component.items).toEqual([]);
  });

  it('reports list failures and supports retry', () => {
    service.list
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(
        of({ items: [item], page: 1, limit: 20, total: 1 })
      );

    component.loadPage(1);
    expect(component.error).toBe('Your shared resources could not be loaded.');

    component.loadPage(1);

    expect(component.items).toEqual([item]);
    expect(component.error).toBe('');
  });

  it('fetches current credentials only when copying and reports clipboard failure', async () => {
    service.getStatus.mockReturnValue(
      of({
        active: true,
        shareLinkId: 'link-id',
        resourceType: 'note',
        resourceId: 'note-id',
        createdAt: '2026-01-01T00:00:00.000Z',
        token: 'A'.repeat(43),
      })
    );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    component.copyLink(item);
    await Promise.resolve();

    expect(service.getStatus).toHaveBeenCalledWith('owner', 'note', 'note-id');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${environment.HOST}/notes/shared/${'A'.repeat(43)}`
    );
    expect(component.actionError).toBe('The link could not be copied.');
    expect(component.copiedShareLinkId).toBeNull();
  });

  it('renders the current title, type, and public badge in each row', () => {
    TestBed.configureTestingModule({
      imports: [SharedByMeComponent],
      providers: [
        provideRouter([]),
        {
          provide: ShareLinksService,
          useValue: {
            list: vi.fn().mockReturnValue(
              of({
                items: [{ ...item, public: true }],
                page: 1,
                limit: 20,
                total: 1,
              })
            ),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(SharedByMeComponent);
    fixture.componentRef.setInput('userId', 'owner');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Shared note');
    expect(fixture.nativeElement.textContent).toContain('Note');
    expect(
      fixture.nativeElement.querySelector('.badge')?.textContent
    ).toContain('Public');
  });
});
