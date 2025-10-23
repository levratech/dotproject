import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import crypto from 'crypto';
import inquirer from 'inquirer';
import { findProjectRoot } from '../utils/findProjectRoot.js';

/**
 * Create a new story in the .project/stories directory.
 * Prompts for title, risk, and epic, then generates a ST-XXXX.json file.
 */
export default async function storyNew() {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a project.'));
    process.exit(1);
  }

  const answers = await inquirer.prompt([
    { type: 'input', name: 'title', message: 'Story title:' },
    { type: 'input', name: 'risk', message: 'Risk level:' },
    { type: 'input', name: 'epic', message: 'Epic:' }
  ]);

  const storiesDir = path.join(root, '.project', 'stories');
  await fs.ensureDir(storiesDir);

  // Find the next story number
  const files = await fs.readdir(storiesDir);
  const nums = files
    .map(f => parseInt(f.match(/ST-(\d+)\.json/)?.[1] || '0'))
    .filter(n => !isNaN(n));
  const nextNum = Math.max(0, ...nums) + 1;
  const id = `ST-${nextNum.toString().padStart(4, '0')}`;

  const story = {
    id,
    title: answers.title,
    risk: answers.risk,
    epic: answers.epic,
    uuid: crypto.randomUUID(),
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };

  const filePath = path.join(storiesDir, `${id}.json`);
  await fs.writeJson(filePath, story, { spaces: 2 });
  console.log(chalk.green(`Created story ${id}`));
}