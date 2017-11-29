import {} from "jest";
import * as cp from "child_process";
import * as fs from "fs";
import * as check from "./check";
import * as utils from "../src/utils";

/* XXX travis-ci generates pdfs differently, so we can't compare them to what
 * we generate. */

describe("Line Plot", () => {
  it("matches what we expect", () => {
    cp.execSync("node node_modules/headlesspdf/cmd.js -i test/line.ex.js -c test/line.ex.css");
  });
});

describe("Bar Plot", () => {
  it("matches what we expect", () => {
    cp.execSync("node node_modules/headlesspdf/cmd.js -i test/bar.ex.js -c test/bar.ex.css");
  });
});
