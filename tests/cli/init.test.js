import fs from "fs-extra";
import path from "path";
import { jest } from '@jest/globals';
import init from "../../src/commands/init.js";
import { makeTempProject } from "../helpers/setup.js";

jest.mock('chalk', () => ({
  green: jest.fn(),
  red: jest.fn()
}));

describe("dot init", () => {
  it("creates a .project folder with base files", async () => {
    const cwd = makeTempProject();
    // Create .git to simulate a repo
    fs.mkdirSync(path.join(cwd, '.git'));
    // Change to the temp dir
    process.chdir(cwd);
    await init();
    const projectPath = path.join(cwd, ".project");
    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "stories"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "epics"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "docs"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "config.json"))).toBe(true);
  });
});