import {} from "jest";
import * as check from "./check";
import * as backend from "../src/backend";
import * as curves from "../src/curves";
import * as rects from "../src/rects";


describe('#space1()', () => {
  it('stays constant with space', () => {
    const actual = backend.space1([[0, 1], [1, 2]]);
    const expected = [0, 1];
    check.equal(actual.length, expected.length);
    expected.forEach((e, i) => check.almostEqual(e, actual[i]));
  });

  it('stays constant with space and order', () => {
    const actual = backend.space1([[94.703125, 11], [-5.296875, 11], [44.703125, 11]]);
    const expected = [94.703125, -5.296875, 44.703125];
    check.equal(actual.length, expected.length);
    expected.forEach((e, i) => check.almostEqual(e, actual[i]));
  });

  it('moves evenly', () => {
    const actual = backend.space1([[0, 3], [1, 2]]);
    const expected = [-1, 2];
    check.equal(actual.length, expected.length);
    expected.forEach((e, i) => check.almostEqual(e, actual[i]));
  });

  it('keeps order', () => {
    const actual = backend.space1([[1, 2], [0, 3]]);
    const expected = [2, -1];
    check.equal(actual.length, expected.length);
    expected.forEach((e, i) => check.almostEqual(e, actual[i]));
  });

  it('handles empty case', () => {
    const actual = backend.space1([]);
    const expected = [];
    check.equal(actual.length, expected.length);
    expected.forEach((e, i) => check.almostEqual(e, actual[i]));
  });
});

describe('#space2()', () => {
  it('works with one line', () => {
    const bbox = [0, 0, 162, 100];
    const box = [20, 8];
    const line = [[0, 0], [162, 100]];
    const [pos] = backend.space2(bbox, [box], [line]);
    const rect = pos.concat(box);
    check(rects.contains.rect(bbox, rect, {tol: 0.1}),
           `${JSON.stringify(rect)} not inside rect ${JSON.stringify(bbox)}`);
    check(!rects.intersect.line(rect, line),
           `${JSON.stringify(rect)} intersects line ${JSON.stringify(line)}`);
    const lineDist = rects.dist.line(rect, line);
    check(lineDist < 2,
           `${JSON.stringify(rect)} is not close to line ${JSON.stringify(line)} (${lineDist})`);
  });

  it('works with one line with multiple segments', () => {
    const bbox = [0, 0, 162, 100];
    const box = [20, 8];
    const curve = [[0, 0], [50, 20], [100, 50], [162, 100]];
    const [pos] = backend.space2(bbox, [box], [curve]);
    const rect = pos.concat(box);
    check(rects.contains.rect(bbox, rect, {tol: 0.1}),
           `${JSON.stringify(rect)} not inside rect ${JSON.stringify(bbox)}`);
    check(!curves.intersect.rect(curve, rect),
           `${JSON.stringify(rect)} intersects line ${JSON.stringify(curve)}`);
    const lineDist = curves.dist.rect(curve, rect);
    check(lineDist < 2,
           `${JSON.stringify(rect)} is not close to line ${JSON.stringify(curve)} (${lineDist})`);
  });

  it('works with two lines', () => {
    const bbox = [0, 0, 162, 100];
    const boxes = [[20, 8], [30, 10]];
    const linez = [[[0, 0], [162, 100]], [[0, 50], [162, 50]]];
    const poses = backend.space2(bbox, boxes, linez);
    const rectz = poses.map((pos, i) => pos.concat(boxes[i]));
    check(rectz.every(rect => rects.contains.rect(bbox, rect, {tol: 0.1})),
           `${JSON.stringify(rectz)} not inside rect ${JSON.stringify(bbox)}`);
    check(rectz.every(rect => !linez.some(line => rects.intersect.line(rect, line))),
           `${JSON.stringify(rectz)} intersects lines ${JSON.stringify(linez)}`);
    const lineDists = rectz.map((rect, i) => rects.dist.line(rect, linez[i]));
    check(
      lineDists.every(dist => dist < 2),
      `${JSON.stringify(rectz)} are not close to lines ${JSON.stringify(linez)} (${JSON.stringify(lineDists)})`);
  });
});
