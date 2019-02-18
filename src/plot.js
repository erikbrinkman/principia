const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.dirname(__dirname);

function plot(name, input, output, style, shortHelp, longHelp) {
  const params = ['-i', input, '-o', output].concat(
    longHelp ? ['--help'] : [],
    shortHelp ? ['-h'] : [],
    ...style.map(sty => ['--css', sty]),
  );
  // XXX This is necessary because principia-plot may not be installed
  // where we want it. I could not find a better solution.
  const exec = [root, 'node_modules', '.bin', 'principia-plot'];
  while (!fs.existsSync(path.join(...exec))) {
    exec.splice(-3, 0, '..');
  }
  const env = JSON.parse(JSON.stringify(process.env));
  // eslint-disable-next-line no-underscore-dangle
  env.__PRINC_NAME__ = `${name} plot`;
  cp.execFileSync(path.join(...exec), params, { stdio: 'inherit', env });
}

module.exports = plot;
