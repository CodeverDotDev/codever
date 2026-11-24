/**
 * Plain text for "Copy with details" in the Share dialogs:
 * the title followed by the tags as `#tag`, then the link on its own line.
 */
export function buildShareDetails(
  title: string,
  tags: string[] | null | undefined,
  link: string
): string {
  const hashTags = (tags ?? []).map((tag) => `#${tag}`);
  return `${[title, ...hashTags].join(' ')}\n${link}`;
}

/** Writes text to the clipboard; rejects when the clipboard is unavailable. */
export function copyTextToClipboard(text: string): Promise<void> {
  const clipboard = navigator.clipboard;
  if (!clipboard?.writeText) {
    return Promise.reject(new Error('Clipboard unavailable'));
  }
  try {
    return clipboard.writeText(text);
  } catch (error) {
    return Promise.reject(error);
  }
}
