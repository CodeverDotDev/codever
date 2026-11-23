import { describe, expect, it } from 'vitest';
import { SharedCopyHandoff } from './shared-copy-handoff.service';

describe('SharedCopyHandoff', () => {
  const note = { _id: 'n1', title: 'Shared note' };

  it('returns the content for the matching type and id', () => {
    const handoff = new SharedCopyHandoff();
    handoff.put('note', note);

    expect(handoff.take('note', 'n1')).toBe(note);
  });

  it('returns nothing for another type or id and keeps the content', () => {
    const handoff = new SharedCopyHandoff();
    handoff.put('note', note);

    expect(handoff.take('bookmark', 'n1')).toBeUndefined();
    expect(handoff.take('note', 'other')).toBeUndefined();
    expect(handoff.take('note', 'n1')).toBe(note);
  });

  it('returns the content only once', () => {
    const handoff = new SharedCopyHandoff();
    handoff.put('note', note);
    handoff.take('note', 'n1');

    expect(handoff.take('note', 'n1')).toBeUndefined();
  });
});
