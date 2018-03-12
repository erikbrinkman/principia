import {} from "jest";
import * as assert from "assert";
import * as cp from "child_process";
import * as fs from "fs";

describe("Evolution Plot", () => {
  it("generates correct svg", () => {
    const out = cp.execSync("./bin/cmd.js -i test/evolution.ex.linear.json -c test/evolution.ex.css", {
      "encoding": "utf-8",
    });
    assert(out.startsWith("<svg"));
    assert(out.endsWith("</style></svg>"));
  });

  it("generates correct log svg", () => {
    const out = cp.execSync("./bin/cmd.js -i test/evolution.ex.log.json -c test/evolution.ex.css", {
      "encoding": "utf-8",
    });
    assert(out.startsWith("<svg"));
    assert(out.endsWith("</style></svg>"));
  });
});
