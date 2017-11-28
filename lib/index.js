"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const backend = require("./backend");
function getBBox(svgElement, element) {
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
class LinePlotElement {
    constructor() {
        this._class = "";
        this._label = "";
        this._curve = d3.curveCatmullRom;
        this._point = undefined;
    }
    classed(cls) {
        if (cls === undefined) {
            return this._class;
        }
        else {
            this._class = cls;
            return this;
        }
    }
    label(lab) {
        if (lab === undefined) {
            return this._label;
        }
        else {
            // TODO Check certain things about labels, i.e. only whitespace is space
            this._label = lab;
            return this;
        }
    }
    curve(cve) {
        if (cve === undefined) {
            return this._curve;
        }
        else {
            this._curve = cve;
            return this;
        }
    }
    point(pt) {
        if (pt === undefined) {
            return this._point;
        }
        else {
            this._point = pt;
            return this;
        }
    }
}
class Line extends LinePlotElement {
    constructor(data) {
        super();
        this._data = data;
    }
    target() {
        return this._data[this._data.length - 1][1];
    }
    plot(svg, x, y) {
        // TODO Truncate data if it goes outside of bounds
        const path = d3.line()
            .x(d => x(d[0]))
            .y(d => y(d[1]))
            .curve(this._curve)(this._data);
        if (path !== null) {
            svg.append("g").classed("line", true)
                .append("path").classed(this._class, true)
                .attr("d", path);
        }
        if (this._point !== undefined) {
            svg.append("g").classed("point", true)
                .append("g").classed(this._class, true)
                .selectAll("path").data(this._data).enter()
                .append("path")
                .attr("transform", ([px, py]) => `translate(${x(px)}, ${y(py)})`)
                .attr("d", this._point);
        }
    }
}
class Area extends LinePlotElement {
    constructor(data) {
        super();
        this._data = data;
    }
    target() {
        const [, low, high] = this._data[this._data.length - 1];
        return (low + high) / 2;
    }
    plot(svg, x, y) {
        // TODO Truncate data if it goes outside of bounds
        const path = d3.area()
            .x(d => x(d[0]))
            .y0(d => y(d[1]))
            .y1(d => y(d[2]))
            .curve(this._curve)(this._data);
        if (path !== null) {
            svg.append("g").classed("area", true)
                .append("path").classed(this._class, true)
                .attr("d", path);
        }
        if (this._point !== undefined) {
            const pointData = this._data.map(([x, y,]) => [x, y]).concat(this._data.map(([x, , y]) => [x, y]));
            svg.append("g").classed("point", true)
                .append("g").classed(this._class, true)
                .selectAll("path").data(pointData).enter()
                .append("path")
                .attr("transform", ([px, py]) => `translate(${x(px)}, ${y(py)})`)
                .attr("d", this._point);
        }
    }
}
class LinePlot {
    constructor(width = 162, height = 100) {
        this._width = width;
        this._height = height;
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
    line(data, options = {}) {
        const { x = (d, _) => d[0], y = (d, _) => d[1], } = options;
        const line = new Line(data.map((d, i) => {
            const xi = x(d, i);
            const yi = y(d, i);
            this._xMinSet || (this._xMin = Math.min(this._xMin, xi));
            this._xMaxSet || (this._xMax = Math.max(this._xMax, xi));
            this._yMinSet || (this._yMin = Math.min(this._yMin, yi));
            this._yMaxSet || (this._yMax = Math.max(this._yMax, yi));
            return [xi, yi];
        }));
        this._lines.push(line);
        return line;
    }
    area(data, options = {}) {
        const { x = (d, _) => d[0], y0 = (d, _) => d[1], y1 = (d, _) => d[2], } = options;
        const area = new Area(data.map((d, i) => {
            const xi = x(d, i);
            const y0i = y0(d, i);
            const y1i = y1(d, i);
            this._xMinSet || (this._xMin = Math.min(this._xMin, xi));
            this._xMaxSet || (this._xMax = Math.max(this._xMax, xi));
            this._yMinSet || (this._yMin = Math.min(this._yMin, y0i, y1i));
            this._yMaxSet || (this._yMax = Math.max(this._yMax, y0i, y1i));
            return [xi, y0i, y1i];
        }));
        this._lines.push(area);
        return area;
    }
    width(width) {
        if (width === undefined) {
            return this._width;
        }
        else {
            this._width = width;
            return this;
        }
    }
    height(height) {
        if (height === undefined) {
            return this._height;
        }
        else {
            this._height = height;
            return this;
        }
    }
    xmin(min) {
        if (min === undefined) {
            return this._xMin;
        }
        else {
            this._xMin = min;
            this._xMinSet = true;
            return this;
        }
    }
    xmax(max) {
        if (max === undefined) {
            return this._xMax;
        }
        else {
            this._xMax = max;
            this._xMaxSet = true;
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
            return this._yMin;
        }
        else {
            this._yMin = min;
            this._yMinSet = true;
            return this;
        }
    }
    ymax(max) {
        if (max === undefined) {
            return this._yMax;
        }
        else {
            this._yMax = max;
            this._yMaxSet = true;
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
    xlabel(label, options = {}) {
        const { below = this._xLabelBelow } = options;
        this._xLabel = label;
        this._xLabelBelow = below;
        return this;
    }
    ylabel(label) {
        this._yLabel = label;
        return this;
    }
    xticks(ticks, options = {}) {
        const { padding = this._xTickPadding } = options;
        this._xTicks = ticks;
        this._xTickPadding = padding;
        return this;
    }
    yticks(ticks, options = {}) {
        const { padding = this._yTickPadding } = options;
        this._yTicks = ticks;
        this._yTickPadding = padding;
        return this;
    }
    labels(options = {}) {
        // TODO This should be possible in one line, but seems like a bug
        const { buffer = this._labelBuffer } = options;
        this._labelBuffer = buffer;
        return this;
    }
    plot(svgElement) {
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
        const labelLines = this._lines.filter(line => line.label().length > 0);
        const labels = labelLines.map(line => labelGroup
            .append("text")
            .classed(line.classed(), true)
            .text(line.label()));
        // lines
        this._lines.forEach(line => line.plot(svg, x, y));
        // space apart y ticks
        const yTicks = yAxis.selectAll("text").nodes();
        const yTickSpaces = yTicks.map(tick => {
            const box = getBBox(svgElement, tick);
            return [box.y - this._yTickPadding, box.height + 2 * this._yTickPadding];
        });
        const newYs = backend.space1(yTickSpaces);
        yTicks.forEach((tick, i) => {
            tick.setAttribute("y", (parseFloat(tick.getAttribute("y") || "0") + newYs[i] - yTickSpaces[i][0]).toString());
        });
        // space apart x ticks
        const xTicks = xAxis.selectAll("text").nodes();
        const xTickSpaces = xTicks.map(tick => {
            const box = getBBox(svgElement, tick);
            return [box.x - this._xTickPadding, box.width + 2 * this._xTickPadding];
        });
        const newXs = backend.space1(xTickSpaces);
        xTicks.forEach((tick, i) => {
            tick.setAttribute("x", (parseFloat(tick.getAttribute("x") || "0") + newXs[i] - xTickSpaces[i][0]).toString());
        });
        // align x axis label
        const xBoxes = xTicks.map(tick => getBBox(svgElement, tick)).sort((a, b) => a.x - b.x);
        const xLabelBox = xAxisLabel.node().getBBox();
        const [xSmall, xLarge] = xBoxes.slice(0, -1)
            .map((bi, i) => [bi.x + bi.width, xBoxes[i + 1].x])
            .reduce((l, e) => e[1] - e[0] > l[1] - l[0] ? e : l, [0, 0]);
        if (this._xLabelBelow || xLarge - xSmall < xLabelBox.width) {
            const y = Math.max(...xBoxes.map(d => d.y + d.height));
            xAxisLabel
                .attr("x", this._width / 2)
                .attr("y", y + xLabelBox.height);
        }
        else {
            const y = Math.min(...xBoxes.map(d => d.y));
            xAxisLabel
                .attr("x", (xLarge + xSmall) / 2)
                .attr("y", y + xLabelBox.height);
        }
        // align y axis label
        const topYBBox = getBBox(svgElement, yAxis.selectAll("text").nodes()[1]);
        yAxisLabel.attr("x", topYBBox.x).attr("y", topYBBox.y);
        // align line labels
        if (labels.length > 0) {
            const targets = labelLines.map(line => y(line.target()));
            const input = labels.map((label, i) => {
                const height = label.node().getBBox().height;
                return [targets[i] - height / 2, height];
            });
            const pos = backend.space1(input);
            labels.forEach((label, i) => {
                label.attr("x", this._width + this._labelBuffer).attr("y", pos[i] + input[i][1]);
            });
        }
    }
}
exports.LinePlot = LinePlot;
class BarPlotElement {
    constructor() {
        this._class = "";
    }
    classed(clas) {
        if (clas === undefined) {
            return this._class;
        }
        else {
            this._class = clas;
            return this;
        }
    }
}
class Bar extends BarPlotElement {
    constructor(label, value) {
        super();
        this._label = label;
        this._value = value;
    }
    plot(elem, x, y, barWidth, labelPadding, showNums, numPadding) {
        elem.classed("bar", true);
        elem.append("g").classed("val", true)
            .append("rect").classed(this._class, true)
            .attr("x", x.range()[0])
            .attr("y", y * (1 - barWidth) / 2)
            .attr("width", x(this._value))
            .attr("height", y * (1 + barWidth) / 2);
        elem.append("g").classed("label", true)
            .append("text").classed(this._class, true)
            .attr("x", -labelPadding)
            .attr("y", y / 2)
            .style("text-anchor", "end")
            .style("alignment-baseline", "central")
            .text(this._label);
        if (showNums) {
            elem.append("g").classed("num", true)
                .append("text").classed(this._class, true)
                .attr("x", x.range()[x.range().length - 1] + numPadding)
                .attr("y", y / 2)
                .style("alignment-baseline", "central")
                .text(this._value);
        }
    }
}
class Section extends BarPlotElement {
    constructor(label) {
        super();
        this._label = label;
    }
    plot(elem, _x, y, _barWidth, labelPadding, _showNums, _numPadding) {
        elem.classed("section", true)
            .append("g").classed("label", true)
            .append("text").classed(this._class, true)
            .attr("x", -labelPadding)
            .attr("y", y)
            .style("text-anchor", "end")
            .text(this._label);
    }
}
var Align;
(function (Align) {
    Align[Align["Left"] = 0] = "Left";
    Align[Align["Middle"] = 1] = "Middle";
    Align[Align["Right"] = 2] = "Right";
})(Align = exports.Align || (exports.Align = {}));
class BarPlot {
    constructor(width = 162, lineHeight = 12) {
        this._width = width;
        this._lineHeight = lineHeight;
        this._bars = [];
        // Bounds
        this._min = Infinity;
        this._minSet = false;
        this._max = -Infinity;
        this._maxSet = false;
        this._scale = d3.scaleLinear();
        this._barWidth = 0.8;
        this._labelPadding = lineHeight / 5;
        this._labelAlign = Align.Right;
        this._sectAlign = Align.Left;
        // Numbers
        this._showNums = true;
        this._numPadding = lineHeight / 5;
        this._numAlign = Align.Right;
        // Axis
        this._showAxis = false;
        this._labelBelow = false;
        this._label = "";
        this._ticks = [];
        this._tickPadding = lineHeight / 5;
    }
    bar(label, value) {
        this._minSet || (this._min = Math.min(this._min, value));
        this._maxSet || (this._max = Math.max(this._max, value));
        const bar = new Bar(label, value);
        this._bars.push(bar);
        return bar;
    }
    section(label) {
        const section = new Section(label);
        this._bars.push(section);
        return section;
    }
    width(width) {
        this._width = width;
        return this;
    }
    lineHeight(lineHeight) {
        this._lineHeight = lineHeight;
        return this;
    }
    barWidth(width) {
        this._barWidth = width;
        return this;
    }
    labelPadding(padding) {
        this._labelPadding = padding;
        return this;
    }
    labelAlign(align) {
        this._labelAlign = align;
        return this;
    }
    sectionAlign(align) {
        this._sectAlign = align;
        return this;
    }
    min(min) {
        if (min === undefined) {
            return this._min;
        }
        else {
            this._min = min;
            this._minSet = true;
            return this;
        }
    }
    max(max) {
        if (max === undefined) {
            return this._max;
        }
        else {
            this._max = max;
            this._maxSet = true;
            return this;
        }
    }
    bounds(bounds) {
        if (bounds === undefined) {
            return [this.min(), this.max()];
        }
        else {
            const [min, max] = bounds;
            return this.min(min).max(max);
        }
    }
    nums({ numPadding = this._numPadding, numAlign = this._numAlign }) {
        this._showNums = true;
        this._showAxis = false;
        this._numPadding = numPadding;
        this._numAlign = numAlign;
        return this;
    }
    axis({ label = this._label, ticks = this._ticks, labelBelow = this._labelBelow, tickPadding = this._tickPadding }) {
        this._showNums = false;
        this._showAxis = true;
        this._label = label;
        this._ticks = ticks;
        this._labelBelow = labelBelow;
        this._tickPadding = tickPadding;
        return this;
    }
    align(svg, select, align) {
        const info = select.nodes().map(n => {
            const bbox = getBBox(svg, n);
            return [bbox.x, bbox.width];
        });
        switch (align) {
            case Align.Left: {
                const min = Math.min(...info.map(([x,]) => x));
                select.data(info).attr("transform", ([x,]) => `translate(${min - x}, 0)`);
                break;
            }
            case Align.Middle: {
                const min = Math.min(...info.map(([x,]) => x));
                const max = Math.max(...info.map(([x, width]) => x + width));
                const center = (min + max) / 2;
                select.data(info).attr("transform", ([x, width]) => `translate(${center - x - width / 2}, 0)`);
                break;
            }
            case Align.Right: {
                const max = Math.max(...info.map(([x, width]) => x + width));
                select.data(info).attr("transform", ([x, width]) => `translate(${max - x - width}, 0)`);
                break;
            }
            default:
                throw Error(`unknown alignment: "${align}"`);
        }
    }
    plot(svgElement) {
        const svg = d3.select(svgElement).append("g");
        svg.append("style").text(`svg { font-size: ${this._lineHeight}; }`);
        const x = this._scale.range([0, this._width]).domain([this._min, this._max]);
        let h = 0;
        this._bars.forEach(bar => {
            const group = svg.append("g").attr("transform", `translate(0, ${h})`);
            bar.plot(group, x, this._lineHeight, this._barWidth, this._labelPadding, this._showNums, this._numPadding);
            h += this._lineHeight;
        });
        // align
        this.align(svgElement, svg.selectAll(".bar .label"), this._labelAlign);
        if (this._showNums) {
            this.align(svgElement, svg.selectAll(".bar .num"), this._numAlign);
        }
        switch (this._sectAlign) {
            case Align.Left: {
                const min = Math.min(...svg.selectAll(".bar .label").nodes().map(n => getBBox(svgElement, n).x));
                const select = svg.selectAll(".section .label");
                const info = select.nodes().map(n => getBBox(svgElement, n).x);
                select.data(info).attr("transform", x => `translate(${min - x}, 0)`);
                break;
            }
            case Align.Middle: {
                const boxes = svg.selectAll(".bar").nodes().map(n => {
                    const bbox = getBBox(svgElement, n);
                    return [bbox.x, bbox.width];
                });
                const min = Math.min(...boxes.map(([x,]) => x));
                const max = Math.max(...boxes.map(([x, w]) => x + w));
                const center = (min + max) / 2;
                const select = svg.selectAll(".section .label");
                const info = select.nodes().map(n => {
                    const bbox = getBBox(svgElement, n);
                    return bbox.x + bbox.width / 2;
                });
                select.data(info).attr("transform", c => `translate(${center - c}, 0)`);
                break;
            }
            case Align.Right: {
                // Do nothing, automatically right aligned
                break;
            }
            default:
                throw Error(`unknown alignment: "${this._sectAlign}"`);
        }
        // axes
        if (this._showAxis) {
            const axisGroup = svg.append("g").classed("axis", true);
            const axisGen = d3.axisBottom(x)
                .tickSizeInner(-2).tickSizeOuter(0).tickPadding(5)
                .tickValues([...new Set([this._min, this._max].concat(this._ticks))]);
            const axis = axisGroup.append("g")
                .classed("ticks", true)
                .attr("transform", `translate(0, ${h + 5})`)
                .call(axisGen);
            const axisLabel = axisGroup.append("g")
                .classed("label", true)
                .append("text")
                .style("text-anchor", "middle")
                .text(this._label);
            // space apart x ticks
            const ticks = axis.selectAll("text").nodes();
            const tickSpaces = ticks.map(tick => {
                const box = getBBox(svgElement, tick);
                return [box.x - this._tickPadding, box.width + 2 * this._tickPadding];
            });
            const newXs = backend.space1(tickSpaces);
            // TODO Do this with a d3 selection
            ticks.forEach((tick, i) => {
                // FIXME Remove all setAttribute in favor of d3 Selection
                tick.setAttribute("x", (parseFloat(tick.getAttribute("x") || "0") + newXs[i] - tickSpaces[i][0]).toString());
            });
            // align x axis label
            const boxes = ticks.map(tick => getBBox(svgElement, tick)).sort((a, b) => a.x - b.x);
            const labelBox = axisLabel.node().getBBox();
            const [small, large] = boxes.slice(0, -1)
                .map((bi, i) => [bi.x + bi.width, boxes[i + 1].x])
                .reduce((l, e) => e[1] - e[0] > l[1] - l[0] ? e : l, [0, 0]);
            if (this._labelBelow || large - small < labelBox.width) {
                const y = Math.max(...boxes.map(d => d.y + d.height));
                axisLabel
                    .attr("x", this._width / 2)
                    .attr("y", y + labelBox.height);
            }
            else {
                const y = Math.min(...boxes.map(d => d.y));
                axisLabel
                    .attr("x", (large + small) / 2)
                    .attr("y", y + labelBox.height);
            }
        }
    }
}
exports.BarPlot = BarPlot;
