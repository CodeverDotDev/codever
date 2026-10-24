export function updateSharedReferrerPolicy(
  url: string,
  targetDocument: Document
): void {
  const path = url.split(/[?#]/, 1)[0];
  const isSharedResourcePath =
    /^\/(?:public\/)?(?:bookmarks|notes|snippets)\/shared\/[^/]+(?:\/|$)/.test(
      path
    );
  const existingMeta = targetDocument.getElementById(
    'shared-resource-referrer-policy'
  );

  if (isSharedResourcePath) {
    const meta = existingMeta || targetDocument.createElement('meta');
    meta.id = 'shared-resource-referrer-policy';
    meta.setAttribute('name', 'referrer');
    meta.setAttribute('content', 'no-referrer');
    if (!existingMeta) {
      targetDocument.head.appendChild(meta);
    }
  } else {
    existingMeta?.remove();
  }
}
