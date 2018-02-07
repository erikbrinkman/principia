import * as d3 from "d3";

type PlotSelect = d3.Selection<SVGSVGElement, any, any, any>;
type AxisSelect = d3.Selection<d3.AxisContainerElement, {}, null, undefined>;
type Scale = d3.ScaleContinuousNumeric<number, number>;
type Format = (domain: number, index: number) => string;

// FIXME Add documentation

abstract class CompData {
  protected cls: string;

  constructor() {
    this.cls = "";
  }

  classed(): string;
  classed(cls: string): this;
  classed(cls?: string): string | this {
    if (cls === undefined) {
      return this.cls;
    } else {
      this.cls = cls;
      return this;
    }
  }

  abstract plot(elem: PlotSelect, x: Scale, format: Format): void;
}

class Value extends CompData {
  private lab: string;
  private val: number;

  constructor(label: string, value: number) {
    super();
    this.lab = label;
    this.val = value;
  }

  plot(elem: PlotSelect, x: Scale, format: Format): void {
    // TODO In d3 style this should probably join on this.val, then width will
    // be a function of d, and so will the text
    elem.append("g").classed("value", true)
      .append("rect").classed(this.cls, true)
      .attr("y", "-0.5em")
      .attr("height", "1em")
      .attr("width", x(this.val));
    elem.append("g").classed("name", true)
      .append("text").classed(this.cls, true)
      .text(this.lab);
    elem.append("g").classed("num", true)
      .append("text").classed(this.cls, true)
      .text((_, i) => format(this.val, i));
  }
}

export class Comparison {
  private wdth: number;
  private data: CompData[];
  private maxVal: number;
  private maxSet: boolean;
  private scale: Scale;
  private format: Format;
  // Axis
  private label: string;
  private ticks: number[];
  private axisFormat: Format;

  constructor(width: number) {
    this.wdth = width;
    this.data = [];
    // Bounds
    this.maxVal = 0.0;
    this.maxSet = false;
    this.scale = d3.scaleLinear();
    this.format = d3.format("");
    // Axis
    this.label = "";
    this.ticks = [];
    this.axisFormat = d3.format("");
  }

  value(label: string, value: number): Value {
    this.maxSet || (this.maxVal = Math.max(this.maxVal, value));
    const datum = new Value(label, value);
    this.data.push(datum);
    return datum;
  }

  width(width: number): this {
    this.wdth = width;
    return this;
  }

  numberFormat(format: Format): this {
    this.format = format;
    return this;
  }

  max(): number;
  max(max: number): this;
  max(max?: number): number | this {
    if (max === undefined) {
      return this.maxVal;
    } else {
      this.maxVal = max;
      this.maxSet = true;
      return this;
    }
  }

  axis({label = this.label, ticks = this.ticks, format = this.axisFormat}): this {
    this.label = label;
    this.ticks = ticks;
    this.axisFormat = format;
    return this;
  }

  plot(svgElement: SVGSVGElement): void {
    const svg: PlotSelect = d3.select(svgElement).append("g");
    const x = this.scale.range([0, this.wdth]).domain([0, this.maxVal]);

    this.data.forEach((datum, i) => {
      const line = (svg.append("g") as PlotSelect)
        .attr("style", `transform: translateY(${i}em);`);
      datum.plot(line, x, this.format);
    });

    // axes
    const axisGroup = svg
      .append("g").classed("axis", true)
      .append("g").attr("style", `transform: translateY(${this.data.length - 1}.5em);`)
      .append("g").classed("x", true);
    const axisGen = (d3.axisBottom(x) as d3.Axis<number>)
      .tickSizeInner(-1).tickSizeOuter(0)
      .tickFormat(this.axisFormat)
      .tickValues([...new Set([0, this.maxVal].concat(this.ticks))]);
    (axisGroup.append("g") as AxisSelect)
      .classed("ticks", true)
      .call(axisGen);
    axisGroup.append("g")
      .classed("label", true)
      .attr("transform", `translate(${this.wdth / 2}, 0)`)
      .append("text")
      .text(this.label);
  }
}

export function comparison(width: number = 162) {
  return new Comparison(width);
}
