/**
 * Shared checks for single-key shortcuts (`k+k`, `e`) that must never
 * interfere with typing or with browser and OS shortcuts.
 */

/** Whether the key event goes to a control the user is typing in. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.isContentEditable;
}

/** Whether Ctrl, Cmd (Meta) or Alt is held; Shift is not counted. */
export function hasCommandModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}
