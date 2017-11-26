import {} from "jest";
import * as cp from "child_process";
import * as backend from "../src/backend";
import * as curves from "../src/curves";
import * as rects from "../src/rects";


describe('principia', () => {
  it('executes the example', done => {
    cp.exec('node node_modules/headlesspdf/cmd.js -i test/ex.js -c test/ex.css',
      (err, stdout, stderr) => {
        if (err) {
          done.fail(stderr);
        } else {
          // FIXME Test stdout for appropriate elements?
          done();
        }
    });
  });
});
