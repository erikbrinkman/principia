import * as d3 from "d3";
import * as backend from "./backend";

type Point = [number, number];
// FIXME Add type aliases for d3 types

// FIXME Better name
abstract class Thing {
  private _class: string;
  private _label: string;

  constructor() {
    this._class = "";
    this._label = "";
  }

  classed(): string;
  classed(cls: string): this;
  classed(cls?: string): string | this {
    if (cls === undefined) {
      return this._class;
    } else {
      this._class = cls;
      return this;
    }
  }

  label(): string;
  label(lab: string): this;
  label(lab?: string): string | this {
    if (lab === undefined) {
      return this._label;
    } else {
      this._label = lab;
      return this;
    }
  }

  // FIXME Make this a property in 2.7 or later
  abstract target(): number;
  abstract plot(svg: d3.Selection<d3.BaseType, {}, null, undefined>, x: d3.ScaleContinuousNumeric<number, number>, y: d3.ScaleContinuousNumeric<number, number>): void;
}

// FIXME Make implement interface
class Line extends Thing {
  private readonly _data: Point[];
  private _curve: d3.CurveFactory;
  private _point?: d3.Symbol<any, any>;

  constructor(data: Point[]) {
    super();
    this._data = data;
    this._curve = d3.curveLinear;
    this._point = undefined;
  }

  data(): Point[] {
    return this._data;
  }

  curve(): d3.CurveFactory;
  curve(cve: d3.CurveFactory): this;
  curve(cve?: d3.CurveFactory): d3.CurveFactory | this {
    if (cve === undefined) {
      return this._curve;
    } else {
      this._curve = cve;
      return this;
    }
  }

  point(): d3.Symbol<any, any> | undefined;
  point(pt: d3.Symbol<any, any>): this;
  point(pt?: d3.Symbol<any, any>): d3.Symbol<any, any> | this | undefined {
    if (pt === undefined) {
      return this._point;
    } else {
      this._point = pt;
      return this;
    }
  }

  target(): number {
    return this._data[this._data.length - 1][1];
  }

  plot(svg: d3.Selection<d3.BaseType, {}, null, undefined>, x: d3.ScaleContinuousNumeric<number, number>, y: d3.ScaleContinuousNumeric<number, number>): void {
    // TODO Truncate data if it goes outside of bounds
    const path = d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]))
      .curve(this.curve())(this.data());
    if (path !== null) {
      svg.append("g").classed("line", true)
        .append("path").classed(this.classed(), true)
        .attr("d", path.toString());
    }
    const point = this.point();
    if (point !== undefined) {
      svg.append("g").classed("point", true)
        .append("g").classed(this.classed(), true)
        .selectAll("path").data(this.data()).enter()
        .append("path")
        .attr("transform", ([px, py]: Point) => `translate(${x(px)}, ${y(py)})`)
        .attr("d", point.toString());
    }
  }
}

export class LinePlot {
  // FIXME Add axis tick formatting
  private _width: number;
  private _height: number;
  private _lines: Line[];
  private _xMin: number;
  private _xMinSet: boolean;
  private _xMax: number;
  private _xMaxSet: boolean;
  private _yMin: number;
  private _yMinSet: boolean;
  private _yMax: number;
  private _yMaxSet: boolean;
  private _xScale: d3.ScaleContinuousNumeric<number, number>;
  private _yScale: d3.ScaleContinuousNumeric<number, number>;
  private _xLabel: string;
  private _yLabel: string;
  private _xTicks: number[];
  private _yTicks: number[];
  private _xLabelBelow: boolean;
  private _yTickPadding: number;
  private _xTickPadding: number;
  private _labelBuffer: number;

  constructor(width?: number, height?: number) {
    this._width = width || 162;
    this._height = height || 100;
    this._lines = [];
    // Bounds
    this._xMin = Infinity;
    this._xMinSet = false;
    this._xMax = -Infinity;
    this._xMaxSet = false;
    this._yMin = Infinity;
    this._yMinSet = false;
    this._yMax = -Infinity;
    this._yMaxSet = false;
    this._xScale = d3.scaleLinear();
    this._yScale = d3.scaleLinear();
    this._xLabel = "";
    this._yLabel = "";
    this._xTicks = [];
    this._yTicks = [];
    this._xLabelBelow = false;
    this._yTickPadding = 0;
    this._xTickPadding = 0;
    this._labelBuffer = 1;
  }

