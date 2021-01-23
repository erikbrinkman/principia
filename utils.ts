/** returns if a string is in the union specified */
export function isStringUnion<T extends string>(
  values: Set<T>,
  val: string,
): val is T {
  return values.has(val as T);
}

/** compute mean of array */
export function mean(arr: number[]): number {
  if (arr.length) {
    return arr.reduce((a, v, i) => a + (v - a) / (i + 1), 0);
  } else {
    throw new Error("can't take mean of empty array");
  }
}

/** compute median of array */
export function median(arr: number[]): number {
  const ordered = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(ordered.length / 2);
  if (!ordered.length) {
    throw new Error("can't take median of empty array");
  } else if (ordered.length % 2 === 0) {
    return (ordered[mid - 1] + ordered[mid]) / 2;
  } else {
    return ordered[mid];
  }
}
