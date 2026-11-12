export interface TabSlot {
  left: number;
  right: number;
}

export const VERTICAL_DRAG_TOLERANCE_PX = 16;

/**
 * Top-left position of the drag preview: follows the pointer horizontally
 * and allows a small vertical drift around the tab's original row.
 */
export function constrainTabDragPosition(
  pointer: { x: number; y: number },
  initialTop: number,
  pickupInElement: { x: number; y: number },
  tolerance = VERTICAL_DRAG_TOLERANCE_PX
): { x: number; y: number } {
  const top = pointer.y - pickupInElement.y;
  return {
    x: pointer.x - pickupInElement.x,
    y: Math.min(Math.max(top, initialTop - tolerance), initialTop + tolerance),
  };
}

/**
 * Index the dragged tab should move to once its leading edge passes the
 * midpoint of a neighbour. Only horizontal positions are considered.
 */
export function getOverlapDropIndex(
  slots: readonly TabSlot[],
  fromIndex: number,
  draggedLeft: number,
  draggedRight: number
): number {
  const center = (slot: TabSlot) => (slot.left + slot.right) / 2;
  for (let j = slots.length - 1; j > fromIndex; j--) {
    if (draggedRight > center(slots[j])) {
      return j;
    }
  }
  for (let j = 0; j < fromIndex; j++) {
    if (draggedLeft < center(slots[j])) {
      return j;
    }
  }
  return fromIndex;
}

/**
 * Horizontal offsets that visually move each slot (by original index) to
 * its position after moving `fromIndex` to `toIndex`, preserving gaps.
 */
export function getShiftOffsets(
  slots: readonly TabSlot[],
  fromIndex: number,
  toIndex: number
): number[] {
  if (slots.length === 0) {
    return [];
  }
  const order = slots.map((_, index) => index);
  const [moved] = order.splice(fromIndex, 1);
  order.splice(toIndex, 0, moved);

  const offsets = new Array<number>(slots.length).fill(0);
  let left = slots[0].left;
  order.forEach((originalIndex, position) => {
    const slot = slots[originalIndex];
    offsets[originalIndex] = left - slot.left;
    const gap =
      position < slots.length - 1
        ? slots[position + 1].left - slots[position].right
        : 0;
    left += slot.right - slot.left + gap;
  });
  return offsets;
}
