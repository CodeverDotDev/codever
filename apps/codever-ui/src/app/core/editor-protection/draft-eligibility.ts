import { ParamMap } from '@angular/router';

/**
 * `initiator` value set by the app's own "+" menu. It only records where the
 * create was started and supplies no content, so it keeps drafts enabled.
 */
export const IN_APP_INITIATOR = 'browser';

/**
 * Whether a create route starts blank, i.e. without prefill or capture
 * context from extensions or bookmarklets. Any listed parameter excludes the
 * create from drafts, except `initiator` carrying the in-app value.
 */
export function isBlankStartCreate(
  queryParams: ParamMap,
  prefillParams: readonly string[]
): boolean {
  return !queryParams.keys.some(
    (key) =>
      prefillParams.includes(key) &&
      !(key === 'initiator' && queryParams.get(key) === IN_APP_INITIATOR)
  );
}
