"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const backend = require("./backend");
// FIXME Make implement interface
class Line {
    constructor(data) {
        this._data = data;
        this._class = "";
        this._label = "";
        this._curve = d3.curveLinear;
        this._point = undefined;
    }
    data() {
        return this._data;
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
class LinePlot {
    constructor(width, height) {
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
    line(data, options = {}) {
        const { x = (d, i) => d[0], y = (d, i) => d[1], } = options;
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
            this.xmin(min).xmax(max);
            return this;
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
            this.ymin(min).ymax(max);
            return this;
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
        /** Returns bbox without transformations */
        function getBBox(element) {
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
        // TODO Truncate data if it goes outside of bounds
        this._lines.forEach(line => {
            const path = d3.line()
                .x(d => x(d[0]))
                .y(d => y(d[1]))
                .curve(line.curve())(line.data());
            if (path !== null) {
                svg.append("g").classed("line", true)
                    .append("path").classed(line.classed(), true)
                    .attr("d", path.toString());
            }
            const point = line.point();
            if (point !== undefined) {
                svg.append("g").classed("point", true)
                    .append("g").classed(line.classed(), true)
                    .selectAll("path").data(line.data()).enter()
                    .append("path")
                    .attr("transform", ([px, py]) => `translate(${x(px)}, ${y(py)})`)
                    .attr("d", point.toString());
            }
        });
        // space apart y ticks
        const yTicks = yAxis.selectAll("text").nodes();
        const yTickSpaces = yTicks.map(tick => {
            const box = getBBox(tick);
            return [box.y - this._yTickPadding, box.height + 2 * this._yTickPadding];
        });
        const newYs = backend.space1(yTickSpaces);
        yTicks.forEach((tick, i) => {
            tick.setAttribute("y", (parseFloat(tick.getAttribute("y") || "0") + newYs[i] - yTickSpaces[i][0]).toString());
        });
        // space apart x ticks
        const xTicks = xAxis.selectAll("text").nodes();
        const xTickSpaces = xTicks.map(tick => {
            const box = getBBox(tick);
            return [box.x - this._xTickPadding, box.width + 2 * this._xTickPadding];
        });
        const newXs = backend.space1(xTickSpaces);
        xTicks.forEach((tick, i) => {
            tick.setAttribute("x", (parseFloat(tick.getAttribute("x") || "0") + newXs[i] - xTickSpaces[i][0]).toString());
        });
        // align x axis label
        const xBoxes = xTicks.map(tick => getBBox(tick)).sort((a, b) => a.x - b.x);
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
        const topYBBox = getBBox(yAxis.selectAll("text").nodes()[1]);
        yAxisLabel.attr("x", topYBBox.x).attr("y", topYBBox.y);
        // FIXME Only align non empty labels
        // align line labels
        if (this._lines.some(line => line.label().length > 0)) {
            const targets = this._lines.map(line => y(line.data()[line.data().length - 1][1]));
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
