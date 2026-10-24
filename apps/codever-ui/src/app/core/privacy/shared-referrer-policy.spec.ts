import { describe, expect, it } from 'vitest';
import { updateSharedReferrerPolicy } from './shared-referrer-policy';

describe('updateSharedReferrerPolicy', () => {
  it('sets no-referrer for shared resources including query parameters', () => {
    const testDocument = globalThis.document.implementation.createHTMLDocument();

    updateSharedReferrerPolicy(
      '/notes/shared/token?from=mail',
      testDocument
    );

    expect(
      testDocument
        .querySelector('meta[name="referrer"]')
        ?.getAttribute('content')
    ).toBe('no-referrer');
  });

  it('covers legacy public-prefixed bookmark sharing URLs', () => {
    const testDocument = globalThis.document.implementation.createHTMLDocument();

    updateSharedReferrerPolicy(
      '/public/bookmarks/shared/legacy-token',
      testDocument
    );

    expect(testDocument.querySelector('meta[name="referrer"]')).not.toBeNull();
  });

  it('removes the shared-only policy after navigating away', () => {
    const testDocument = globalThis.document.implementation.createHTMLDocument();
    updateSharedReferrerPolicy('/bookmarks/shared/token', testDocument);

    updateSharedReferrerPolicy('/dashboard?tab=shared', testDocument);

    expect(testDocument.querySelector('meta[name="referrer"]')).toBeNull();
  });
});
