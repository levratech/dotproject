import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { globby } from 'globby';
import { findProjectRoot } from '../utils/findProjectRoot.js';
import { sortKeys } from '../utils/jsonUtils.js';

/**
 * Canonicalize JSON files in .project/.
 */
export default async function canonicalize() {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const projectDir = path.join(root, '.project');
  const files = await globby('**/*.json', { cwd: projectDir, ignore: ['atlas/**'] });

  let count = 0;
  for (const file of files) {
    const filePath = path.join(projectDir, file);
    const data = await fs.readJson(filePath);
    const canonical = JSON.stringify(sortKeys(data), null, 2) + '\n';
    await fs.writeFile(filePath, canonical);
    count++;
  }

  console.log(chalk.green(`✅ Canonicalized ${count} files.`));
}