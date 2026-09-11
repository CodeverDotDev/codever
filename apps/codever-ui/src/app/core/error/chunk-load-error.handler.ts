import { ErrorHandler, Injectable } from '@angular/core';

/**
 * Global error handler that gracefully recovers from `ChunkLoadError`s.
 *
 * A `ChunkLoadError` happens when the browser is still running an older version
 * of the app (old `main.js`) that references lazy-loaded chunks by their old
 * content-hash file names (e.g. `619.4687c46d101bc7d3.js`). After a new
 * deployment those chunk files no longer exist on the server, so navigating to a
 * lazy-loaded route (notes, search, ...) fails to fetch the chunk and the
 * navigation appears to "stall".
 *
 * When we detect such an error we force a single full page reload so the browser
 * fetches the fresh `index.html` together with the up-to-date chunk file names.
 * A `sessionStorage` guard prevents an infinite reload loop in the unlikely case
 * the chunk is genuinely missing after the reload.
 */
@Injectable()
export class ChunkLoadErrorHandler implements ErrorHandler {
  private static readonly RELOAD_GUARD_KEY = 'codever-chunk-reload';

  handleError(error: unknown): void {
    if (ChunkLoadErrorHandler.isChunkLoadError(error)) {
      const alreadyReloaded =
        sessionStorage.getItem(ChunkLoadErrorHandler.RELOAD_GUARD_KEY) ===
        'true';

      if (!alreadyReloaded) {
        sessionStorage.setItem(ChunkLoadErrorHandler.RELOAD_GUARD_KEY, 'true');
        // Reload from the server (not the bfcache) to pick up the new build.
        window.location.reload();
        return;
      }
    } else {
      // A non-chunk error means the app is healthy again; clear the guard so a
      // future chunk error can trigger a reload.
      sessionStorage.removeItem(ChunkLoadErrorHandler.RELOAD_GUARD_KEY);
    }

    // Fall back to the default behaviour for every other error.
    console.error(error);
  }

  private static isChunkLoadError(error: unknown): boolean {
    const message =
      error instanceof Error
        ? `${error.name} ${error.message}`
        : String((error as { message?: string })?.message ?? error ?? '');

    return (
      /ChunkLoadError/i.test(message) ||
      /Loading chunk [\w-]+ failed/i.test(message) ||
      /Loading CSS chunk [\w-]+ failed/i.test(message)
    );
  }
}

