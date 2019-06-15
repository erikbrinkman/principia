const fs = require('fs');

const delims = {',': true, '\t': true};

function parseArray(array) {
  console.error(array);
}

function parseJson(raw) {
  return JSON.parse(raw);
}

function parseSeperatedValue(raw) {
  const lines = raw.split('\n');
  const equalCounts = lines.map(line => {
    const counts = {};
    line.split('').filter(c => delims[c]).forEach(c => {
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }).reduce((a, b) => {
    const counts = {}
    Object.entries(a).forEach(([k, v]) => {
      if (v === b[k]) {
        counts[k] = v;
      }
    });
    return counts;
  });

  const possible = Object.keys(equalCounts);
  if (possible.length === 0) {
    throw Error('found no consistent delimteters');
  } else if (possible.length > 1) {
    // Could try parsing all
    console.error(`found several possible delimeters, choosing arbitrarily: ${possible.join('')}`);
  }
  const [delim] = possible;

  const array = lines.map(line => line.split(delim));
  return parseArray(array);
}

function parse(input, output) {
  const raw = fs.readFileSync(input === 'stdin' ? 0 : input, 'utf8').trim();

  let result;
  for (let meth of [parseJson, parseSeperatedValue]) {
    try {
      result = meth(raw);
      break;
    } catch (err) {
      console.error(err);
    }
  }
  result = ''; // FIXME Remove
  if (output === 'stdout') {
    fs.appendFileSync(1, result, 'utf-8');
  } else {
    fs.writeFileSync(output, result, 'utf-8');
  }
}

module.exports = parse;
