import * as d3 from "d3";

// FIXME Add documentation

type Point = [number, number];
type SPoint = [number, number, number];
type PlotSelect = d3.Selection<SVGSVGElement, any, any, any>;
type AxisSelect = d3.Selection<d3.AxisContainerElement, {}, null, undefined>;
type Scale = d3.ScaleContinuousNumeric<number, number>;

export abstract class EvolutionDatum {
  protected cls: string;
  protected lab: string;
  protected cve: d3.CurveFactory;
  protected pnt?: d3.Symbol<any, any>;

  constructor() {
    this.cls = "";
    this.lab = "";
    this.cve = d3.curveCatmullRom;
    this.pnt = undefined;
  }

  classed(): string;
  classed(cls: string): this;
  /** FIXME */
  classed(cls?: string): string | this {
    if (cls === undefined) {
      return this.cls;
    } else {
      this.cls = cls;
      return this;
    }
  }

  label(): string;
  label(lab: string): this;
  /** FIXME */
  label(lab?: string): string | this {
    if (lab === undefined) {
      return this.lab;
    } else {
      // TODO Check certain things about labels, i.e. only whitespace is space
      this.lab = lab;
      return this;
    }
  }

  curve(): d3.CurveFactory;
  curve(cve: d3.CurveFactory): this;
  /** FIXME */
  curve(cve?: d3.CurveFactory): d3.CurveFactory | this {
    if (cve === undefined) {
      return this.cve;
    } else {
      this.cve = cve;
      return this;
    }
  }

  point(): d3.Symbol<any, any> | undefined;
  point(pnt: d3.Symbol<any, any>): this;
  /** FIXME */
  point(pnt?: d3.Symbol<any, any>): d3.Symbol<any, any> | this | undefined {
    if (pnt === undefined) {
      return this.pnt;
    } else {
      this.pnt = pnt;
      return this;
    }
  }

  // FIXME Make this a property in typescript 2.7 or later
  abstract target(): number;
  abstract plot(svg: PlotSelect, x: Scale, y: Scale): void;
}

class Line extends EvolutionDatum {
  private readonly data: Point[];

  constructor(data: Point[]) {
    super();
    this.data = data;
  }

  target(): number {
    return this.data[this.data.length - 1][1];
  }

  plot(svg: PlotSelect, x: Scale, y: Scale): void {
    // TODO Truncate data if it goes outside of bounds
    const path = d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]))
      .curve(this.cve)(this.data);
    if (path !== null) {
      svg.append("g").classed("line", true)
        .append("path").classed(this.cls, true)
        .attr("d", path);
    }
    if (this.pnt !== undefined) {
      svg.append("g").classed("point", true)
        .append("g").classed(this.cls, true)
        .selectAll("g").data(this.data).enter()
        .append("g")
        .attr("transform", ([px, py]: Point) => `translate(${x(px)}, ${y(py)})`)
        .append("path")
        .attr("d", this.pnt);
    }
  }
}

class Span extends EvolutionDatum {
  private readonly data: SPoint[];

  constructor(data: SPoint[]) {
    super();
    this.data = data;
  }

  target(): number {
    const [, low, high] = this.data[this.data.length - 1];
    return (low + high) / 2;
  }

  plot(svg: PlotSelect, x: Scale, y: Scale): void {
    // TODO Truncate data if it goes outside of bounds
    const path = d3.area<SPoint>()
      .x((d: SPoint) => x(d[0]))
      .y0((d: SPoint) => y(d[1]))
      .y1((d: SPoint) => y(d[2]))
      .curve(this.cve)(this.data);
    if (path !== null) {
      svg.append("g").classed("span", true)
        .append("path").classed(this.cls, true)
        .attr("d", path);
    }
    if (this.pnt !== undefined) {
      const pointData = this.data.map(([x, y, ]) => [x, y] as Point).concat(
        this.data.map(([x, , y]) => [x, y] as Point));
      svg.append("g").classed("point", true)
        .append("g").classed(this.cls, true)
        .selectAll("g").data(pointData).enter()
        .append("g")
        .attr("transform", ([px, py]: Point) => `translate(${x(px)}, ${y(py)})`)
        .append("path")
        .attr("d", this.pnt);
    }
  }
}

export class Evolution {
  private wdth: number;
  private hght: number;
  private data: EvolutionDatum[];
  private xMin: number;
  private xMinSet: boolean;
  private xMax: number;
  private xMaxSet: boolean;
  private yMin: number;
  private yMinSet: boolean;
  private yMax: number;
  private yMaxSet: boolean;
  private xScale: Scale;
  private yScale: Scale;
  private xLabel: string;
  private yLabel: string;
  private xTicks: number[];
  private yTicks: number[];
  private xTickFormat: (domain: number, index: number) => string;
  private yTickFormat: (domain: number, index: number) => string;

