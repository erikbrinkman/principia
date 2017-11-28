import {} from "jest";
import * as cp from "child_process";
import * as diff from "diff";
import * as fs from "fs";
import * as check from "./check";
import * as utils from "../src/utils";


describe('principia', () => {
  it('executes the example', done => {
    cp.exec('node node_modules/headlesspdf/cmd.js -i test/ex.js -c test/ex.css',
      (err, stdout, stderr) => {
        if (err) {
          done.fail(stderr);
        } else {
          const expected = fs.readFileSync("test/ex.pdf", "utf8");
          const differ = diff.diffChars(expected, stdout);
          const total = utils.sum(differ.map(d => d.count));
          const changed = utils.sum(differ.filter(d => d.added || d.removed).map(d => d.count));
          check(changed / total < 0.001);
          done();
        }
    });
  });
});
