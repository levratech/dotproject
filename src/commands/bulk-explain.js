import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { findProjectRoot } from '../utils/findProjectRoot.js';

/**
 * Explain what a bulk import would do without executing.
 */
export default async function bulkExplain(filePath, options = {}) {
  const { format = 'yaml' } = options;

  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a project.'));
    process.exit(1);
  }

  if (!await fs.pathExists(filePath)) {
    console.error(chalk.red(`File not found: ${filePath}`));
    process.exit(1);
  }

  console.log(chalk.cyan('🔍 Explaining bulk import...'));

  let data;
  if (format === 'yaml') {
    const content = await fs.readFile(filePath, 'utf8');
    data = yaml.load(content);
  } else if (format === 'ndjson') {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line);
    data = { epics: [], stories: [], tasks: [], prompts: [] };
    for (const line of lines) {
      const item = JSON.parse(line);
      const type = item.type;
      if (data[type + 's']) {
        data[type + 's'].push(item);
      }
    }
  } else {
    console.error(chalk.red('Unsupported format'));
    process.exit(1);
  }

  const entities = {
    epics: data.epics || [],
    stories: data.stories || [],
    tasks: data.tasks || [],
    prompts: data.prompts || []
  };

  // Load sequence
  const seqPath = path.join(root, '.project', 'sequence.json');
  let sequence = { epics: 1, stories: 1, tasks: 1, plans: 1 };
  if (await fs.pathExists(seqPath)) {
    sequence = await fs.readJson(seqPath);
  }

  const planId = `PLAN-${sequence.plans.toString().padStart(4, '0')}`;

  // Simulate ID assignment
  const keyMaps = { epics: {}, stories: {}, tasks: {} };
  for (const type of ['epics', 'stories', 'tasks']) {
    for (const item of entities[type]) {
      if (!item.id) {
        const prefixes = { epics: 'EP', stories: 'ST', tasks: 'TK' };
        item.id = `${prefixes[type]}${sequence[type].toString().padStart(4, '0')}`;
        sequence[type]++;
      }
      if (item.key) {
        keyMaps[type][item.key] = item.id;
      }
    }
  }

  console.log(chalk.green('Explanation:'));
  console.log(`Plan ID: ${planId}`);
  console.log(`Epics to create: ${entities.epics.length}`);
  console.log(`Stories to create: ${entities.stories.length}`);
  console.log(`Tasks to create: ${entities.tasks.length}`);
  console.log(`Prompts to create: ${entities.prompts.length}`);
  console.log('Key to ID mappings:');
  for (const type of ['epics', 'stories', 'tasks']) {
    for (const item of entities[type]) {
      if (item.key) {
        console.log(`  ${type.slice(0, -1)}.${item.key} -> ${item.id}`);
      }
    }
  }
  console.log('Files to write:');
  console.log(`  .project/plans/${planId}.yaml`);
  for (const type of ['epics', 'stories', 'tasks']) {
    for (const item of entities[type]) {
      console.log(`  .project/${type}/${item.id}.json`);
    }
  }
  for (const prompt of entities.prompts) {
    const id = prompt.storyId || prompt.taskId;
    const prefix = prompt.storyId ? 'STORY' : 'TASK';
    console.log(`  .project/prompts/${prefix}-${id}.md`);
  }
  for (const type of ['stories', 'tasks']) {
    for (const item of entities[type]) {
      if (item.prompt) {
        const prefix = type === 'stories' ? 'STORY' : 'TASK';
        console.log(`  .project/prompts/${prefix}-${item.id}.md`);
      }
    }
  }
}