/** This file contains stand alone functions to be called in browser */
// deno-lint-ignore-file no-undef
import { AlignArgs } from "./bridge.ts";

// TODO allow alignment based of decimal when aligning axis ticks

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bounds {
  lower?: number;
  upper?: number;
}

/** Align all elements acording to specification */
// NOTE this function must be entirely self contained so that it can be called
// in the puppeteer context
// NOTE undefined = auto, null = off, number = manual
// TODO explose interface that just tests solveQP
async function align({
  abscompLabels = true,
  abscompAxisLabels = true,
  abscompTitle = true,
  yticks,
  ylabel,
  xticks,
  xlabel,
  xshift,
  evoLabels,
}: AlignArgs): Promise<void> {
  // -----
  // utils
  // -----

  /** not null */
  function nn<T>(val: T | null): T {
    if (val === null) {
      throw new Error("val was unexpectedly null");
    } else {
      return val;
    }
  }

  /** has getBBox */
  function bb(elem: unknown): SVGGraphicsElement {
    if (elem instanceof SVGGraphicsElement) {
      return elem;
    } else {
      throw new Error("element wasn't an svg graphics element");
    }
  }

  /** Await rendering */
  async function render(time = 0): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, time));
  }

  /** reset transforms on all elements */
  async function reset(...elems: SVGElement[]): Promise<void> {
    for (const { style } of elems) {
      style.transform = "none";
    }
    await render();
  }

  /** mean */
  function mean(arr: number[]): number {
    return arr.reduce((a, v, i) => a + (v - a) / (i + 1), 0);
  }

  // --------
  // quadprog
  // --------
  const vsmall = ((): number => {
    let epsilon = 1.0e-60,
      tmpa: number,
      tmpb: number;

    do {
      epsilon = epsilon + epsilon;
      tmpa = 1 + 0.1 * epsilon;
      tmpb = 1 + 0.2 * epsilon;
    } while (tmpa <= 1 || tmpb <= 1);

    return epsilon;
  })();

  function dpori(a: number[][], n: number): void {
    let i, j, k, kp1, t;

    for (k = 1; k <= n; k = k + 1) {
      a[k][k] = 1 / a[k][k];
      t = -a[k][k];
      for (i = 1; i < k; i = i + 1) {
        a[i][k] = t * a[i][k];
      }

      kp1 = k + 1;
      if (n < kp1) {
        break;
      }
      for (j = kp1; j <= n; j = j + 1) {
        t = a[k][j];
        a[k][j] = 0;
        for (i = 1; i <= k; i = i + 1) {
          a[i][j] = a[i][j] + t * a[i][k];
        }
      }
    }
  }

  function dposl(a: number[][], n: number, b: number[]): void {
    let i, k, kb, t;

    for (k = 1; k <= n; k = k + 1) {
      t = 0;
      for (i = 1; i < k; i = i + 1) {
        t = t + a[i][k] * b[i];
      }

      b[k] = (b[k] - t) / a[k][k];
    }

    for (kb = 1; kb <= n; kb = kb + 1) {
      k = n + 1 - kb;
      b[k] = b[k] / a[k][k];
      t = -b[k];
      for (i = 1; i < k; i = i + 1) {
        b[i] = b[i] + t * a[i][k];
      }
    }
  }

  function dpofa(a: number[][], n: number): number {
    let jm1, k, t, s;
    let info = 0;

    for (let j = 1; j <= n; ++j) {
      info = j;
      s = 0;
      jm1 = j - 1;
      if (jm1 < 1) {
        s = a[j][j] - s;
        if (s <= 0) {
          break;
        }
        a[j][j] = Math.sqrt(s);
      } else {
        for (k = 1; k <= jm1; k = k + 1) {
          t = a[k][j];
          for (let i = 1; i < k; ++i) {
            t = t - a[i][j] * a[i][k];
          }
          t = t / a[k][k];
          a[k][j] = t;
          s = s + t * t;
        }
        s = a[j][j] - s;
        if (s <= 0) {
          break;
        }
        a[j][j] = Math.sqrt(s);
      }
      info = 0;
    }

    return info;
  }

  function qpgen2(
    dmat: number[][],
    dvec: number[],
    n: number,
    sol: number[],
    crval: [undefined, number],
    amat: number[][],
    bvec: number[],
    q: number,
    meq: number,
    iter: [undefined, number, number],
    factorized: boolean,
  ): void {
    let i: number,
      j: number,
      l1,
      it1 = 0,
      nvl: number,
      temp,
      sum,
      t1: number,
      tt: number,
      gc,
      gs,
      nu,
      t1inf,
      t2min;

    const r = Math.min(n, q);
    let l = n + (r * (r + 5)) / 2 + 2 * q + 1;
    const work = dvec.slice().concat(new Array(l).fill(0));
    const iact = new Array(q + 1).fill(0);
    const lagr = new Array(q + 1).fill(0);

    if (factorized) {
      for (j = 1; j <= n; j = j + 1) {
        sol[j] = 0;
        for (i = 1; i <= j; i = i + 1) {
          sol[j] = sol[j] + dmat[i][j] * dvec[i];
        }
      }
      for (j = 1; j <= n; j = j + 1) {
        dvec[j] = 0;
        for (i = j; i <= n; i = i + 1) {
          dvec[j] = dvec[j] + dmat[j][i] * sol[i];
        }
      }
    } else {
      const info = dpofa(dmat, n);
      if (info !== 0) {
        throw new Error(
          "matrix D in quadratic function is not positive definite!",
        );
      }
      dposl(dmat, n, dvec);
      dpori(dmat, n);
    }

    crval[1] = 0;
    for (j = 1; j <= n; j = j + 1) {
      sol[j] = dvec[j];
      crval[1] = crval[1] + work[j] * sol[j];
      work[j] = 0;
      for (i = j + 1; i <= n; i = i + 1) {
        dmat[i][j] = 0;
      }
    }
    crval[1] = -crval[1] / 2;

    const iwzv = n;
    const iwrv = iwzv + n;
    const iwuv = iwrv + r;
    const iwrm = iwuv + r + 1;
    const iwsv = iwrm + (r * (r + 1)) / 2;
    const iwnbv = iwsv + q;

    for (i = 1; i <= q; i = i + 1) {
      sum = 0;
      for (j = 1; j <= n; j = j + 1) {
        sum = sum + amat[j][i] * amat[j][i];
      }
      work[iwnbv + i] = Math.sqrt(sum);
    }
    let nact = 0;
    iter[1] = 0;
    iter[2] = 0;

    function goto50(): 0 | 999 {
      iter[1] = iter[1] + 1;

      l = iwsv;
      for (i = 1; i <= q; i = i + 1) {
        l = l + 1;
        sum = -bvec[i];
        for (j = 1; j <= n; j = j + 1) {
          sum = sum + amat[j][i] * sol[j];
        }
        if (Math.abs(sum) < vsmall) {
          sum = 0;
        }
        if (i > meq) {
          work[l] = sum;
        } else {
          work[l] = -Math.abs(sum);
          if (sum > 0) {
            for (j = 1; j <= n; j = j + 1) {
              amat[j][i] = -amat[j][i];
            }
            bvec[i] = -bvec[i];
          }
        }
      }

      for (i = 1; i <= nact; i = i + 1) {
        work[iwsv + iact[i]] = 0;
      }

      nvl = 0;
      temp = 0;
      for (i = 1; i <= q; i = i + 1) {
        if (work[iwsv + i] < temp * work[iwnbv + i]) {
          nvl = i;
          temp = work[iwsv + i] / work[iwnbv + i];
        }
      }
      if (nvl === 0) {
        for (i = 1; i <= nact; i = i + 1) {
          lagr[iact[i]] = work[iwuv + i];
        }
        return 999;
      }

      return 0;
    }

    function goto55(): 0 | 700 {
      for (i = 1; i <= n; i = i + 1) {
        sum = 0;
        for (j = 1; j <= n; j = j + 1) {
          sum = sum + dmat[j][i] * amat[j][nvl];
        }
        work[i] = sum;
      }

      l1 = iwzv;
      for (i = 1; i <= n; i = i + 1) {
        work[l1 + i] = 0;
      }
      for (j = nact + 1; j <= n; j = j + 1) {
        for (i = 1; i <= n; i = i + 1) {
          work[l1 + i] = work[l1 + i] + dmat[i][j] * work[j];
        }
      }

      t1inf = true;
      for (i = nact; i >= 1; i = i - 1) {
        sum = work[i];
        l = iwrm + (i * (i + 3)) / 2;
        l1 = l - i;
        for (j = i + 1; j <= nact; j = j + 1) {
          sum = sum - work[l] * work[iwrv + j];
          l = l + j;
        }
        sum = sum / work[l1];
        work[iwrv + i] = sum;
        if (iact[i] <= meq) {
          continue;
        }
        if (sum <= 0) {
          continue;
        }
        t1inf = false;
        it1 = i;
      }

      if (!t1inf) {
        t1 = work[iwuv + it1] / work[iwrv + it1];
        for (i = 1; i <= nact; i = i + 1) {
          if (iact[i] <= meq) {
            continue;
          }
          if (work[iwrv + i] <= 0) {
            continue;
          }
          temp = work[iwuv + i] / work[iwrv + i];
          if (temp < t1) {
            t1 = temp;
            it1 = i;
          }
        }
      }

      sum = 0;
      for (i = iwzv + 1; i <= iwzv + n; i = i + 1) {
        sum = sum + work[i] * work[i];
      }
      if (Math.abs(sum) <= vsmall) {
        if (t1inf) {
          throw new Error("constraints are inconsistent, no solution!");
        } else {
          for (i = 1; i <= nact; i = i + 1) {
            work[iwuv + i] = work[iwuv + i] - t1 * work[iwrv + i];
          }
          work[iwuv + nact + 1] = work[iwuv + nact + 1] + t1;
          return 700;
        }
      } else {
        sum = 0;
        for (i = 1; i <= n; i = i + 1) {
          sum = sum + work[iwzv + i] * amat[i][nvl];
        }
        tt = -work[iwsv + nvl] / sum;
        t2min = true;
        if (!t1inf) {
          if (t1 < tt) {
            tt = t1;
            t2min = false;
          }
        }

        for (i = 1; i <= n; i = i + 1) {
          sol[i] = sol[i] + tt * work[iwzv + i];
          if (Math.abs(sol[i]) < vsmall) {
            sol[i] = 0;
          }
        }

        crval[1] = crval[1] + tt * sum * (tt / 2 + work[iwuv + nact + 1]);
        for (i = 1; i <= nact; i = i + 1) {
          work[iwuv + i] = work[iwuv + i] - tt * work[iwrv + i];
        }
        work[iwuv + nact + 1] = work[iwuv + nact + 1] + tt;

        if (t2min) {
          nact = nact + 1;
          iact[nact] = nvl;

          l = iwrm + ((nact - 1) * nact) / 2 + 1;
          for (i = 1; i <= nact - 1; i = i + 1) {
            work[l] = work[i];
            l = l + 1;
          }

          if (nact === n) {
            work[l] = work[n];
          } else {
            for (i = n; i >= nact + 1; i = i - 1) {
              if (work[i] === 0) {
                continue;
              }
              gc = Math.max(Math.abs(work[i - 1]), Math.abs(work[i]));
              gs = Math.min(Math.abs(work[i - 1]), Math.abs(work[i]));
              if (work[i - 1] >= 0) {
                temp = Math.abs(gc * Math.sqrt(1 + (gs * gs) / (gc * gc)));
              } else {
                temp = -Math.abs(gc * Math.sqrt(1 + (gs * gs) / (gc * gc)));
              }
              gc = work[i - 1] / temp;
              gs = work[i] / temp;

              if (gc === 1) {
                continue;
              }
              if (gc === 0) {
                work[i - 1] = gs * temp;
                for (j = 1; j <= n; j = j + 1) {
                  temp = dmat[j][i - 1];
                  dmat[j][i - 1] = dmat[j][i];
                  dmat[j][i] = temp;
                }
              } else {
                work[i - 1] = temp;
                nu = gs / (1 + gc);
                for (j = 1; j <= n; j = j + 1) {
                  temp = gc * dmat[j][i - 1] + gs * dmat[j][i];
                  dmat[j][i] = nu * (dmat[j][i - 1] + temp) - dmat[j][i];
                  dmat[j][i - 1] = temp;
                }
              }
            }
            work[l] = work[nact];
          }
        } else {
          sum = -bvec[nvl];
          for (j = 1; j <= n; j = j + 1) {
            sum = sum + sol[j] * amat[j][nvl];
          }
          if (nvl > meq) {
            work[iwsv + nvl] = sum;
          } else {
            work[iwsv + nvl] = -Math.abs(sum);
            if (sum > 0) {
              for (j = 1; j <= n; j = j + 1) {
                amat[j][nvl] = -amat[j][nvl];
              }
              bvec[nvl] = -bvec[nvl];
            }
          }
          return 700;
        }
      }

      return 0;
    }

    function goto797(): 798 | 0 {
      l = iwrm + (it1 * (it1 + 1)) / 2 + 1;
      l1 = l + it1;
      if (work[l1] === 0) {
        return 798;
      }
      gc = Math.max(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
      gs = Math.min(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
      if (work[l1 - 1] >= 0) {
        temp = Math.abs(gc * Math.sqrt(1 + (gs * gs) / (gc * gc)));
      } else {
        temp = -Math.abs(gc * Math.sqrt(1 + (gs * gs) / (gc * gc)));
      }
      gc = work[l1 - 1] / temp;
      gs = work[l1] / temp;

      if (gc === 1) {
        return 798;
      }
      if (gc === 0) {
        for (i = it1 + 1; i <= nact; i = i + 1) {
          temp = work[l1 - 1];
          work[l1 - 1] = work[l1];
          work[l1] = temp;
          l1 = l1 + i;
        }
        for (i = 1; i <= n; i = i + 1) {
          temp = dmat[i][it1];
          dmat[i][it1] = dmat[i][it1 + 1];
          dmat[i][it1 + 1] = temp;
        }
      } else {
        nu = gs / (1 + gc);
        for (i = it1 + 1; i <= nact; i = i + 1) {
          temp = gc * work[l1 - 1] + gs * work[l1];
          work[l1] = nu * (work[l1 - 1] + temp) - work[l1];
          work[l1 - 1] = temp;
          l1 = l1 + i;
        }
        for (i = 1; i <= n; i = i + 1) {
          temp = gc * dmat[i][it1] + gs * dmat[i][it1 + 1];
          dmat[i][it1 + 1] = nu * (dmat[i][it1] + temp) - dmat[i][it1 + 1];
          dmat[i][it1] = temp;
        }
      }

      return 0;
    }

    function goto798(): 0 | 797 {
      l1 = l - it1;
      for (i = 1; i <= it1; i = i + 1) {
        work[l1] = work[l];
        l = l + 1;
        l1 = l1 + 1;
      }

      work[iwuv + it1] = work[iwuv + it1 + 1];
      iact[it1] = iact[it1 + 1];
      it1 = it1 + 1;
      if (it1 < nact) {
        return 797;
      }

      return 0;
    }

    function goto799(): void {
      work[iwuv + nact] = work[iwuv + nact + 1];
      work[iwuv + nact + 1] = 0;
      iact[nact] = 0;
      nact = nact - 1;
      iter[2] = iter[2] + 1;
    }

    let go = 0;
    while (true) {
      go = goto50();
      if (go === 999) {
        return;
      }
      while (true) {
        go = goto55();
        if (go === 0) {
          break;
        } else if (go === 999) {
          return;
        } else if (go === 700) {
          if (it1 === nact) {
            goto799();
          } else {
            while (true) {
              goto797();
              go = goto798();
              if (go !== 797) {
                break;
              }
            }
            goto799();
          }
        }
      }
    }
  }

  /** Solve a quadratic program
   *
   * min 1/2 xT Q x - cT x
   * st A x <= b
   */
  function solveQP(
    Q: number[][],
    c: number[],
    A: number[][],
    b: number[],
    meq = 0,
    factorized = false,
  ) {
    // validate inputs
    const n = Q.length;
    const q = A.length;

    if (Q.some((row) => row.length !== n)) {
      throw new Error("Q is not symmetric!");
    } else if (n !== c.length) {
      throw new Error("Q and c are incompatible!");
    } else if (A.some((row) => row.length !== n)) {
      throw new Error("A and c are incompatible!");
    } else if (q !== b.length) {
      throw new Error("A and b are incompatible!");
    } else if (meq > q || meq < 0) {
      throw new Error("Value of meq is invalid!");
    }

    // tweak objective to match qpgen2
    const Dmat = Q.map((r) => r.slice());
    const dvec = c.map((v) => -v);
    const Amat = c.map((_, i) => A.map((r) => -r[i]));
    const bvec = b.map((v) => -v);

    // make 1 based indexed
    for (const mat of [Dmat, Amat]) {
      for (const row of mat) {
        row.unshift(0);
      }
      mat.unshift([]);
    }
    for (const vec of [dvec, bvec]) {
      vec.unshift(0);
    }

    const sol = new Array(n + 1).fill(0);
    const crval: [undefined, number] = [, 0];
    const iter: [undefined, number, number] = [, 0, 0];

    qpgen2(
      Dmat,
      dvec,
      n,
      sol,
      crval,
      Amat,
      bvec,
      q,
      meq,
      iter,
      factorized,
    );

    sol.shift();
    return sol;
  }

  // ----------------
  // actual alignment
  // ----------------

  /** Get the untransformed bounding box of an svg element */
  function bbox(elem: SVGGraphicsElement): BBox {
    const bb = elem.getBBox();
    const svg = nn(elem.ownerSVGElement);
    const mat = nn(svg.getScreenCTM()).inverse().multiply(
      nn(elem.getScreenCTM()),
    );

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
  function spaceApartCalc(
    elements: [number, number][],
    spacing: number,
    { upper, lower }: Bounds = {},
  ): number[] {
    // Sort so that constraints are convex
    const centers = elements.map(([x, w]) => x + w / 2);
    const ord = centers.map((_, i) => i).sort((a, b) =>
      centers[a] - centers[b]
    );
    const sorted = ord.map((i) => elements[i]);

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
    const b = sorted
      .slice(0, -1)
      .map(([x, w], i) => sorted[i + 1][0] - spacing - x - w);

    // Add constraints for bounds violations
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
      b.push(
        upper - sorted[sorted.length - 1][0] - sorted[sorted.length - 1][1],
      );
    }

    // Solve and unsort
    const sol = solveQP(Q, c, A, b);
    const offsets: number[] = [];
    for (const [j, i] of ord.entries()) {
      offsets[i] = sol[j];
    }
    return offsets;
  }

  /** Space elements apart along the x or y axis */
  async function spaceApart(
    orientation: "X" | "Y",
    elems: SVGGraphicsElement[],
    spacing: number,
    bounds?: Bounds,
  ): Promise<void> {
    await reset(...elems);
    const offsets = spaceApartCalc(
      elems.map((elem) => {
        const box = bbox(elem);
        if (orientation === "X") {
          return [box.x, box.width];
        } else if (orientation === "Y") {
          return [box.y, box.height];
        } else {
          throw new Error(`unknown style: ${orientation}`);
        }
      }),
      spacing,
      bounds,
    );
    for (const [i, { style }] of elems.entries()) {
      style.transform = `translate${orientation}(${offsets[i]}px)`;
    }
    await render();
  }

  /* ------------------- *
   * Absolute Comparison *
   * ------------------- */

  /** Align absolute comparison lables to left of bars */
  if (abscompLabels) {
    const labels = Array.from(
      document.querySelectorAll(".princ-abscomp .princ-align-label"),
    ).map(bb);
    if (labels.length) {
      await reset(...labels);
      const bboxes = labels.map(bbox);
      const minx = Math.min(...bboxes.map(({ x }) => x));
      for (const [i, { style }] of labels.entries()) {
        style.transform = `translateX(${minx - bboxes[i].x}px)`;
      }
      await render();
    }
  }

  /** Align absolute comparison number to right of bars */
  if (abscompAxisLabels) {
    const nums = Array.from(
      document.querySelectorAll(".princ-abscomp .princ-align-tick-label"),
    ).map(bb);
    if (nums.length) {
      await reset(...nums);
      const bboxes = nums.map(bbox);
      const maxx = Math.max(...bboxes.map(({ x, width }) => x + width));
      for (const [i, { style }] of nums.entries()) {
        style.transform = `translateX(${maxx - bboxes[i].x -
          bboxes[i].width}px)`;
      }
      await render();
    }
  }

  /** Align absolute comparison title to left labels */
  if (abscompTitle) {
    const title = bb(
      document.querySelector(".princ-abscomp .princ-align-title"),
    );
    const labels = Array.from(
      document.querySelectorAll(".princ-abscomp .princ-align-label"),
    ).map(bb);
    if (title && labels.length) {
      await reset(title);
      const tbb = bbox(title);
      const bboxes = labels.map(bbox);
      const minx = Math.min(...bboxes.map(({ x }) => x));
      title.style.transform = `translateX(${minx - tbb.x}px)`;
      await render();
    }
  }

  /* --------- *
   * Evolution *
   * --------- */

  /** Space apart y ticks */
  if (xticks !== null) {
    const ticks = Array.from(
      document.querySelectorAll(".princ-xaxis .princ-autoalign-tick"),
    ).map(bb);
    if (ticks.length) {
      await reset(...ticks);
      const boxes = ticks.map(bbox);
      const left = Math.min(...boxes.map(({ x }) => x));
      const spacing = xticks !== undefined
        ? xticks
        : mean(boxes.map(({ width }) => width)) / 8;
      await spaceApart(
        "X",
        ticks,
        spacing,
        { lower: left },
      );
    } else if (xticks !== undefined) {
      throw new Error(
        "specified a x-axis tick seperation, but there were no x-axis ticks",
      );
    }
  }

  /** Space apart y ticks */
  if (yticks !== null) {
    const ticks = Array.from(
      document.querySelectorAll(".princ-yaxis .princ-autoalign-tick"),
    ).map(bb);
    if (ticks.length) {
      await reset(...ticks);
      const boxes = ticks.map(bbox);
      const bottom = Math.max(...boxes.map(({ y, height }) => y + height));
      const spacing = yticks !== undefined ? yticks : 0;
      await spaceApart(
        "Y",
        ticks,
        spacing,
        { upper: bottom },
      );
    } else if (yticks !== undefined) {
      throw new Error(
        "specified a y-axis tick seperation, but there were no y-axis ticks",
      );
    }
  }

  /**
   * Align the x axis label so its centered and either inline with the ticks if
   * possible and `shift` otherwise spacing below the lowest tick
   */
  if (xlabel !== null) {
    const nlabel = document.querySelector(
      ".princ-xaxis .princ-autoalign-label",
    );
    const tbbs = Array.from(
      document.querySelectorAll(".princ-xaxis .princ-autoalign-tick"),
    ).map(bb).map(bbox);
    if (nlabel !== null && tbbs.length) {
      const label = bb(nlabel);
      await reset(label);
      const lbb = bbox(label);
      const spacing = xlabel === undefined ? xlabel = lbb.height / 8 : xlabel;
      const shift = xshift === null
        ? null
        : xshift === undefined
        ? spacing
        : xshift;
      const newy = shift !== null &&
          tbbs.every(
            ({ x, width }) =>
              x + width + shift <= lbb.x ||
              lbb.x + lbb.width + shift <= x,
          )
        ? mean(tbbs.map(({ y }) => y))
        : Math.max(...tbbs.map(({ y, height }) => y + height));
      label.style.transform = `translate(0, ${newy - lbb.y + spacing}px)`;
      await render();
    } else if (xlabel !== undefined) {
      throw new Error(
        "specified an xlabel spacing but there was no x-axis label or no x-axis ticks",
      );
    }
  }

  /** Align the y axis label so it matches the top y tick and is `spacing` above it */
  if (ylabel !== null) {
    const nlabel = document.querySelector(
      ".princ-yaxis .princ-autoalign-label",
    );
    const tbbs = Array.from(
      document.querySelectorAll(".princ-yaxis .princ-autoalign-tick"),
    )
      .map(bb)
      .map(bbox);
    if (nlabel !== null && tbbs.length) {
      const label = bb(nlabel);
      await reset(label);
      const lbb = bbox(label);
      const spacing = ylabel !== undefined ? ylabel : 0;
      // top tick bounding box
      const tbb = tbbs.reduce((a, b) => (a.y < b.y ? a : b));
      label.style.transform = `translate(${tbb.x - lbb.x}px, ${tbb.y - lbb.y -
        lbb.height - spacing}px)`;
      await render();
    } else if (ylabel !== undefined) {
      throw new Error(
        "specified a ylable spacing but there was no y-axis label or no y-axis ticks",
      );
    }
  }

  /** Space apart evolution labels */
  if (evoLabels !== null) {
    const labels = Array.from(
      document.querySelectorAll(
        ".princ-evolution-items .princ-autoalign-label",
      ),
    ).map(
      bb,
    );
    if (labels.length) {
      // if x ticks, make sure we don't overlap
      const xticks = Array.from(
        document.querySelectorAll(".princ-xaxis .princ-autoalign-tick"),
      ).map(
        (e) => bbox(bb(e)).y,
      );
      const upper = xticks.length ? Math.min(...xticks) : undefined;

      // if long y axis label, make sure we don't overlap
      let lower;
      const nlabel = document.querySelector(
        ".princ-yaxis .princ-autoalign-label",
      );
      if (nlabel !== null) {
        const { x, width, y, height } = bbox(bb(nlabel));
        const minx = Math.min(...labels.map(bbox).map(({ x }) => x));
        if (x + width >= minx) {
          lower = y + height;
        }
      }

      const spacing = evoLabels !== undefined ? evoLabels : 0;
      await spaceApart(
        "Y",
        labels,
        spacing,
        { lower, upper },
      );
    } else if (evoLabels !== undefined) {
      throw new Error(
        "evolution label spacing was manually specified but there were no evolution labels",
      );
    }
  }
}
