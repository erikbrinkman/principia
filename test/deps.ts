import {
  assert,
  assertStrictEquals,
  assertThrows,
} from "https://deno.land/std@0.84.0/testing/asserts.ts";
export { assert, assertStrictEquals, assertThrows };

export function assertAlmostEquals(
  actual: number,
  expected: number,
  message?: string,
): void {
  assert(Math.abs(actual - expected) < 1e-6, message);
}
