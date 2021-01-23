// hot patch to disable isWsl
require('is-wsl');
const testWslPath = /\/is-wsl\//;
const paths = Object.keys(require.cache).filter((p) => testWslPath.test(p));
for (const path of paths) {
  require.cache[path].exports = false;
}

// real imports, must be after patch
const chromeLauncher = require('chrome-launcher');
const cp = require('child_process');
const chromeRemote = require('chrome-remote-interface');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const tempy = require('tempy');

async function pdf(input_path, output) {
  let input;
  if (input_path === 'stdin') {
    input = tempy.file({ extension: 'html' });
    fs.writeFileSync(input, fs.readFileSync(0, 'utf8'));
  } else {
    input = path.resolve(input_path);
  }
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu'],
    startingUrl: `file://${input}`,
  });
  const protocol = await chromeRemote({ port: chrome.port });
  const { Page, Runtime } = protocol;
  await Promise.all([Page.enable(), Runtime.enable()]);

  try {
    // await page load
    // Sometimes the promise fails, so we try with back off
    let description;
    for (let timeout = 1; timeout < 1000; timeout *= 2) {
      description = undefined;
      try {
        // eslint-disable-next-line no-await-in-loop
        const { result } = await Runtime.evaluate({
          expression: '__princ.rendered',
        });
        if (result.subtype === 'error') {
          throw new Error(result.description);
        }
        // eslint-disable-next-line no-await-in-loop
        ({
          result: { description },
        } = await Runtime.awaitPromise({
          promiseObjectId: result.objectId,
        }));
        break;
      } catch (err) {
        description = err;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, timeout));
      }
    }
    if (description !== undefined) {
      throw description;
    }

    const {
      result: {
        value: { width, height },
      },
    } = await Runtime.evaluate({
      expression:
        'rect = document.documentElement.getBoundingClientRect(); res = {width: rect.width, height: rect.height}',
      returnByValue: true,
    });
    const { data } = await Page.printToPDF({
      displayHeaderFooter: false,
      printBackground: true,
      paperWidth: width / 96.0,
      paperHeight: height / 96.0,
      pageRanges: '1',
    });

    const buff = new stream.Readable();
    buff._read = () => {}; // eslint-disable-line no-underscore-dangle
    buff.push(Buffer.from(data, 'base64'));
    buff.push(null);
    buff.pipe(
      output === 'stdout' ? process.stdout : fs.createWriteStream(output),
    );
  } finally {
    await protocol.close();
    await chrome.kill();
  }
}

module.exports = pdf;
