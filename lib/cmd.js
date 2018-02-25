#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const fs = require("fs");
const yargs = require("yargs");
const evolution_1 = require("./evolution");
const comparison_1 = require("./comparison");
const jsdom_1 = require("jsdom");
// TODO At each branch choose between defined type specifications
// Curves
const curves = {
    "linear": d3.curveLinear,
    "step": d3.curveStep,
    "step_before": d3.curveStepBefore,
    "step_after": d3.curveStepAfter,
    "basis": d3.curveBasis,
    "cardinal": d3.curveCardinal,
    "monotone": d3.curveMonotoneX,
    "catmull_rom": d3.curveCatmullRom,
};
// Symbols
const symbols = {
    "circle": d3.symbolCircle,
    "cross": d3.symbolCross,
    "diamond": d3.symbolDiamond,
    "square": d3.symbolSquare,
    "star": d3.symbolStar,
    "triangle": d3.symbolTriangle,
    "wye": d3.symbolWye,
};
// Symbols
const scales = {
    "linear": d3.scaleLinear(),
    "log": d3.scaleLog(),
    "sqrt": d3.scaleSqrt(),
};
// Dict of plotting evolution types
const evoDatum = {
    "line": (plot, data) => plot.line(data),
    "span": (plot, data) => plot.span(data),
};
// Rendering functions
function evo(config, svg) {
    config.xaxis = config.xaxis || {};
    config.yaxis = config.yaxis || {};
    config.xaxis.format = d3.format(config.xaxis.format || "");
    config.yaxis.format = d3.format(config.yaxis.format || "");
    config.xaxis.scale = scales[config.xaxis.scale || "linear"];
    config.yaxis.scale = scales[config.yaxis.scale || "linear"];
    const plot = evolution_1.evolution(config.width || 162, config.height || 100)
        .xaxis(config.xaxis).yaxis(config.yaxis);
    config.xaxis.min === undefined || plot.xmin(config.xaxis.min);
    config.xaxis.max === undefined || plot.xmax(config.xaxis.max);
    config.yaxis.min === undefined || plot.ymin(config.yaxis.min);
    config.yaxis.max === undefined || plot.ymax(config.yaxis.max);
    config.data.forEach((datum) => {
        const dat = evoDatum[datum.type](plot, datum.data)
            .label(datum.label || "")
            .classed(datum.class || "")
            .curve(curves[datum.curve || "catmull_rom"]);
        datum.point === undefined || dat.point(d3.symbol().size(1).type(symbols[datum.point]));
    });
    plot.plot(svg);
}
function comp(config, svg) {
    config.axis = config.axis || {};
    config.axis.format = d3.format(config.axis.format || "");
    const plot = comparison_1.comparison(config.width || 162)
        .numberFormat(d3.format(config.format || ""))
        .axis(config.axis);
    config.axis.max === undefined || plot.max(config.axis.max);
    config.data.forEach((datum) => {
        const { name, value } = datum;
        plot.value(name, value).classed(datum.class || "");
    });
    plot.plot(svg);
}
const funcs = {
    "evolution": evo,
    "comparison": comp,
};
// Default style
const styleTexts = [`
svg {
  font-family: sans-serif;
  font-size: 14px;
}

.axis line, .axis path {
  stroke: #8a8a8a;
}

.axis text {
  fill: #8a8a8a;
}

.span path {
  stroke: none;
  fill: black;
  fill-opacity: 0.2;
}

.line path {
  fill: none;
  stroke: black;
  stroke-width: 2px;
}

.point path {
  fill: white;
  stroke: black;
  stroke-width: calc(2 / 3);
  transform: scale(3);
}

.value rect {
  font-size: 0.8em;
  fill-opacity: 0.2;
}

.name text {
  dominant-baseline: central;
  font-size: 0.8em;
}

.num text {
  dominant-baseline: central;
  text-anchor: end;
  font-size: 0.8em;
}

.axis .x {
  transform: translateY(5px);
}

.axis .x .tick text {
  transform: translateY(1px);
}

.axis .x .tick line {
  transform: scaleY(2);
}

.axis .x .label text {
  text-anchor: middle;
  dominant-baseline: hanging;
  transform: translateY(14px);
}

.axis .y {
  transform: translateX(-5px);
}

.axis .y .tick line {
  transform: scaleX(2.5);
}

.axis .y .label text {
  transform: translateY(-3px);
}

.data .label text {
  dominant-baseline: central;
  transform: translateX(3px);
}

.tick {
  font-size: 11px;
}

.label {
}`];
const args = yargs
    .option("input", {
    "alias": "i",
    "default": 0,
    "describe": "Take input json from file",
})
    .option("output", {
    "alias": "o",
    "default": "/dev/stdout",
    "describe": "Output svg to file",
})
    .option("style", {
    "alias": ["css", "c", "s"],
    "array": true,
    "default": [],
    "describe": "Add files as css styling for svg",
})
    .option("view-box", {
    "nargs": 4,
    "default": [-100, -100, 400, 400],
    "number": true,
    "describe": "Set the svg viewBox property",
})
    .help()
    .alias("version", "V")
    .alias("help", "h")
    .argv;
const config = JSON.parse(fs.readFileSync(args.input, { encoding: "utf-8" }));
const dom = new jsdom_1.JSDOM();
const { window } = dom;
const { document } = window;
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("viewBox", args.viewBox.join(" "));
args.style.forEach((cssFile) => {
    styleTexts.push(fs.readFileSync(cssFile, { encoding: "utf-8" }));
});
funcs[config.type](config, svg);
const style = document.createElement("style");
style.textContent = styleTexts.map(t => t.replace(/\s+/g, " ")).join(" ");
svg.appendChild(style);
if (args.output === "/dev/stdout") {
    fs.appendFileSync(1, svg.outerHTML);
}
else {
    fs.writeFileSync(args.output, svg.outerHTML);
}
