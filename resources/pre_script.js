/** Get the untransformed bounding box of an svg element */
function bbox(elem) {
  const bb = elem.getBBox();
  const svg = elem.ownerSVGElement;
  const mat = svg.getScreenCTM().inverse().multiply(elem.getScreenCTM());

  // Create an array of all four points for the original bounding box
  const corners = [
    [bb.x, bb.y],
    [bb.x + bb.width, bb.y],
    [bb.x + bb.width, bb.y + bb.height],
    [bb.x, bb.y + bb.height],
  ].map(([x, y]) => {
    const pre = svg.createSVGPoint();
    pre.x = x;
    pre.y = y;
    const post = pre.matrixTransform(mat);
    return [post.x, post.y];
  });
  const xmin = Math.min(...corners.map(([x]) => x));
  const ymin = Math.min(...corners.map(([, y]) => y));
  return {
    x: xmin,
    y: ymin,
    width: Math.max(...corners.map(([x]) => x)) - xmin,
    height: Math.max(...corners.map(([, y]) => y)) - ymin,
  };
}

/** Indicate how to shift elements to space them apart
 *
 * Elements is a list of initial positions and widths, and spacing is how much
 * room to leave between them.
 */
function spaceApartCalc(elements, spacing, bounds = [undefined, undefined]) {
  // Sort so that constraints are convex
  const centers = elements.map(([x, w]) => x + (w / 2));
  const ord = centers.map((_, i) => i).sort((a, b) => centers[a] - centers[b]);
  const sorted = ord.map(i => elements[i]);

  // Construct base constraints and objective
  const Q = centers.map((_, i) => {
    const res = Array(centers.length).fill(0);
    res[i] = 1;
    return res;
  });
  const c = Array(centers.length).fill(0);
  const A = centers.slice(1).map((_, i) => {
    const res = Array(centers.length).fill(0);
    res[i] = 1;
    res[i + 1] = -1;
    return res;
  });
  const b = sorted.slice(0, -1).map(([x, w], i) => sorted[i + 1][0] - spacing - x - w);

  // Add constraints for bounds violations
  const [lower, upper] = bounds;
  if (lower !== undefined) {
    const row = Array(centers.length).fill(0);
    row[0] = -1;
    A.push(row);
    b.push(sorted[0][0] - lower);
  }
  if (upper !== undefined) {
    const row = Array(centers.length).fill(0);
    row[row.length - 1] = 1;
    A.push(row);
    b.push(upper - sorted[sorted.length - 1][0] - sorted[sorted.length - 1][1]);
  }

  // Solve and unsort
  const sol = solveQP(Q, c, A, b);
  const offsets = [];
  ord.forEach((i, j) => {
    offsets[i] = sol[j];
  });
  return offsets;
}

/** Await rendering */
async function render(time = 0) {
  await new Promise(resolve => setTimeout(resolve, time));
}

/** Space elements apart along the y axis */
async function spaceApartX(elements, spacing, bounds) {
  const elems = Array.from(elements);
  elems.forEach(({ style }) => {
    style.transform = 'none'; // eslint-disable-line no-param-reassign
  });
  await render();
  const offsets = spaceApartCalc(elems.map((elem) => {
    const box = bbox(elem);
    return [box.x, box.width];
  }), spacing, bounds);
  elems.forEach(({ style }, i) => {
    style.transform = `translateX(${offsets[i]}px)`; // eslint-disable-line no-param-reassign
  });
  await render();
}

/** Space elements apart along the y axis */
async function spaceApartY(elements, spacing, bounds) {
  const elems = Array.from(elements);
  elems.forEach(({ style }) => {
    style.transform = 'none'; // eslint-disable-line no-param-reassign
  });
  await render();
  const offsets = spaceApartCalc(elems.map((elem) => {
    const box = bbox(elem);
    return [box.y, box.height];
  }), spacing, bounds);
  elems.forEach(({ style }, i) => {
    style.transform = `translateY(${offsets[i]}px)`; // eslint-disable-line no-param-reassign
  });
  await render();
}

