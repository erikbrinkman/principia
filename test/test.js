const assert = require('assert');
const points = require('../lib/points.js');
const lines = require('../lib/lines.js');
const rects = require('../lib/rects.js');
const curves = require('../lib/curves.js');
const polys = require('../lib/polys.js');
const utils = require('../lib/utils.js');
const backend = require('../lib/backend.js');

assert.almostEqual = (a, b, message, tol) => {
  assert(Math.abs(a - b) <= (tol || 1e-6), message || `${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
};

assert.unorderedEqual = (a, b, pred) => {
  pred = pred || ((a, b) => a === b);
  assert.equal(a.length, b.length);
  const found = new Array(a.length).fill(false);
  a.forEach(ai => {
    const ind = b.findIndex(bi => pred(ai, bi));
    if (ind >= 0) {
      found[ind] = true;
    }
  });
  assert(found.every(x => x), `${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
};

describe('points', () => {
  describe('#equal()', () => {
    it('should succeed if equal', () => {
      assert(points.equal([0, 0], [0, 0]));
      assert(points.equal([1, 0], [1, 0]));
      assert(points.equal([1, 1], [1, 1]));
    });

    it('should fail if not equal', () => {
      assert(!points.equal([0, 0], [0, 1]));
      assert(!points.equal([0, 1], [1, 1]));
    });
  });

  describe('#dist.point()', () => {
    it('works', () => {
      assert.almostEqual(points.dist.point([0, 0], [0, 0]), 0);
      assert.almostEqual(points.dist.point([0, 0], [1, 0]), 1);
      assert.almostEqual(points.dist.point([0, 0], [1, 1]), Math.sqrt(2));
      assert.almostEqual(points.dist.point([0, 0], [0, 1]), 1);
    });
  });
});

describe('lines', () => {
  describe('#dist.point()', () => {
    it('should return accurate distances for vertical lines', () => {
      const line = [[0, 0], [0, 3]];
      assert.almostEqual(lines.dist.point(line, [1, 0]), 1);
      assert.almostEqual(lines.dist.point(line, [1, 1.5]), 1);
      assert.almostEqual(lines.dist.point(line, [1, 3]), 1);
      assert.almostEqual(lines.dist.point(line, [3, 7]), 5);
      assert.almostEqual(lines.dist.point(line, [-3, -4]), 5);
      assert.almostEqual(lines.dist.point(line, [0, 1]), 0);
    });

    it('should return accurate distances for horizontal lines', () => {
      const line = [[0, 0], [3, 0]];
      assert.almostEqual(lines.dist.point(line, [0, 1]), 1);
      assert.almostEqual(lines.dist.point(line, [1.5, 1]), 1);
      assert.almostEqual(lines.dist.point(line, [3, 1]), 1);
      assert.almostEqual(lines.dist.point(line, [7, 3]), 5);
      assert.almostEqual(lines.dist.point(line, [-3, -4]), 5);
      assert.almostEqual(lines.dist.point(line, [1, 0]), 0);
    });

    it('should return accurate distances for oblique lines', () => {
      const line = [[1, 0], [0, 1]];
      assert.almostEqual(lines.dist.point(line, [0.5, 0.5]), 0);
      assert.almostEqual(lines.dist.point(line, [-1, 1]), 1);
      assert.almostEqual(lines.dist.point(line, [0, 0]), Math.sqrt(0.5));
    });
  });

  describe('#intersect.line()', () => {
    it('should work for normal cases (no co-linear triples)', () => {
      assert(lines.intersect.line([[0, 0], [1, 1]], [[1, 0], [0, 1]]));
      assert(lines.intersect.line([[1, 0], [1, 2]], [[0, 1], [2, 1]]));
      assert(lines.intersect.line([[1, 0], [1, 2]], [[0, 0], [2, 2]]));

      assert(!lines.intersect.line([[1, 0], [1, 2]], [[3, 2], [3, 3]]));
      assert(!lines.intersect.line([[1, 0], [1, 2]], [[2, 2], [3, 3]]));
    });

    it('should work for parallel cases', () => {
      assert(lines.intersect.line([[0, 0], [0, 2]], [[0, 1], [0, 3]]));
      assert(lines.intersect.line([[0, 0], [0, 2]], [[0, 1], [1, 1]]));
      assert(lines.intersect.line([[0, 0], [0, 2]], [[1, 1], [0, 1]]));
      assert(lines.intersect.line([[0, 1], [1, 1]], [[0, 0], [0, 2]]));
      assert(lines.intersect.line([[1, 1], [0, 1]], [[0, 0], [0, 2]]));

      assert(!lines.intersect.line([[0, 0], [0, 1]], [[0, 2], [0, 3]]));
      assert(!lines.intersect.line([[0, 0], [0, -2]], [[0, 1], [1, 1]]));
      assert(!lines.intersect.line([[0, 0], [0, -2]], [[1, 1], [0, 1]]));
      assert(!lines.intersect.line([[0, 1], [1, 1]], [[0, 0], [0, -2]]));
      assert(!lines.intersect.line([[1, 1], [0, 1]], [[0, 0], [0, -2]]));
    });
  });

  describe('#to.poly()', () => {
    it('works for cap default', () => {
      assert(polys.equal(
        lines.to.poly([[0, 0], [0, 1]]),
        [[-1, 0], [1, 0], [1, 1], [-1, 1]]));
      assert(polys.equal(
        lines.to.poly([[0, 0], [3, 4]], {width: 5}),
        [[-4, 3], [4, -3], [7, 1], [-1, 7]]));
    });

    it('works for cap butt', () => {
      assert(polys.equal(
        lines.to.poly([[0, 0], [0, 1]], {cap: 'butt'}),
        [[-1, 0], [1, 0], [1, 1], [-1, 1]]));
      assert(polys.equal(
        lines.to.poly([[0, 0], [3, 4]], {width: 5, cap: 'butt'}),
        [[-4, 3], [4, -3], [7, 1], [-1, 7]]));
    });

    it('works for cap square', () => {
      assert(polys.equal(
        lines.to.poly([[0, 0], [0, 1]], {cap: 'square'}),
        [[-1, -1], [1, -1], [1, 2], [-1, 2]]));
      assert(polys.equal(
        lines.to.poly([[0, 0], [3, 4]], {width: 5, cap: 'square'}),
        [[-7, -1], [1, -7], [10, 5], [2, 11]]));
    });

    it('works for cap angle', () => {
      assert(polys.equal(
        lines.to.poly([[0, 0], [0, 1]], {cap: 'angle'}),
        [[-1, 0], [0, -1], [1, 0], [1, 1], [0, 2], [-1, 1]]));
      assert(polys.equal(
        lines.to.poly([[0, 0], [3, 4]], {width: 5, cap: 'angle'}),
        [[-4, 3], [-3, -4], [4, -3], [7, 1], [6, 8], [-1, 7]]));
    });

    it('throws for unknown cap', () => {
      assert.throws(() => lines.to.poly([[0, 0], [0, 1]], {cap: 'foo'}));
    });
  });

  describe('#to.rect()', () => {
    it('works', () => {
      assert(rects.equal(
        lines.to.rect([[0, 0], [1, 1]]),
        [0, 0, 1, 1]));
      assert(rects.equal(
        lines.to.rect([[0, 0], [0, 1]]),
        [0, 0, 0, 1]));
      assert(rects.equal(
        lines.to.rect([[0, 0], [1, 0]]),
        [0, 0, 1, 0]));
      assert(rects.equal(
        lines.to.rect([[0, 0], [0, 0]]),
        [0, 0, 0, 0]));
    });
  });

  describe('#orientation()', () => {
    it('it returns 0 for co-linear points', () => {
      assert.equal(lines.orientation([[0, 0], [1, 1]], [2, 2]), 0);
      assert.equal(lines.orientation([[0, 0], [1, 1]], [2, 2.01], {tol: 0.1}), 0);
    });

    it('it returns 1 for right points', () => {
      assert.equal(lines.orientation([[0, 0], [1, 1]], [1, 0]), 1);
    });

    it('it returns -1 for left points', () => {
      assert.equal(lines.orientation([[0, 0], [1, 1]], [0, 1]), -1);
    });
  });

  describe('#equal()', () => {
    it('should succeed if equal', () => {
      assert(lines.equal([[0, 0], [1, 1]], [[0, 0], [1, 1]]));
      assert(lines.equal([[0, 0], [1, 1]], [[1, 1], [0, 0]]));
    });

    it('should fail if not equal', () => {
      assert(!lines.equal([[0, 0], [1, 1]], [[1, 0], [0, 1]]));
      assert(!lines.equal([[0, 0], [1, 1]], [[0, 1], [1, 0]]));
    });
  });
});

describe('rects', () => {
  describe('#dist.point()', () => {
    it('returns 0 inside', () => {
      assert.almostEqual(rects.dist.point([0, 0, 2, 2], [1, 1]), 0);
      assert.almostEqual(rects.dist.point([0, 0, 2, 2], [0, 1]), 0);
      assert.almostEqual(rects.dist.point([0, 0, 2, 2], [0, 0]), 0);
    });

    it('transfers across lines appropriately', () => {
      assert.almostEqual(rects.dist.point([0, 0, 2, 2], [2, 4]), 2);
      assert.almostEqual(rects.dist.point([0, 0, 2, 2], [3, 3]), Math.sqrt(2));
      assert.almostEqual(rects.dist.point([0, 0, 2, 2], [4, 2]), 2);
    });

    it('appropriately calculates distance from a side', () => {
      assert.almostEqual(rects.dist.point([0, 0, 2, 2], [4, 1]), 2);
    });
  });

  describe('#dist.line()', () => {
    it('returns 0 if inside', () => {
      assert.almostEqual(rects.dist.line([0, 0, 3, 3], [[1, 1], [2, 2]]), 0);
    });

    it('returns 0 if one endpoint inside', () => {
      assert.almostEqual(rects.dist.line([0, 0, 3, 3], [[2, 2], [4, 2]]), 0);
    });

    it('returns 0 if it crosses through', () => {
      assert.almostEqual(rects.dist.line([0, 0, 3, 3], [[1, 4], [4, 1]]), 0);
    });

    it('returns 0 if it touches a corner', () => {
      assert.almostEqual(rects.dist.line([0, 0, 3, 3], [[2, 4], [4, 2]]), 0);
    });

    it('returns 0 if it touches a side', () => {
      assert.almostEqual(rects.dist.line([0, 0, 3, 3], [[-1, 3], [4, 3]]), 0);
    });

    it('returns returns minimum dist to line', () => {
      assert.almostEqual(rects.dist.line([0, 0, 3, 3], [[3, 4], [4, 3]]), Math.sqrt(0.5));
    });

    it('returns returns minimum dist to size', () => {
      assert.almostEqual(rects.dist.line([0, 0, 3, 3], [[2, 4], [2, 5]]), 1);
    });
  });

  describe('#to.lines()', () => {
    it('works', () => {
      const expected = [[[0, 0], [3, 0]], [[3, 0], [3, 3]], [[3, 3], [0, 3]], [[0, 3], [0, 0]]];
      const actual = rects.to.lines([0, 0, 3, 3]);
      assert.unorderedEqual(expected, actual, lines.equal);
    });
  });

  describe('#to.poly()', () => {
    it('works', () => {
      assert(polys.equal(
        rects.to.poly([0, 0, 3, 3]),
        [[0, 0], [3, 0], [3, 3], [0, 3]]));
    });
  });

  describe('#to.points()', () => {
    it('works', () => {
      const expected = [[0, 0], [3, 0], [3, 3], [0, 3]];
      const actual = rects.to.points([0, 0, 3, 3]);
      assert.unorderedEqual(expected, actual, points.equal);
    });
  });

  describe('#contains.point()', () => {
    it('succeeds inside', () => {
      assert(rects.contains.point([0, 0, 3, 3], [1, 1]));
    });

    it('succeeds on side', () => {
      assert(rects.contains.point([0, 0, 3, 3], [0, 1]));
    });

    it('succeeds on corner', () => {
      assert(rects.contains.point([0, 0, 3, 3], [0, 0]));
    });

    it('fails next to side', () => {
      assert(!rects.contains.point([0, 0, 3, 3], [4, 1]));
    });

    it('fails next to corner', () => {
      assert(!rects.contains.point([0, 0, 3, 3], [4, 4]));
    });
  });

  describe('#contains.line()', () => {
    it('succeeds inside', () => {
      assert(rects.contains.line([0, 0, 3, 3], [[1, 1], [2, 2]]));
    });

    it('succeeds when one on side', () => {
      assert(rects.contains.line([0, 0, 3, 3], [[1, 1], [0, 1]]));
    });

    it('succeeds when one on corner', () => {
      assert(rects.contains.line([0, 0, 3, 3], [[1, 1], [0, 0]]));
    });

    it('fails when one next to side', () => {
      assert(!rects.contains.line([0, 0, 3, 3], [[1, 1], [4, 1]]));
    });

    it('fails when one next to corner', () => {
      assert(!rects.contains.line([0, 0, 3, 3], [[1, 1], [4, 4]]));
    });

    it('fails when both outside', () => {
      assert(!rects.contains.line([0, 0, 3, 3], [[4, 4], [4, 1]]));
    });
  });

  describe('#intersect.point()', () => {
    it('succeeds inside', () => {
      assert(rects.intersect.point([0, 0, 3, 3], [1, 1]));
    });

    it('succeeds on side', () => {
      assert(rects.intersect.point([0, 0, 3, 3], [0, 1]));
    });

    it('succeeds on corner', () => {
      assert(rects.intersect.point([0, 0, 3, 3], [0, 0]));
    });

    it('fails next to side', () => {
      assert(!rects.intersect.point([0, 0, 3, 3], [4, 1]));
    });

    it('fails next to corner', () => {
      assert(!rects.intersect.point([0, 0, 3, 3], [4, 4]));
    });
  });

  describe('#intersect.line()', () => {
    it('succeeds inside', () => {
      assert(rects.intersect.line([0, 0, 3, 3], [[1, 1], [2, 2]]));
    });

    it('succeeds when one on side', () => {
      assert(rects.intersect.line([0, 0, 3, 3], [[1, 1], [0, 1]]));
    });

    it('succeeds when one on corner', () => {
      assert(rects.intersect.line([0, 0, 3, 3], [[1, 1], [0, 0]]));
    });

    it('succeeds when one next to side', () => {
      assert(rects.intersect.line([0, 0, 3, 3], [[1, 1], [4, 1]]));
    });

    it('succeeds when one next to corner', () => {
      assert(rects.intersect.line([0, 0, 3, 3], [[1, 1], [4, 4]]));
    });

    it('succeeds when one on side and one outside', () => {
      assert(rects.intersect.line([0, 0, 3, 3], [[3, 1], [4, 4]]));
    });

    it('succeeds when one on corner and one outside', () => {
      assert(rects.intersect.line([0, 0, 3, 3], [[3, 3], [4, 4]]));
    });

    it('fails when both outside', () => {
      assert(!rects.intersect.line([0, 0, 3, 3], [[4, 4], [4, 1]]));
    });
  });

  describe('#equal()', () => {
    it('should succeed if equal', () => {
      assert(rects.equal([0, 0, 1, 1], [0, 0, 1, 1]));
    });

    it('should fail if not equal', () => {
      assert(!rects.equal([0, 0, 1, 1], [1, 0, 1, 1]));
      assert(!rects.equal([0, 0, 1, 1], [0, 1, 1, 1]));
      assert(!rects.equal([0, 0, 1, 1], [0, 0, 0, 1]));
      assert(!rects.equal([0, 0, 1, 1], [0, 0, 1, 0]));
    });
  });
});

describe('curves', () => {
  describe('#to.lines()', () => {
    it('works', () => {
      const actual = curves.to.lines([[0, 0], [3, 0], [4, 4]], {close: false});
      const expected = [[[0, 0], [3, 0]], [[3, 0], [4, 4]]];
      assert.unorderedEqual(actual, expected, lines.equal);
    });
  });

  describe('#dist.point()', () => {
    it('works', () => {
      const curve =[[0, 3], [0, 0], [3, 0]];
      assert.almostEqual(curves.dist.point(curve, [1, 2]), 1);
      assert.almostEqual(curves.dist.point(curve, [2, 1]), 1);
    });
  });
});

describe('polys', () => {
  describe('#area()', () => {
    it('computes rect area', () => {
      assert.almostEqual(polys.area(rects.to.poly([0, 0, 3, 4])), 12);
      assert.almostEqual(polys.area(rects.to.poly([0, 0, 3, 4]).reverse()), 12);
    });

    it('computes triangle area', () => {
      assert.almostEqual(polys.area([[0, 0], [3, 0], [4, 4]]), 6);
      assert.almostEqual(polys.area([[0, 0], [4, 4], [3, 0]]), 6);
    });
  });

  describe('#contains.point()', () => {
    it('works for rects', () => {
      assert(polys.contains.point(rects.to.poly([0, 0, 3, 3]), [1, 1]));
      assert(polys.contains.point(rects.to.poly([0, 0, 3, 3]).reverse(), [1, 1]));
      assert(polys.contains.point(rects.to.poly([0, 0, 3, 3]), [0, 0]));
      assert(polys.contains.point(rects.to.poly([0, 0, 3, 3]), [0, 1]));

      assert(!polys.contains.point(rects.to.poly([0, 0, 3, 3]), [4, 1]));
      assert(!polys.contains.point(rects.to.poly([0, 0, 3, 3]).reverse(), [4, 1]));
    });

    it('works for triangles', () => {
      assert(polys.contains.point([[0, 0], [4, 4], [3, 0]], [2, 1]));
      assert(polys.contains.point([[0, 0], [4, 4], [3, 0]], [1, 1]));
      assert(polys.contains.point([[0, 0], [4, 4], [3, 0]], [4, 4]));

      assert(!polys.contains.point([[0, 0], [4, 4], [3, 0]], [2, 3]));
      assert(!polys.contains.point([[0, 0], [4, 4], [3, 0]], [5, 1]));
    });
  });

  describe('#to.lines()', () => {
    it('works with default options', () => {
      const actual = polys.to.lines([[0, 0], [3, 0], [4, 4]]);
      const expected = [[[0, 0], [3, 0]], [[3, 0], [4, 4]], [[4, 4], [0, 0]]];
      assert.unorderedEqual(actual, expected, lines.equal);
    });
  });

  describe('#union()', () => {
    it('works for a simple case', () => {
      const polya = [[0, 0], [2, 0], [2, 2], [0, 2]];
      const polyb = [[1, 1], [3, 1], [3, 3], [1, 3]];
      const expected = [[[0, 0], [2, 0], [2, 1], [3, 1], [3, 3], [1, 3], [1, 2], [0, 2]]];
      assert.unorderedEqual(expected, polys.union(polya, polyb), polys.equal);
    });

    it('removes hole in center', () => {
      const polya = [[0, 0], [5, 0], [5, 3], [3, 3], [3, 1], [2, 1], [2, 3], [0, 3]];
      const polyb = [[1, 2], [4, 2], [4, 4], [1, 4]];
      const expected = [[[0, 0], [5, 0], [5, 3], [4, 3], [4, 4], [1, 4], [1, 3], [0, 3]]];
      assert.unorderedEqual(expected, polys.union(polya, polyb), polys.equal);
    });

    it('preserves disjoint polys', () => {
      const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const polyb = [[0, 2], [1, 2], [1, 3], [0, 3]];
      const expected = [polya, polyb];
      assert.unorderedEqual(expected, polys.union(polya, polyb), polys.equal);
    });
  });

  describe('#intersect()', () => {
    it('works for a simple case', () => {
      const polya = [[0, 0], [2, 0], [2, 2], [0, 2]];
      const polyb = [[1, 1], [3, 1], [3, 3], [1, 3]];
      const expected = [[[1, 1], [2, 1], [2, 2], [1, 2]]];
      assert.unorderedEqual(expected, polys.intersect(polya, polyb), polys.equal);
    });

    it('creates disjoint polys', () => {
      const polya = [[0, 0], [5, 0], [5, 3], [3, 3], [3, 1], [2, 1], [2, 3], [0, 3]];
      const polyb = [[1, 2], [4, 2], [4, 4], [1, 4]];
      const expected = [[[1, 2], [2, 2], [2, 3], [1, 3]], [[3, 2], [4, 2], [4, 3], [3, 3]]];
      assert.unorderedEqual(expected, polys.intersect(polya, polyb), polys.equal);
    });

    it('returns empty on no intersection', () => {
      const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const polyb = [[0, 2], [1, 2], [1, 3], [0, 3]];
      assert.unorderedEqual([], polys.intersect(polya, polyb), polys.equal);
    });
  });

  describe('#difference()', () => {
    it('works for a simple case', () => {
      const polya = [[0, 0], [2, 0], [2, 2], [0, 2]];
      const polyb = [[1, 1], [3, 1], [3, 3], [1, 3]];
      const expected = [[[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]]];
      assert.unorderedEqual(expected, polys.difference(polya, polyb), polys.equal);
    });

    it('works for the opposite simple case', () => {
      const polya = [[1, 1], [3, 1], [3, 3], [1, 3]];
      const polyb = [[0, 0], [2, 0], [2, 2], [0, 2]];
      const expected = [[[2, 2], [2, 1], [3, 1], [3, 3], [1, 3], [1, 2]]];
      assert.unorderedEqual(expected, polys.difference(polya, polyb), polys.equal);
    });

    it('splits polys', () => {
      const polya = [[0, 0], [3, 0], [3, 1], [0, 1]];
      const polyb = [[1, -1], [2, -1], [2, 2], [1, 2]];
      const expected = [[[0, 0], [1, 0], [1, 1], [0, 1]], [[2, 0], [3, 0], [3, 1], [2, 1]]];
      assert.unorderedEqual(expected, polys.difference(polya, polyb), polys.equal);
    });

    it('ignores empty differences', () => {
      const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const polyb = [[0, 2], [1, 2], [1, 3], [0, 3]];
      assert.unorderedEqual([polya], polys.difference(polya, polyb), polys.equal);
    });

    it('returns empty differences', () => {
      const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const polyb = [[-1, -1], [2, -1], [2, 2], [-1, 2]];
      assert.unorderedEqual([], polys.difference(polya, polyb), polys.equal);
    });
  });

  describe('#equal()', () => {
    it('succeeds if equal', () => {
      assert(polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 0], [2, 0], [1, 1]]));
      assert(polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 0], [1, 1], [2, 0]]));
    });

    it('fails if not equal', () => {
      assert(!polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 1], [2, 0], [1, 1]]));
      assert(!polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 0], [1, 1], [3, 0]]));
      assert(!polys.equal([[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 2], [1, 2], [1, 3], [0, 3]]));
    });
  });
});

