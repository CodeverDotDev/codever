import iziToast from 'izitoast';

/** Visible, content-free notice that stored drafts could not be removed. */
export function reportDraftCleanupFailure(): void {
  iziToast.warning({
    title: 'Drafts not removed',
    message:
      'Unsaved new-entry drafts could not be removed from this browser. ' +
      "Clear this site's data in the browser settings to discard them.",
    timeout: false,
  });
}
