import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOME_TABS,
  resolveHomeTabs,
} from './home-tabs';

describe('resolveHomeTabs', () => {
  const invalidOrders: (readonly string[] | undefined)[] = [
    undefined,
    [],
    ['feed', 'history', 'pinned'],
    ['feed', 'history', 'pinned', 'pinned'],
    ['feed', 'history', 'pinned', 'unknown'],
  ];

  it('keeps a valid permutation', () => {
    const saved = ['pinned', 'feed', 'history', 'read-later'];

    expect(resolveHomeTabs(saved)).toEqual(saved);
  });

  invalidOrders.forEach((saved) => {
    it(`uses the default order for invalid saved data: ${saved}`, () => {
      expect(resolveHomeTabs(saved)).toEqual(DEFAULT_HOME_TABS);
    });
  });
});
