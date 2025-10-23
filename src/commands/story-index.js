import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { globby } from 'globby';
import { findProjectRoot } from '../utils/findProjectRoot.js';
import { sortKeys } from '../utils/jsonUtils.js';

/**
 * Index stories and epics into .project/index.json.
 */
export default async function storyIndex() {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const projectDir = path.join(root, '.project');
  const storiesDir = path.join(projectDir, 'stories');
  const epicsDir = path.join(projectDir, 'epics');

  const stories = [];
  const epics = [];

  // Load stories
  if (await fs.pathExists(storiesDir)) {
    const storyFiles = await globby('**/*.json', { cwd: storiesDir });
    for (const file of storyFiles) {
      const filePath = path.join(storiesDir, file);
      const data = await fs.readJson(filePath);
      stories.push({
        id: data.id,
        title: data.title,
        epic: data.epic,
        risk: data.risk,
        status: 'in_progress' // Assuming, or derive from data
      });
    }
  }

  // Load epics
  if (await fs.pathExists(epicsDir)) {
    const epicFiles = await globby('**/*.json', { cwd: epicsDir });
    for (const file of epicFiles) {
      const filePath = path.join(epicsDir, file);
      const data = await fs.readJson(filePath);
      epics.push({
        id: data.id,
        title: data.title
      });
    }
  }

  const indexData = {
    stories,
    epics,
    timestamp: new Date().toISOString()
  };

  const indexPath = path.join(projectDir, 'index.json');
  await fs.writeJson(indexPath, sortKeys(indexData), { spaces: 2 });

  console.log(chalk.green(`✅ Indexed ${stories.length} stories and ${epics.length} epics.`));
}