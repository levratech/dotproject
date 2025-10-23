import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { findProjectRoot } from '../utils/findProjectRoot.js';

/**
 * Initialize the .project folder in the repository root.
 * Creates necessary directories and a basic config.json file.
 */
export default async function init() {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const projectDir = path.join(root, '.project');
  await fs.ensureDir(projectDir);
  await fs.ensureDir(path.join(projectDir, 'stories'));
  await fs.ensureDir(path.join(projectDir, 'epics'));
  await fs.ensureDir(path.join(projectDir, 'docs'));

  const config = {
    name: 'My Project',
    version: '1.0.0',
    created: new Date().toISOString()
  };

  await fs.writeJson(path.join(projectDir, 'config.json'), config, { spaces: 2 });
  console.log(chalk.green('Initialized .project folder'));
}