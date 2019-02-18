const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const tempy = require('tempy');
const uglifyes = require('uglify-es');

const resources = path.join(path.dirname(__dirname), 'resources');

function html(input, output, args) {
  const cleancss = new CleanCSS();
  const svg = fs.readFileSync(input === 'stdin' ? 0 : input, 'utf8').trim();
  if (!svg.startsWith('<svg')) {
    throw Error('an svg must start with "<svg"');
  }
  // TODO Make these async
  const style = cleancss.minify(
    fs.readFileSync(path.join(resources, 'style.css'), 'utf8'),
  ).styles;
  const quadprog = uglifyes.minify(
    fs.readFileSync(path.join(resources, 'quadprog.js'), 'utf8'),
  ).code;
  const preScript = uglifyes.minify(
    fs.readFileSync(path.join(resources, 'pre_script.js'), 'utf8'),
  ).code;
  const postScript = uglifyes.minify(
    fs.readFileSync(path.join(resources, 'post_script.js'), 'utf8'),
  ).code;

  const buff = new stream.Readable();
  buff._read = () => {}; // eslint-disable-line no-underscore-dangle
  buff.push('<!doctype html><html><head><script>');
  buff.push(
    'window.__princ={};__princ.rendered=new Promise((res,rej)=>{__princ.res=res;__princ.rej=rej;});',
  );
  buff.push('</script><style>');
  buff.push(style);
  buff.push('</style></head><body>');
  buff.push(svg);
  buff.push('<script>"use strict";addEventListener("load", async () => {try{');
  buff.push(quadprog);
  buff.push(preScript);

  // Optional alignment
  if (args.name !== undefined) {
    buff.push(`await alignComparisonZNames(${args.name});`);
  }
  if (args.num !== undefined) {
    buff.push(`await alignComparisonZNums(${args.num});`);
  }
  if (args.label !== undefined) {
    buff.push(`await spaceApartEvolutionLabels(${args.label});`);
  }
  if (args['yaxis-ticks'] !== undefined) {
    buff.push(`await spaceApartYAxisTickLabels(${args['yaxis-ticks']});`);
  }
  if (args['yaxis-label'] !== undefined) {
    buff.push(`await alignYAxisLabel(${args['yaxis-label']});`);
  }
  if (args['xaxis-ticks'] !== undefined) {
    buff.push(`await spaceApartXAxisTickLabels(${args['xaxis-ticks']});`);
  }
  if (args['xaxis-label'] !== undefined) {
    buff.push(`await alignXAxisLabel(${args['xaxis-label']}, true);`);
  }

  buff.push(postScript);
  buff.push(
    '}catch(err){__princ.rej(err);return;};__princ.res();});</script></body></html>',
  );
  buff.push(null);
  buff.pipe(
    args.output === 'stdout'
      ? process.stdout
      : fs.createWriteStream(args.output),
  );
}

module.exports = html;
