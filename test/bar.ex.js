const princ = require('../lib/index');
const d3 = require('d3');

const plot = new princ.BarPlot()
  .min(0)
  .axis({label: 'Axis', ticks: [0.5]});
plot.section('A');
plot.bar('Label 1', 0.5);
plot.bar('Two', 0.8);
plot.section('Next');
plot.bar('3', 0.75);

const svg = document.body.appendChild(document.createElementNS(
  'http://www.w3.org/2000/svg', 'svg'));
plot.plot(svg);

const bbox = svg.getBBox();
svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
document.documentElement.style.width = bbox.width;
document.documentElement.style.height = bbox.height;