  constructor(width: number, height: number) {
    this.wdth = width;
    this.hght = height;
    this.data = [];
    // Bounds
    this.xMin = Infinity;
    this.xMinSet = false;
    this.xMax = -Infinity;
    this.xMaxSet = false;
    this.yMin = Infinity;
    this.yMinSet = false;
    this.yMax = -Infinity;
    this.yMaxSet = false;
    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
    this.xLabel = "";
    this.yLabel = "";
    this.xTicks = [];
    this.yTicks = [];
    this.xTickFormat = d3.format("");
    this.yTickFormat = d3.format("");
  }

  /** FIXME */
  line(data: Point[]): Line {
    data.forEach(([x, y]) => {
      this.xMinSet || (this.xMin = Math.min(this.xMin, x));
      this.xMaxSet || (this.xMax = Math.max(this.xMax, x));
      this.yMinSet || (this.yMin = Math.min(this.yMin, y));
      this.yMaxSet || (this.yMax = Math.max(this.yMax, y));
    });
    const line = new Line(data);
    this.data.push(line);
    return line;
  }

  /** FIXME */
  span(data: SPoint[]): Span {
    data.forEach(([x, y0, y1]) => {
      this.xMinSet || (this.xMin = Math.min(this.xMin, x));
      this.xMaxSet || (this.xMax = Math.max(this.xMax, x));
      this.yMinSet || (this.yMin = Math.min(this.yMin, y0, y1));
      this.yMaxSet || (this.yMax = Math.max(this.yMax, y0, y1));
    });
    const span = new Span(data);
    this.data.push(span);
    return span;
  }

  width(width: number): this {
    this.wdth = width;
    return this;
  }

  height(height: number): this {
    this.hght = height;
    return this;
  }

  xmin(): number;
  xmin(min: number): this;
  xmin(min?: number): number | this {
    if (min === undefined) {
      return this.xMin;
    } else {
      this.xMin = min;
      this.xMinSet = true;
      return this;
    }
  }

  xmax(): number;
  xmax(max: number): this;
  xmax(max?: number): number | this {
    if (max === undefined) {
      return this.xMax;
    } else {
      this.xMax = max;
      this.xMaxSet = true;
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
      return this.xmin(min).xmax(max);
    }
  }

  ymin(): number;
  ymin(min: number): this;
  ymin(min?: number): number | this {
    if (min === undefined) {
      return this.yMin;
    } else {
      this.yMin = min;
      this.yMinSet = true;
      return this;
    }
  }

  ymax(): number;
  ymax(max: number): this;
  ymax(max?: number): number | this {
    if (max === undefined) {
      return this.yMax;
    } else {
      this.yMax = max;
      this.yMaxSet = true;
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
      return this.ymin(min).ymax(max);
    }
  }

  xaxis({label = this.xLabel, ticks = this.xTicks, format = this.xTickFormat}): this {
    this.xLabel = label;
    this.xTicks = ticks;
    this.xTickFormat = format;
    return  this;
  }

  yaxis({label = this.yLabel, ticks = this.yTicks, format = this.yTickFormat}): this {
    this.yLabel = label;
    this.yTicks = ticks;
    this.yTickFormat = format;
    return  this;
  }

  plot(svgElement: SVGSVGElement): void {
    const svg: PlotSelect = d3.select(svgElement).append("g");
    const x = this.xScale.range([0, this.wdth]).domain(this.xbounds());
    const y = this.yScale.range([this.hght, 0]).domain(this.ybounds());

    // axes
    const axisGroup = svg.append("g").classed("axis", true);
    const xAxisGen = (d3.axisBottom(x) as d3.Axis<number>)
      .tickFormat(this.xTickFormat)
      .tickSizeInner(-1).tickSizeOuter(0)
      .tickValues([...new Set(this.xbounds().concat(this.xTicks))]);
    const xAxisGroup = axisGroup
      .append("g").attr("transform", `translate(0, ${this.hght})`)
      .append("g").classed("x", true);
    (xAxisGroup.append("g") as AxisSelect)
      .classed("ticks", true)
      .call(xAxisGen);
    xAxisGroup.append("g")
      .classed("label", true)
      .attr("transform", `translate(${this.wdth / 2}, 0)`)
      .append("text")
      .text(this.xLabel);
    const yAxisGroup = axisGroup.append("g").classed("y", true);
    const yAxisGen = (d3.axisLeft(y) as d3.Axis<number>)
      .tickSizeInner(-1).tickSizeOuter(0)
      .tickFormat(this.yTickFormat)
      .tickValues([...new Set(this.ybounds().concat(this.yTicks))]);
    (yAxisGroup.append("g") as AxisSelect)
      .call(yAxisGen);
    yAxisGroup.append("g")
      .classed("label", true)
      .append("text")
      .text(this.yLabel);

    // labels
    const labelGroup = svg.append("g").classed("data", true)
      .append("g").classed("label", true);
    const labelData = this.data.filter(datum => datum.label().length > 0);
    labelData.forEach(datum => labelGroup
      .append("text")
      .attr("x", this.wdth)
      .attr("y", y(datum.target()))
      .classed(datum.classed(), true)
      .text(datum.label()));

    // lines
    this.data.forEach(datum => datum.plot(svg, x, y));
  }
}

/** FIXME */
export function evolution(width: number = 162, height: number = 100): Evolution {
  return new Evolution(width, height);
}
