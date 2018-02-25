"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
class EvolutionDatum {
    constructor() {
        this.cls = "";
        this.lab = "";
        this.cve = d3.curveCatmullRom;
        this.pnt = undefined;
    }
    /** FIXME */
    classed(cls) {
        if (cls === undefined) {
            return this.cls;
        }
        else {
            this.cls = cls;
            return this;
        }
    }
    /** FIXME */
    label(lab) {
        if (lab === undefined) {
            return this.lab;
        }
        else {
            // TODO Check certain things about labels, i.e. only whitespace is space
            this.lab = lab;
            return this;
        }
    }
    /** FIXME */
    curve(cve) {
        if (cve === undefined) {
            return this.cve;
        }
        else {
            this.cve = cve;
            return this;
        }
    }
    /** FIXME */
    point(pnt) {
        if (pnt === undefined) {
            return this.pnt;
        }
        else {
            this.pnt = pnt;
            return this;
        }
    }
}
exports.EvolutionDatum = EvolutionDatum;
class Line extends EvolutionDatum {
    constructor(data) {
        super();
        this.data = data;
    }
    target() {
        return this.data[this.data.length - 1][1];
    }
    plot(svg, x, y) {
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
                .attr("transform", ([px, py]) => `translate(${x(px)}, ${y(py)})`)
                .append("path")
                .attr("d", this.pnt);
        }
    }
}
class Span extends EvolutionDatum {
    constructor(data) {
        super();
        this.data = data;
    }
    target() {
        const [, low, high] = this.data[this.data.length - 1];
        return (low + high) / 2;
    }
    plot(svg, x, y) {
        // TODO Truncate data if it goes outside of bounds
        const path = d3.area()
            .x((d) => x(d[0]))
            .y0((d) => y(d[1]))
            .y1((d) => y(d[2]))
            .curve(this.cve)(this.data);
        if (path !== null) {
            svg.append("g").classed("span", true)
                .append("path").classed(this.cls, true)
                .attr("d", path);
        }
        if (this.pnt !== undefined) {
            const pointData = this.data.map(([x, y,]) => [x, y]).concat(this.data.map(([x, , y]) => [x, y]));
            svg.append("g").classed("point", true)
                .append("g").classed(this.cls, true)
                .selectAll("g").data(pointData).enter()
                .append("g")
                .attr("transform", ([px, py]) => `translate(${x(px)}, ${y(py)})`)
                .append("path")
                .attr("d", this.pnt);
        }
    }
}
class Evolution {
    constructor(width, height) {
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
    line(data) {
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
    span(data) {
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
    width(width) {
        this.wdth = width;
        return this;
    }
    height(height) {
        this.hght = height;
        return this;
    }
    xmin(min) {
        if (min === undefined) {
            return this.xMin;
        }
        else {
            this.xMin = min;
            this.xMinSet = true;
            return this;
        }
    }
    xmax(max) {
        if (max === undefined) {
            return this.xMax;
        }
        else {
            this.xMax = max;
            this.xMaxSet = true;
            return this;
        }
    }
    xbounds(bounds) {
        if (bounds === undefined) {
            return [this.xmin(), this.xmax()];
        }
        else {
            const [min, max] = bounds;
            return this.xmin(min).xmax(max);
        }
    }
    ymin(min) {
        if (min === undefined) {
            return this.yMin;
        }
        else {
            this.yMin = min;
            this.yMinSet = true;
            return this;
        }
    }
    ymax(max) {
        if (max === undefined) {
            return this.yMax;
        }
        else {
            this.yMax = max;
            this.yMaxSet = true;
            return this;
        }
    }
    ybounds(bounds) {
        if (bounds === undefined) {
            return [this.ymin(), this.ymax()];
        }
        else {
            const [min, max] = bounds;
            return this.ymin(min).ymax(max);
        }
    }
    xaxis({ label = this.xLabel, ticks = this.xTicks, format = this.xTickFormat, scale = this.xScale }) {
        this.xLabel = label;
        this.xTicks = ticks;
        this.xTickFormat = format;
        this.xScale = scale;
        return this;
    }
    yaxis({ label = this.yLabel, ticks = this.yTicks, format = this.yTickFormat, scale = this.yScale }) {
        this.yLabel = label;
        this.yTicks = ticks;
        this.yTickFormat = format;
        this.yScale = scale;
        return this;
    }
    plot(svgElement) {
        const svg = d3.select(svgElement).append("g");
        const x = this.xScale.range([0, this.wdth]).domain(this.xbounds());
        const y = this.yScale.range([this.hght, 0]).domain(this.ybounds());
        // axes
        const axisGroup = svg.append("g").classed("axis", true);
        const xAxisGen = d3.axisBottom(x)
            .tickFormat(this.xTickFormat)
            .tickSizeInner(-1).tickSizeOuter(0)
            .tickValues([...new Set(this.xbounds().concat(this.xTicks))]);
        const xAxisGroup = axisGroup
            .append("g").attr("transform", `translate(0, ${this.hght})`)
            .append("g").classed("x", true);
        xAxisGroup.append("g")
            .classed("ticks", true)
            .call(xAxisGen);
        xAxisGroup.append("g")
            .classed("label", true)
            .attr("transform", `translate(${this.wdth / 2}, 0)`)
            .append("text")
            .text(this.xLabel);
        const yAxisGroup = axisGroup.append("g").classed("y", true);
        const yAxisGen = d3.axisLeft(y)
            .tickSizeInner(-1).tickSizeOuter(0)
            .tickFormat(this.yTickFormat)
            .tickValues([...new Set(this.ybounds().concat(this.yTicks))]);
        yAxisGroup.append("g")
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
exports.Evolution = Evolution;
/** FIXME */
function evolution(width = 162, height = 100) {
    return new Evolution(width, height);
}
exports.evolution = evolution;
