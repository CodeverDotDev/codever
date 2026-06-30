import { flipTaskMarker, resetTaskMarkers } from './note-content.component';


describe('flipTaskMarker', () => {
  const list = ['- [ ] todo a', '- [ ] todo b', '- [x] todo c'].join('\n');

  it('checks an unchecked item by index', () => {
    const result = flipTaskMarker(list, 0);
    expect(result.split('\n')[0]).toBe('- [x] todo a');
    // other items untouched
    expect(result.split('\n')[1]).toBe('- [ ] todo b');
    expect(result.split('\n')[2]).toBe('- [x] todo c');
  });

  it('unchecks a checked item by index', () => {
    const result = flipTaskMarker(list, 2);
    expect(result.split('\n')[2]).toBe('- [ ] todo c');
  });

  it('preserves links and inline markdown inside the item', () => {
    const withLink = '- [ ] Visit the [docs](https://www.codever.dev)';
    expect(flipTaskMarker(withLink, 0)).toBe(
      '- [x] Visit the [docs](https://www.codever.dev)'
    );
  });

  it('supports *, + and ordered list markers', () => {
    expect(flipTaskMarker('* [ ] a', 0)).toBe('* [x] a');
    expect(flipTaskMarker('+ [ ] a', 0)).toBe('+ [x] a');
    expect(flipTaskMarker('1. [ ] a', 0)).toBe('1. [x] a');
  });

  it('handles indented (nested) task items and keeps indentation', () => {
    const nested = ['- [ ] parent', '  - [ ] child'].join('\n');
    const result = flipTaskMarker(nested, 1);
    expect(result.split('\n')[1]).toBe('  - [x] child');
  });

  it('returns the original content when index is out of range', () => {
    expect(flipTaskMarker(list, 99)).toBe(list);
  });

  it('ignores plain (non-task) list items', () => {
    const plain = ['- a', '- b', '- [ ] todo'].join('\n');
    const result = flipTaskMarker(plain, 0);
    // index 0 is the first *task* item, i.e. the third line
    expect(result.split('\n')[2]).toBe('- [x] todo');
    expect(result.split('\n')[0]).toBe('- a');
  });

  it('returns empty/undefined content unchanged', () => {
    expect(flipTaskMarker('', 0)).toBe('');
    expect(flipTaskMarker(undefined as unknown as string, 0)).toBeUndefined();
  });
});

describe('resetTaskMarkers', () => {
  it('unchecks every item in the given range', () => {
    const list = ['- [x] a', '- [x] b', '- [ ] c'].join('\n');
    const result = resetTaskMarkers(list, 0, 3);
    expect(result).toBe(['- [ ] a', '- [ ] b', '- [ ] c'].join('\n'));
  });

  it('only resets items within [start, end) and leaves others untouched', () => {
    // Two checklists concatenated; reset button for the 2nd covers indices 2..4
    const content = [
      '- [x] list1 a',
      '- [x] list1 b',
      '- [x] list2 a',
      '- [x] list2 b',
    ].join('\n');
    const result = resetTaskMarkers(content, 2, 4);
    expect(result.split('\n')).toEqual([
      '- [x] list1 a',
      '- [x] list1 b',
      '- [ ] list2 a',
      '- [ ] list2 b',
    ]);
  });

  it('preserves links and inline markdown while unchecking', () => {
    const withLink = '- [x] Visit the [docs](https://www.codever.dev)';
    expect(resetTaskMarkers(withLink, 0, 1)).toBe(
      '- [ ] Visit the [docs](https://www.codever.dev)'
    );
  });

  it('leaves already-unchecked items unchanged and returns identical content', () => {
    const list = ['- [ ] a', '- [ ] b'].join('\n');
    expect(resetTaskMarkers(list, 0, 2)).toBe(list);
  });

  it('ignores plain (non-task) list items when counting indices', () => {
    const content = ['- plain', '- [x] task a', '- [x] task b'].join('\n');
    const result = resetTaskMarkers(content, 0, 2);
    expect(result.split('\n')).toEqual([
      '- plain',
      '- [ ] task a',
      '- [ ] task b',
    ]);
  });

  it('resets a top-level checklist together with its nested sub-items', () => {
    // One top-level checklist whose range (0..4) spans the nested sub-list too.
    const content = [
      '- [x] parent 1',
      '  - [x] child 1',
      '  - [x] child 2',
      '- [x] parent 2',
    ].join('\n');
    const result = resetTaskMarkers(content, 0, 4);
    expect(result.split('\n')).toEqual([
      '- [ ] parent 1',
      '  - [ ] child 1',
      '  - [ ] child 2',
      '- [ ] parent 2',
    ]);
  });

  it('resets only the targeted top-level checklist, not a sibling one', () => {
    // Two separate top-level checklists; the 2nd list's button covers 3..5.
    const content = [
      '- [x] list1 parent',
      '  - [x] list1 child',
      '- [x] list1 parent 2',
      '- [x] list2 parent',
      '  - [x] list2 child',
    ].join('\n');
    const result = resetTaskMarkers(content, 3, 5);
    expect(result.split('\n')).toEqual([
      '- [x] list1 parent',
      '  - [x] list1 child',
      '- [x] list1 parent 2',
      '- [ ] list2 parent',
      '  - [ ] list2 child',
    ]);
  });

  it('returns empty/undefined content unchanged', () => {
    expect(resetTaskMarkers('', 0, 1)).toBe('');
    expect(
      resetTaskMarkers(undefined as unknown as string, 0, 1)
    ).toBeUndefined();
  });
});

