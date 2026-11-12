import {
  constrainTabDragPosition,
  getOverlapDropIndex,
  getShiftOffsets,
  TabSlot,
} from './home-tab-sorting';

describe('home tab sorting', () => {
  describe('constrainTabDragPosition', () => {
    const pickup = { x: 20, y: 10 };

    it('follows the pointer within the vertical tolerance', () => {
      expect(constrainTabDragPosition({ x: 220, y: 115 }, 100, pickup)).toEqual({
        x: 200,
        y: 105,
      });
    });

    it('clamps vertical drift to the tolerance', () => {
      expect(constrainTabDragPosition({ x: 50, y: 300 }, 100, pickup)).toEqual({
        x: 30,
        y: 116,
      });
      expect(constrainTabDragPosition({ x: 50, y: 0 }, 100, pickup)).toEqual({
        x: 30,
        y: 84,
      });
    });
  });

  const slots: TabSlot[] = [
    { left: 0, right: 100 },
    { left: 110, right: 170 },
    { left: 180, right: 320 },
    { left: 330, right: 400 },
  ];

  describe('getOverlapDropIndex', () => {
    it('keeps the index until the leading edge passes a neighbour midpoint', () => {
      expect(getOverlapDropIndex(slots, 0, 30, 130)).toBe(0);
      expect(getOverlapDropIndex(slots, 0, 41, 141)).toBe(1);
    });

    it('moves past several neighbours when dragged far right', () => {
      expect(getOverlapDropIndex(slots, 0, 300, 400)).toBe(3);
    });

    it('moves left once the left edge passes a neighbour midpoint', () => {
      expect(getOverlapDropIndex(slots, 3, 240, 310)).toBe(2);
      expect(getOverlapDropIndex(slots, 3, 120, 190)).toBe(1);
      expect(getOverlapDropIndex(slots, 3, -5, 65)).toBe(0);
    });
  });

  describe('getShiftOffsets', () => {
    it('returns no offsets when the index is unchanged', () => {
      expect(getShiftOffsets(slots, 1, 1)).toEqual([0, 0, 0, 0]);
    });

    it('shifts neighbours left and the moved slot right when moving right', () => {
      expect(getShiftOffsets(slots, 0, 2)).toEqual([220, -110, -110, 0]);
    });

    it('shifts neighbours right and the moved slot left when moving left', () => {
      expect(getShiftOffsets(slots, 3, 0)).toEqual([80, 80, 80, -330]);
    });
  });
});