describe('utils', () => {
  describe('#mean()', () => {
    it('returns the mean', () => {
      assert.almostEqual(utils.mean([1]), 1);
      assert.almostEqual(utils.mean([1, 2, 3]), 2);
    });

    it('returns 0 when empty', () => {
      assert.almostEqual(utils.mean([]), 0);
    });
  });

  describe('#sum()', () => {
    it('returns the mean', () => {
      assert.almostEqual(utils.sum([1]), 1);
      assert.almostEqual(utils.sum([1, 2, 3]), 6);
    });

    it('returns 0 when empty', () => {
      assert.almostEqual(utils.sum([]), 0);
    });
  });

  describe('#randomIntWeighted()', () => {
    it('always returns an int in range', () => {
      for (let i = 1; i < 5; ++i) {
        assert(new Array(100).fill(null).every(_ => {
          const rand = utils.randomIntWeighted(new Array(i).fill(null).map(_ => Math.random()));
          return new Array(100).fill(null).every(_ => {
            const ind = rand();
            return 0 <= ind && ind < i;
          });
        }));
      }
    });
  });
});

describe('backend', () => {
  describe('#space1()', () => {
    it('stays constant with space', () => {
      const actual = backend.space1([[0, 1], [1, 2]]);
      const expected = [0, 1];
      assert.equal(actual.length, expected.length);
      expected.forEach((e, i) => assert.almostEqual(e, actual[i]));
    });

    it('stays constant with space and order', () => {
      const actual = backend.space1([[94.703125, 11], [-5.296875, 11], [44.703125, 11]]);
      const expected = [94.703125, -5.296875, 44.703125];
      assert.equal(actual.length, expected.length);
      expected.forEach((e, i) => assert.almostEqual(e, actual[i]));
    });

    it('moves evenly', () => {
      const actual = backend.space1([[0, 3], [1, 2]]);
      const expected = [-1, 2];
      assert.equal(actual.length, expected.length);
      expected.forEach((e, i) => assert.almostEqual(e, actual[i]));
    });

    it('keeps order', () => {
      const actual = backend.space1([[1, 2], [0, 3]]);
      const expected = [2, -1];
      assert.equal(actual.length, expected.length);
      expected.forEach((e, i) => assert.almostEqual(e, actual[i]));
    });

    it('handles empty case', () => {
      const actual = backend.space1([]);
      const expected = [];
      assert.equal(actual.length, expected.length);
      expected.forEach((e, i) => assert.almostEqual(e, actual[i]));
    });
  });

  describe('#space2()', () => {
    it('works with one line', () => {
      const bbox = [0, 0, 162, 100];
      const box = [20, 8];
      const line = [[0, 0], [162, 100]];
      const [pos] = backend.space2(bbox, [box], [line]);
      const rect = pos.concat(box);
      assert(rects.contains.rect(bbox, rect, {tol: 0.1}),
             `${JSON.stringify(rect)} not inside rect ${JSON.stringify(bbox)}`);
      assert(!rects.intersect.line(rect, line),
             `${JSON.stringify(rect)} intersects line ${JSON.stringify(line)}`);
      const lineDist = rects.dist.line(rect, line);
      assert(lineDist < 2,
             `${JSON.stringify(rect)} is not close to line ${JSON.stringify(line)} (${lineDist})`);
    });

    it('works with one line with multiple segments', () => {
      const bbox = [0, 0, 162, 100];
      const box = [20, 8];
      const curve = [[0, 0], [50, 20], [100, 50], [162, 100]];
      const [pos] = backend.space2(bbox, [box], [curve]);
      const rect = pos.concat(box);
      assert(rects.contains.rect(bbox, rect, {tol: 0.1}),
             `${JSON.stringify(rect)} not inside rect ${JSON.stringify(bbox)}`);
      assert(!curves.intersect.rect(curve, rect),
             `${JSON.stringify(rect)} intersects line ${JSON.stringify(curve)}`);
      const lineDist = curves.dist.rect(curve, rect);
      assert(lineDist < 2,
             `${JSON.stringify(rect)} is not close to line ${JSON.stringify(curve)} (${lineDist})`);
    });

    it('works with two lines', () => {
      const bbox = [0, 0, 162, 100];
      const boxes = [[20, 8], [30, 10]];
      const linez = [[[0, 0], [162, 100]], [[0, 50], [162, 50]]];
      const poses = backend.space2(bbox, boxes, linez);
      const rectz = poses.map((pos, i) => pos.concat(boxes[i]));
      assert(rectz.every(rect => rects.contains.rect(bbox, rect, {tol: 0.1})),
             `${JSON.stringify(rectz)} not inside rect ${JSON.stringify(bbox)}`);
      assert(rectz.every(rect => !linez.some(line => rects.intersect.line(rect, line))),
             `${JSON.stringify(rectz)} intersects lines ${JSON.stringify(linez)}`);
      const lineDists = rectz.map((rect, i) => rects.dist.line(rect, linez[i]));
      assert(
        lineDists.every(dist => dist < 2),
        `${JSON.stringify(rectz)} are not close to lines ${JSON.stringify(linez)} (${JSON.stringify(lineDists)})`);
    }).timeout(10000);
  });
});
