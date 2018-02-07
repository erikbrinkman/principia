"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
// FIXME Add documentation
class CompData {
    constructor() {
        this.cls = "";
    }
    classed(cls) {
        if (cls === undefined) {
            return this.cls;
        }
        else {
            this.cls = cls;
            return this;
        }
    }
}
class Value extends CompData {
    constructor(label, value) {
        super();
        this.lab = label;
        this.val = value;
    }
    plot(elem, x, format) {
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
class Comparison {
    constructor(width) {
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
    value(label, value) {
        this.maxSet || (this.maxVal = Math.max(this.maxVal, value));
        const datum = new Value(label, value);
        this.data.push(datum);
        return datum;
    }
    width(width) {
        this.wdth = width;
        return this;
    }
    numberFormat(format) {
        this.format = format;
        return this;
    }
    max(max) {
        if (max === undefined) {
            return this.maxVal;
        }
        else {
            this.maxVal = max;
            this.maxSet = true;
            return this;
        }
    }
    axis({ label = this.label, ticks = this.ticks, format = this.axisFormat }) {
        this.label = label;
        this.ticks = ticks;
        this.axisFormat = format;
        return this;
    }
    plot(svgElement) {
        const svg = d3.select(svgElement).append("g");
        const x = this.scale.range([0, this.wdth]).domain([0, this.maxVal]);
        this.data.forEach((datum, i) => {
            const line = svg.append("g")
                .attr("style", `transform: translateY(${i}em);`);
            datum.plot(line, x, this.format);
        });
        // axes
        const axisGroup = svg
            .append("g").classed("axis", true)
            .append("g").attr("style", `transform: translateY(${this.data.length - 1}.5em);`)
            .append("g").classed("x", true);
        const axisGen = d3.axisBottom(x)
            .tickSizeInner(-1).tickSizeOuter(0)
            .tickFormat(this.axisFormat)
            .tickValues([...new Set([0, this.maxVal].concat(this.ticks))]);
        axisGroup.append("g")
            .classed("ticks", true)
            .call(axisGen);
        axisGroup.append("g")
            .classed("label", true)
            .attr("transform", `translate(${this.wdth / 2}, 0)`)
            .append("text")
            .text(this.label);
    }
}
exports.Comparison = Comparison;
function comparison(width = 162) {
    return new Comparison(width);
}
exports.comparison = comparison;
