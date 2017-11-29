const princ = require('../lib/index');
const d3 = require('d3');

const plot = new princ.LinePlot()
  .xaxis({label: 'X', ticks: [1]})
  .yaxis({label: 'Y', ticks: [2], format: d3.format('.2r')})
  .labels({buffer: 2});
plot.area([[0, 0, 0],
           [1, 1, 3],
           [2, 5, 6],
           [3, 2, 2]])
  .classed('ar')
  .curve(d3.curveNatural)
  .point(d3.symbol().size(2).type(d3.symbolTriangle));
plot.line([[0, 0],
           [1, 2],
           [2, 6],
           [3, 4]])
  .classed('ex')
  .curve(d3.curveCatmullRom)
  .point(d3.symbol().size(3))
  .label('Label');
const svg = document.body.appendChild(document.createElementNS(
  'http://www.w3.org/2000/svg', 'svg'));
plot.plot(svg);

const bbox = svg.getBBox();
svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
document.documentElement.style.width = bbox.width;
document.documentElement.style.height = bbox.height;
