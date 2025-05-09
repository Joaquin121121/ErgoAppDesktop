export type RangeEntry = {
  range: number[]; // single value or [start,end]
  percentageDrop: number;
};

// Helper: expand single-value ranges to two-element inclusive arrays
function expand(entries: RangeEntry[]): RangeEntry[] {
  return entries.map((e) =>
    e.range.length === 1 ? { ...e, range: [e.range[0], e.range[0]] } : e
  );
}

// Helper: compress two-element ranges like [5,5] back to single-value form
function compress(entries: RangeEntry[]): RangeEntry[] {
  return entries.map((e) =>
    e.range[0] === e.range[1] ? { ...e, range: [e.range[0]] } : e
  );
}

// Modify/replace a range (used for inline editing)
export function replaceRange(
  entries: RangeEntry[],
  rangeStart: number,
  rangeEnd: number,
  percentageDrop: number
): RangeEntry[] {
  const expanded = expand(entries);
  let updated: RangeEntry[] = [];

  for (const entry of expanded) {
    const [a, b] = entry.range;
    if (b < rangeStart || a > rangeEnd) {
      updated.push(entry);
      continue;
    }
    if (a < rangeStart) {
      const leftEnd = rangeStart - 1;
      if (a <= leftEnd) {
        updated.push({ ...entry, range: [a, leftEnd] });
      }
    }
    if (b > rangeEnd) {
      const rightStart = rangeEnd + 1;
      if (rightStart <= b) {
        updated.push({ ...entry, range: [rightStart, b] });
      }
    }
  }

  updated.push({
    range: [rangeStart, rangeEnd],
    percentageDrop,
  });

  updated.sort((x, y) => x.range[0] - y.range[0]);
  return compress(updated);
}

// Insert a new non-overlapping range (splitting existing overlaps)
export function insertRange(
  entries: RangeEntry[],
  rangeStart: number,
  rangeEnd: number,
  percentageDrop: number
): RangeEntry[] {
  const expanded = expand(entries);
  let updated: RangeEntry[] = [];
  for (const entry of expanded) {
    const [a, b] = entry.range;
    if (b < rangeStart || a > rangeEnd) {
      updated.push(entry);
      continue;
    }
    if (a < rangeStart) {
      const leftEnd = rangeStart - 1;
      if (a <= leftEnd) updated.push({ ...entry, range: [a, leftEnd] });
    }
    if (b > rangeEnd) {
      const rightStart = rangeEnd + 1;
      if (rightStart <= b) updated.push({ ...entry, range: [rightStart, b] });
    }
  }
  updated.push({ range: [rangeStart, rangeEnd], percentageDrop });
  updated.sort((x, y) => x.range[0] - y.range[0]);
  return compress(updated);
}

// Delete range at target index and redistribute
export function deleteRange(
  entries: RangeEntry[],
  targetIndex: number
): RangeEntry[] {
  const expanded = expand(entries);
  if (targetIndex < 0 || targetIndex >= expanded.length) return entries;

  const [delStart, delEnd] = expanded[targetIndex].range;
  const len = delEnd - delStart + 1;
  expanded.splice(targetIndex, 1);

  const leftIdx = targetIndex - 1;
  const rightIdx = targetIndex;

  if (leftIdx >= 0 && rightIdx < expanded.length) {
    const leftGain = Math.floor(len / 2);
    const rightGain = len - leftGain;
    expanded[leftIdx].range[1] += leftGain;
    expanded[rightIdx].range[0] -= rightGain;
  } else if (leftIdx >= 0) {
    expanded[leftIdx].range[1] = delEnd;
  } else if (rightIdx < expanded.length) {
    expanded[rightIdx].range[0] = delStart;
  }

  return compress(expanded);
}

// Ensure percentageDrop decreases (or equal) as range increases
export function enforceMonotonic(entries: RangeEntry[]): RangeEntry[] {
  // Ensure percentageDrop is non-increasing as fatigue level increases, but
  // do NOT override the recently modified value (the most "extreme" one).

  const sorted = [...entries].sort((a, b) => a.range[0] - b.range[0]);

  let changed = false;

  // Traverse from most-fatigued (end) towards least-fatigued (start).
  // Propagate larger percentageDrop values to the left when necessary.
  let running = sorted[sorted.length - 1].percentageDrop;
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (sorted[i].percentageDrop < running) {
      sorted[i] = { ...sorted[i], percentageDrop: running };
      changed = true;
    } else {
      running = sorted[i].percentageDrop;
    }
  }

  if (!changed) return entries; // everything already consistent

  // Re-map to original order
  const result: RangeEntry[] = entries.map((orig) => {
    const match = sorted.find((s) => s.range[0] === orig.range[0]);
    return match ?? orig;
  });

  return result;
}

// Adjust neighbouring percentageDrops so that for every consecutive pair i (lower fatigue) and j=i+1 (higher fatigue):
// entries[j].percentageDrop <= entries[i].percentageDrop - 5.
// Starting from the anchor index that was just modified, propagate changes outward.
export function rebalanceAroundAnchor(
  entries: RangeEntry[],
  anchorIndex: number
): RangeEntry[] {
  const list = [...entries];
  // Left side: step downwards in -5 bumps until order satisfied
  for (let i = anchorIndex - 1; i >= 0; i--) {
    const nextVal = list[i + 1].percentageDrop;
    if (list[i].percentageDrop > nextVal) {
      const newVal = Math.max(nextVal - 5, 0);
      list[i] = { ...list[i], percentageDrop: newVal };
    } else {
      break;
    }
  }

  // Right side: step upwards in +5 bumps until order satisfied
  for (let i = anchorIndex + 1; i < list.length; i++) {
    const prevVal = list[i - 1].percentageDrop;
    if (list[i].percentageDrop < prevVal) {
      const newVal = Math.min(prevVal + 5, 100);
      list[i] = { ...list[i], percentageDrop: newVal };
    } else {
      break;
    }
  }

  return list;
}
