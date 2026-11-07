import { DOCUMENT, inject, Injectable, OnDestroy } from '@angular/core';
import { DraftSnapshot } from '../model/entry-draft';
import { DraftRemoveResult, DraftService } from '../cache/draft.service';
import {
  AuthoringProtection,
  AuthoringProtectionConfig,
  AuthoringProtectionHost,
} from './authoring-protection';

/**
 * Tracks the protection state of active authoring editors, so route guards,
 * page lifecycle handlers and logout don't need references to editors.
 */
@Injectable({ providedIn: 'root' })
export class EditorProtectionRegistry
  implements AuthoringProtectionHost, OnDestroy
{
  private readonly draftService = inject(DraftService);
  private readonly document = inject(DOCUMENT);
  private readonly protections = new Set<AuthoringProtection>();
  private lastUserId: string | null = null;
  private beforeUnloadArmed = false;
  private lifecycleBound = false;

  private readonly onBeforeUnload = (event: BeforeUnloadEvent) => {
    // Drafts survive closing the browser, so store pending input first and
    // prompt only for changes that are still unprotected.
    this.flushAll();
    if (this.hasUnprotectedChanges()) {
      event.preventDefault();
      // Legacy browsers require a returnValue to show the native prompt.
      event.returnValue = '';
    }
  };

  private readonly onPageHide = () => this.flushAll();

  private readonly onVisibilityChange = () => {
    if (this.document.visibilityState === 'hidden') {
      this.flushAll();
    }
  };

  create<S extends DraftSnapshot>(
    config: AuthoringProtectionConfig<S>
  ): AuthoringProtection<S> {
    const protection = new AuthoringProtection<S>(
      config,
      this.draftService,
      this
    );
    this.protections.add(protection as AuthoringProtection);
    this.bindLifecycle();
    return protection;
  }

  unregister(protection: AuthoringProtection): void {
    this.protections.delete(protection);
    if (this.protections.size === 0) {
      this.unbindLifecycle();
    }
    this.updateArming();
  }

  /** Remembers the signed-in user as the logout cleanup fallback. */
  rememberUser(userId: string): void {
    this.lastUserId = userId;
  }

  flushAll(): void {
    this.protections.forEach((protection) => protection.flush());
  }

  hasUnprotectedChanges(): boolean {
    return [...this.protections].some((p) => p.hasUnprotectedChanges());
  }

  /** Whether the `beforeunload` listener is needed: an editor has changes. */
  isArmed(): boolean {
    return [...this.protections].some((p) => p.isArmed());
  }

  /** Stops all writers and disarms without touching stored drafts. */
  endAll(): void {
    this.protections.forEach((protection) => protection.end());
    this.updateArming();
  }

  /**
   * Logout: stop writers and disarm first, then remove the departing user's
   * drafts from this browser. Never throws, so logout is not blocked.
   */
  handleLogout(userId?: string | null): DraftRemoveResult {
    this.endAll();
    const result = this.draftService.removeUserDrafts(
      userId || this.lastUserId
    );
    this.lastUserId = null;
    return result;
  }

  updateArming(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    const armed = this.isArmed();
    if (armed && !this.beforeUnloadArmed) {
      view.addEventListener('beforeunload', this.onBeforeUnload);
    } else if (!armed && this.beforeUnloadArmed) {
      view.removeEventListener('beforeunload', this.onBeforeUnload);
    }
    this.beforeUnloadArmed = armed;
  }

  ngOnDestroy(): void {
    this.document.defaultView?.removeEventListener(
      'beforeunload',
      this.onBeforeUnload
    );
    this.beforeUnloadArmed = false;
    this.unbindLifecycle();
  }

  private bindLifecycle(): void {
    const view = this.document.defaultView;
    if (this.lifecycleBound || !view) {
      return;
    }
    view.addEventListener('pagehide', this.onPageHide);
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.lifecycleBound = true;
  }

  private unbindLifecycle(): void {
    const view = this.document.defaultView;
    if (!this.lifecycleBound || !view) {
      return;
    }
    view.removeEventListener('pagehide', this.onPageHide);
    this.document.removeEventListener(
      'visibilitychange',
      this.onVisibilityChange
    );
    this.lifecycleBound = false;
  }
}
