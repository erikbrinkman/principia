import {} from "jest";
import * as assert from "assert";
import * as cp from "child_process";
import * as fs from "fs";

describe("Comparison Plot", () => {
  it("generates correct svg", () => {
    const out = cp.execSync("./bin/cmd.js -i test/compare.ex.json -c test/compare.ex.css", {
      "encoding": "utf-8",
    });
    assert(out.startsWith("<svg"));
    assert(out.endsWith("</style></svg>"));
  });
});
