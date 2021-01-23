import {
  assertAlmostEquals,
  assertStrictEquals,
  assertThrows,
} from "./deps.ts";
import { mean, median } from "../utils.ts";

Deno.test("median", () => {
  assertThrows(() => median([]), Error);
  assertStrictEquals(median([1]), 1);
  assertAlmostEquals(median([0, 2]), 1);
  assertStrictEquals(median([1, 4, 2]), 2);
  assertAlmostEquals(median([0, 1, 5, 3]), 2);
});

Deno.test("mean", () => {
  assertThrows(() => mean([]), Error);
  assertAlmostEquals(mean([1]), 1);
  assertAlmostEquals(mean([0, 2]), 1);
  assertAlmostEquals(mean([1, 3, 2]), 2);
  assertAlmostEquals(mean([0, 1, 4, 3]), 2);
});
