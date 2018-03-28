const cp = require('child_process');
const fs = require('fs');

const cmd = 'bin/cmd.js';
const comparisonz = 'test/comparisonz.ex.bachelor.json';
const evolution = 'test/evolution.ex.bachelor.json';
const evolutionSvg = 'test/evolution.ex.bachelor.svg';
const evolutionCss = 'test/evolution.ex.bachelor.css';
const evolutionAppend = 'test/evolution.ex.append.svg';
const evolutionHtml = 'test/evolution.ex.append.html';
const evolutionPdf = 'test/evolution.ex.append.pdf';

function execPipeSync(command, options) {
  return cp.execFileSync('bash', ['-euf', '-o', 'pipefail', '-c', command], options);
}

describe('plot', () => {
  it('works', () => {
    cp.execFileSync(cmd, ['plot', '-i', evolution, '-o', evolutionSvg]);
  });
});

describe('append', () => {
  it('works', () => {
    cp.execFileSync(cmd, ['append', evolutionCss, '-i', evolutionSvg, '-o', evolutionAppend]);
  });
});

describe('html', () => {
  it('works', () => {
    cp.execFileSync(cmd, ['html', '-i', evolutionAppend, '-o', evolutionHtml]);
  });
});

describe('pdf', () => {
  it('works', () => {
    cp.execFileSync(cmd, ['pdf', '-i', evolutionHtml, '-o', evolutionPdf]);
  });
});

describe('png', () => {
  it('works', () => {
    cp.execFileSync(cmd, ['png', '-i', evolutionPdf, '-o', 'test/evolution.ex.append.png']);
  });
});

describe('piping', () => {
  it('performs all actions in a pipe', () => {
    execPipeSync(`< ${evolution} ${cmd} plot | ${cmd} append ${evolutionCss} | ${cmd} html | ${cmd} pdf | ${cmd} png > test/evolution.ex.pipe.png`);
  });

  it('adjusts x axis all the way up', () => {
    execPipeSync(`< ${evolution} ${cmd} plot | ${cmd} append ${evolutionCss} | ${cmd} html --xaxis-label 0 | ${cmd} pdf > test/evolution.ex.xaxis.pdf`);
  });

  it('adjusts evolution appropriately', () => {
    const base = JSON.parse(fs.readFileSync(evolution));
    base.xaxis.ticks = [1980, 1985];
    base.yaxis.ticks.push(0.48);
    execPipeSync(`${cmd} plot | ${cmd} append ${evolutionCss} | ${cmd} html --label 0 --xaxis-ticks 2 --xaxis-label 0 --yaxis-ticks 0 --yaxis-label 0 | ${cmd} pdf > test/evolution.ex.adjust.pdf`, { input: JSON.stringify(base) });
  });

  it('adjusts comparisonz appropriately', () => {
    execPipeSync(`< ${comparisonz} ${cmd} plot | ${cmd} html --name 3 --num 3 | ${cmd} pdf > test/comparisonz.ex.adjust.pdf`);
  });

  it('handles long svg renders', () => {
    execPipeSync(`< test/long_render.json ${cmd} plot | ${cmd} append <(echo '.princ--point { display: none; }') | ${cmd} html --label 0 | ${cmd} pdf > test/long_render.pdf`);
  });
});
