import fs from "fs-extra";
import os from "os";
import path from "path";

export function makeTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotproject-"));
  process.chdir(dir);
  return dir;
}