/** Align the y axis label so it matches the top y tick and is `spacing` above it */
async function alignYAxisLabel(spacing) { // eslint-disable-line no-unused-vars
  const label = document.querySelector('.princ--yaxis .princ--axis-label');
  label.style.transform = 'none';
  await render();
  const lbb = bbox(label);
  const tbb = Array.from(document.querySelectorAll('.princ--yaxis .princ--tick-label'))
    .map(bbox).reduce((a, b) => (a.y < b.y ? a : b));
  label.style.transform = `translate(${tbb.x - lbb.x}px, ${tbb.y - lbb.y - lbb.height - spacing}px)`;
  await render();
}

/** Align the x axis label so its centered and either inline with the ticks if
  * possible and `shift` otherwise spacing below the lowest tick */
async function alignXAxisLabel(spacing, shift) { // eslint-disable-line no-unused-vars
  const label = document.querySelector('.princ--xaxis .princ--axis-label');
  label.style.transform = 'none';
  await render();
  const lbb = bbox(label);
  const { x: tx, width: twidth } = bbox(document.querySelector('.princ--xaxis .princ--tick-line'));
  const center = tx + (twidth / 2);
  const tbbs = Array.from(document.querySelectorAll('.princ--xaxis .princ--tick-label'))
    .map(bbox);
  const newy = (shift && tbbs.every(({ x, width }) =>
    (x + width + spacing <= center - (lbb.width / 2)) ||
    (center + (lbb.width / 2) + spacing <= x))) ?
    tbbs.map(({ y }) => y).reduce((m, y, i) => m + ((y - m) / (i + 1))) :
    Math.max(...tbbs.map(({ y, height }) => y + height)) + spacing;
  label.style.transform = `translate(${center - lbb.x - (lbb.width / 2)}px, ${newy - lbb.y}px)`;
  await render();
}

/** Space apart y ticks */
async function spaceApartYAxisTickLabels(spacing) { // eslint-disable-line no-unused-vars
  const { y } = bbox(document.querySelector('.princ--xaxis .princ--tick-line'));
  await spaceApartY(document.querySelectorAll('.princ--yaxis .princ--tick-label'), spacing, [undefined, y]);
}

/** Space apart x ticks */
async function spaceApartXAxisTickLabels(spacing) { // eslint-disable-line no-unused-vars
  await spaceApartX(document.querySelectorAll('.princ--xaxis .princ--tick-label'), spacing);
}

/** Align comparisonz names to left of bars with gap `spacing` */
async function alignComparisonZNames(spacing) { // eslint-disable-line no-unused-vars
  const names = Array.from(document.querySelectorAll('.princ--name'));
  names.forEach(({ style }) => {
    style.transform = 'none'; // eslint-disable-line no-param-reassign
  });
  await render();
  const { x: xleft } = bbox(document.querySelector('.princ--xaxis .princ--tick-line'));
  const nbbs = names.map(bbox);
  const maxx = Math.max(...nbbs.map(({ x, width }) => x + width));
  names.forEach(({ style }) => {
    style.transform = `translateX(${xleft - spacing - maxx}px)`; // eslint-disable-line no-param-reassign
  });
  await render();
}

/** Align comparisonz number to right of bars with gap `spacing` */
async function alignComparisonZNums(spacing) { // eslint-disable-line no-unused-vars
  const nums = Array.from(document.querySelectorAll('.princ--num'));
  nums.forEach(({ style }) => {
    style.transform = 'none'; // eslint-disable-line no-param-reassign
  });
  await render();
  const { x, width } = bbox(document.querySelector('.princ--xaxis .princ--tick-line'));
  const nbbs = nums.map(bbox);
  const minx = Math.min(...nbbs.map(({ x: mx }) => mx));
  nums.forEach(({ style }) => {
    style.transform = `translateX(${(x + width + spacing) - minx}px)`; // eslint-disable-line no-param-reassign
  });
  await render();
}

/** Space apart evolution labels */
async function spaceApartEvolutionLabels(spacing) { // eslint-disable-line no-unused-vars
  const { y } = bbox(document.querySelector('.princ--xaxis .princ--tick-line'));
  await spaceApartY(Array.from(document.querySelectorAll('.princ--label')).filter((elem) => {
    const { width, height } = elem.getBBox();
    return width > 0 && height > 0;
  }), spacing, [undefined, y]);
  await spaceApartY(Array.from(document.querySelectorAll('.princ--label')).filter((elem) => {
    const { width, height } = elem.getBBox();
    return width > 0 && height > 0;
  }), spacing, [undefined, y]);
}
