import { execaSync } from "execa";
import fs from "fs-extra";
import path from "path";
import os from "os";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dotproject-"));
}

describe("validate enforces date-time format", () => {
  it("fails on invalid date-time and passes on valid", () => {
    const cwd = tmpDir();
    // Copy schemas and create minimal .project
    fs.copySync(path.join(process.cwd(), 'schemas'), path.join(cwd, 'schemas'));
    fs.ensureDirSync(path.join(cwd, ".project", "stories"));

    const invalid = {
      id: "STORY-9999",
      title: "Dummy",
      uuid: "123e4567-e89b-12d3-a456-426614174000",
      status: "draft",
      created: "not-a-date",
      updated: "also-bad"
    };
    fs.writeJsonSync(path.join(cwd, ".project", "stories", "story-9999.json"), invalid, { spaces: 2 });

    let failed = false;
    try {
      execaSync("node", [path.join(process.cwd(), "bin/cli.js"), "validate"], { cwd, stdio: "pipe" });
    } catch (err) {
      failed = true;
      expect(String(err.stderr || err.stdout)).toMatch(/date-time/i);
    }
    expect(failed).toBe(true);

    // Fix the timestamps to valid RFC3339
    const valid = {
      ...invalid,
      created: "2025-10-26T21:50:00Z",
      updated: "2025-10-26T21:51:00Z"
    };
    fs.writeJsonSync(path.join(cwd, ".project", "stories", "story-9999.json"), valid, { spaces: 2 });

    // Should pass now
    const { stdout } = execaSync("node", [path.join(process.cwd(), "bin/cli.js"), "validate"], { cwd, stdio: "pipe" });
    expect(stdout).toMatch(/✅/); // keep consistent with existing success output
  });
});