  line(data: [number, number][], options: {x?: (d: [number, number], i: number) => number, y?: (d: [number, number], i: number) => number}): Line;
  line<D>(data: D[], options: {x: (d: D, i: number) => number, y: (d: D, i: number) => number}): Line;
  line(data: any[], options: {x?: (d: any, i: number) => number, y?: (d: any, i: number) => number} = {}): Line {
    const {
      x = (d: any, i: number) => d[0],
      y = (d: any, i: number) => d[1],
    } = options;
    const line = new Line(data.map((d, i) => {
      const xi = x(d, i);
      const yi = y(d, i);
      this._xMinSet || (this._xMin = Math.min(this._xMin, xi));
      this._xMaxSet || (this._xMax = Math.max(this._xMax, xi));
      this._yMinSet || (this._yMin = Math.min(this._yMin, yi));
      this._yMaxSet || (this._yMax = Math.max(this._yMax, yi));
      return [xi, yi] as [number, number];
    }));
    this._lines.push(line);
    return line;
  }

  width(): number;
  width(width: number): this;
  width(width?: number): number | this {
    if (width === undefined) {
      return this._width;
    } else {
      this._width = width;
      return this;
    }
  }

  height(): number;
  height(height: number): this;
  height(height?: number): number | this {
    if (height === undefined) {
      return this._height;
    } else {
      this._height = height;
      return this;
    }
  }

  xmin(): number;
  xmin(min: number): this;
  xmin(min?: number): number | this {
    if (min === undefined) {
      return this._xMin;
    } else {
      this._xMin = min;
      this._xMinSet = true;
      return this;
    }
  }

  xmax(): number;
  xmax(max: number): this;
  xmax(max?: number): number | this {
    if (max === undefined) {
      return this._xMax;
    } else {
      this._xMax = max;
      this._xMaxSet = true;
      return this;
    }
  }

  xbounds(): [number, number];
  xbounds(bounds: [number, number]): this;
  xbounds(bounds?: [number, number]): [number, number] | this {
    if (bounds === undefined) {
      return [this.xmin(), this.xmax()];
    } else {
      const [min, max] = bounds;
      this.xmin(min).xmax(max);
      return this;
    }
  }

  ymin(): number;
  ymin(min: number): this;
  ymin(min?: number): number | this {
    if (min === undefined) {
      return this._yMin;
    } else {
      this._yMin = min;
      this._yMinSet = true;
      return this;
    }
  }

  ymax(): number;
  ymax(max: number): this;
  ymax(max?: number): number | this {
    if (max === undefined) {
      return this._yMax;
    } else {
      this._yMax = max;
      this._yMaxSet = true;
      return this;
    }
  }

  ybounds(): [number, number];
  ybounds(bounds: [number, number]): this;
  ybounds(bounds?: [number, number]): [number, number] | this {
    if (bounds === undefined) {
      return [this.ymin(), this.ymax()];
    } else {
      const [min, max] = bounds;
      this.ymin(min).ymax(max);
      return this;
    }
  }

  xlabel(label: string, options: {below?: boolean} = {}): this {
    const { below = this._xLabelBelow } = options;
    this._xLabel = label;
    this._xLabelBelow = below;
    return  this;
  }

  ylabel(label: string): this {
    this._yLabel = label;
    return this;
  }

  xticks(ticks: number[], options: {padding?: number} = {}): this {
    const { padding = this._xTickPadding } = options;
    this._xTicks = ticks;
    this._xTickPadding = padding;
    return this;
  }

  yticks(ticks: number[], options: {padding?: number} = {}): this {
    const { padding = this._yTickPadding } = options;
    this._yTicks = ticks;
    this._yTickPadding = padding;
    return this;
  }

  labels(options: {buffer?: number} = {}): this {
    // TODO This should be possible in one line, but seems like a bug
    const { buffer = this._labelBuffer } = options;
    this._labelBuffer = buffer;
    return this;
  }

