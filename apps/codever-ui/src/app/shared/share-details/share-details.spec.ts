import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildShareDetails, copyTextToClipboard } from './share-details';

describe('buildShareDetails', () => {
  it('puts the title and hash tags on the first line and the link on the second', () => {
    expect(
      buildShareDetails(
        'Probes',
        ['kubernetes', 'devops'],
        'https://www.codever.dev/notes/1'
      )
    ).toBe('Probes #kubernetes #devops\nhttps://www.codever.dev/notes/1');
  });

  it('uses the title alone when there are no tags', () => {
    expect(buildShareDetails('Bookmark', [], 'https://example.com')).toBe(
      'Bookmark\nhttps://example.com'
    );
    expect(
      buildShareDetails('Bookmark', undefined, 'https://example.com')
    ).toBe('Bookmark\nhttps://example.com');
  });

  it('always returns exactly two lines', () => {
    expect(
      buildShareDetails('T', ['a', 'b', 'c'], 'https://x.y').split('\n')
    ).toHaveLength(2);
  });
});

describe('copyTextToClipboard', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  afterEach(() => {
    if (original) {
      Object.defineProperty(navigator, 'clipboard', original);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await copyTextToClipboard('text');

    expect(writeText).toHaveBeenCalledWith('text');
  });

  it('rejects when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    await expect(copyTextToClipboard('text')).rejects.toThrow();
  });
});
