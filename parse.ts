import { Config } from "./plot/mod.tsx";
import { isSorted, readTextFile, writeTextFile } from "./utils.ts";

function parseDelimitedValues(
  inp: string,
  delims: Iterable<string> = ",\t",
): Config {
  // http://www.unicode.org/reports/tr18/#Line_Boundaries
  const lines = inp.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
  // remove trailing "new line"
  if (lines.length && !lines[lines.length - 1]) lines.pop();
  // fail if too short
  if (!lines.length) throw new Error("too few lines for *sv");

  for (const delim of delims) {
    const delimited = lines.map((line) => line.split(delim));
    const allCols = new Set(delimited.map((line) => line.length));
    // same number of delims on each line
    if (allCols.size !== 1) continue;
    const cols = allCols.keys().next().value;
    const numbers = delimited.map((line) => line.map(Number));

    // comparison
    if (
      cols === 2 && numbers.some(([f]) => isNaN(f)) &&
      numbers.slice(1).every(([, s]) => !isNaN(s))
    ) {
      if (isNaN(numbers[0][1])) { // header
        // TODO use labels
        delimited.shift();
        numbers.shift();
      }
      const data = delimited.map(([name], i) => ({
        name,
        value: numbers[i][1],
      }));
      const minValue = Math.min(...data.map(({ value }) => value));
      const maxValue = Math.max(...data.map(({ value }) => value));

      if (0 <= minValue && minValue <= maxValue / 2) { // absolute
        const total = data.reduce((a, d) => a + d.value, 0);
        // FIXME determine precision
        const format = Math.abs(1 - total) < 1e-3 ? ".0%" : "";
        return {
          type: "absolute comparison",
          data,
          axis: { format },
        };
      } else { // relative
        return {
          type: "relative comparison",
          data,
        };
      }
      // evolution
    } else if (
      cols >= 2 && numbers.slice(1).every((row) => !row.some(isNaN)) &&
      isSorted(
        (numbers[0].some(isNaN) ? numbers.slice(1) : numbers).map(([f]) => f),
      )
    ) {
      let labels = [];
      if (numbers[0].some(isNaN)) { // header
        labels = delimited[0];
        delimited.shift();
        numbers.shift();
      }

      // correlation
    }
    // FIXME
    // distribution
    // FIXME
  }
  throw new Error("couldn't parse a valid delimited file");
}

export default function parse(inp: string, verbosity = 0): Config {
  try {
    const json = JSON.parse(inp);
    // FIXME handle json formats
    throw new Error("parse doesn't currently handle json formats");
  } catch (ex) {
    // noop try more types
  }
  try {
    return parseDelimitedValues(inp);
  } catch (ex) {
    // noop try more types
  }
  // FIXME handle other string formats
  throw new Error(
    "parse found no valid formats, try again with higher verbosity",
  );
}