  plot(svgElement: SVGSVGElement): void {
    /** Returns bbox without transformations */
    function getBBox(element: any): {x: number, y: number, width: number, height: number} {
      const ctm = svgElement.getScreenCTM().inverse();
      const rect = element.getBoundingClientRect();
      const points = new Array(4).fill(undefined).map(_ => svgElement.createSVGPoint());
      points[0].x = points[1].x = rect.left;
      points[2].x = points[3].x = rect.right;
      points[0].y = points[2].y = rect.top;
      points[1].y = points[3].y = rect.bottom;
      const transformed = points.map(p => p.matrixTransform(ctm));
      const minx = Math.min(...transformed.map(p => p.x));
      const maxx = Math.max(...transformed.map(p => p.x));
      const miny = Math.min(...transformed.map(p => p.y));
      const maxy = Math.max(...transformed.map(p => p.y));
      return {
        x: minx,
        y: miny,
        width: maxx - minx,
        height: maxy - miny,
      };
    }

    const svg = d3.select(svgElement).append("g");
    const x = this._xScale.range([0, this._width]).domain([this._xMin, this._xMax]);
    const y = this._yScale.range([this._height, 0]).domain([this._yMin, this._yMax]);

    // axes
    const axisGroup = svg.append("g").classed("axis", true);
    const xAxisGen = d3.axisBottom(x)
      .tickSizeInner(-2).tickSizeOuter(0).tickPadding(5)
      .tickValues([...new Set([this._xMin, this._xMax].concat(this._xTicks))]);
    const xAxisGroup = axisGroup.append("g").classed("x", true);
    const xAxis = xAxisGroup.append("g")
      .classed("ticks", true)
      .attr("transform", `translate(0, ${this._height + 5})`)
      .call(xAxisGen);
    const xAxisLabel = xAxisGroup.append("g")
      .classed("label", true)
      .append("text")
      .style("text-anchor", "middle")
      .text(this._xLabel);
    const yAxisGroup = axisGroup.append("g").classed("y", true);
    const yAxisGen = d3.axisLeft(y)
      .tickSizeInner(-2.5).tickSizeOuter(0).tickPadding(2)
      .tickValues([...new Set([this._yMin, this._yMax].concat(this._yTicks))]);
    const yAxis = yAxisGroup.append("g")
      .attr("transform", "translate(-5, 0)")
      .call(yAxisGen);
    const yAxisLabel = yAxisGroup.append("g")
      .classed("label", true)
      .append("text")
      .text(this._yLabel);

    // labels
    const labelGroup = svg.append("g").classed("label", true);
    const labels = this._lines.map(line => labelGroup
      .append("text")
      .classed(line.classed(), true)
      .text(line.label()));

    // lines
    this._lines.forEach(line => line.plot(svg, x, y));

    // space apart y ticks
    const yTicks = yAxis.selectAll("text").nodes() as HTMLElement[];
    const yTickSpaces = yTicks.map(tick => {
      const box = getBBox(tick);
      return [box.y - this._yTickPadding, box.height + 2 * this._yTickPadding] as [number, number];
    });
    const newYs = backend.space1(yTickSpaces);
    yTicks.forEach((tick, i) => {
      tick.setAttribute("y", (parseFloat(tick.getAttribute("y") || "0") + newYs[i] - yTickSpaces[i][0]).toString());
    });

    // space apart x ticks
    const xTicks = xAxis.selectAll("text").nodes() as HTMLElement[];
    const xTickSpaces = xTicks.map(tick => {
      const box = getBBox(tick);
      return [box.x - this._xTickPadding, box.width + 2 * this._xTickPadding] as [number, number];
    });
    const newXs = backend.space1(xTickSpaces);
    xTicks.forEach((tick, i) => {
      tick.setAttribute("x", (parseFloat(tick.getAttribute("x") || "0") + newXs[i] - xTickSpaces[i][0]).toString());
    });

    // align x axis label
    const xBoxes = xTicks.map(tick => getBBox(tick)).sort((a, b) => a.x - b.x);
    const xLabelBox = (xAxisLabel.node() as SVGSVGElement).getBBox();
    const [xSmall, xLarge] = xBoxes.slice(0, -1)
      .map((bi, i) => [bi.x + bi.width, xBoxes[i + 1].x])
      .reduce((l, e) => e[1] - e[0] > l[1] - l[0] ? e : l, [0, 0]);
    if (this._xLabelBelow || xLarge - xSmall < xLabelBox.width) {
      const y = Math.max(...xBoxes.map(d => d.y + d.height));
      xAxisLabel
        .attr("x", this._width / 2)
        .attr("y", y + xLabelBox.height);
    } else {
      const y = Math.min(...xBoxes.map(d => d.y));
      xAxisLabel
        .attr("x", (xLarge + xSmall) / 2)
        .attr("y", y + xLabelBox.height);
    }

    // align y axis label
    const topYBBox = getBBox(yAxis.selectAll("text").nodes()[1]);
    yAxisLabel.attr("x", topYBBox.x).attr("y", topYBBox.y);

    // FIXME Only align non empty labels
    // align line labels
    if (this._lines.some(line => line.label().length > 0)) {
      const targets = this._lines.map(line => y(line.target()));
      const input = labels.map((label, i) => {
        const height = (label.node() as SVGSVGElement).getBBox().height;
        return [targets[i] - height / 2, height] as [number, number];
      });
      const pos = backend.space1(input);
      labels.forEach((label, i) => {
        label.attr("x", this._width + this._labelBuffer).attr("y", pos[i] + input[i][1]);
      });
    }
  }
}
