import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import crypto from 'crypto';
import { findProjectRoot } from '../utils/findProjectRoot.js';
import storyIndex from './story-index.js';
import docsIndex from './docs-index.js';
import canonicalize from './canonicalize.js';
import validate from './validate.js';

/**
 * Bulk import from a file (YAML or NDJSON).
 */
export default async function bulkImport(filePath, options = {}) {
  const { format = 'yaml', upsert = false, dryRun = false } = options;

  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a project.'));
    process.exit(1);
  }

  if (!await fs.pathExists(filePath)) {
    console.error(chalk.red(`File not found: ${filePath}`));
    process.exit(1);
  }

  console.log(chalk.cyan('🔄 Parsing bulk import file...'));

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
      const type = item.type; // assume each has 'type': 'epic', 'story', etc.
      if (data[type + 's']) {
        data[type + 's'].push(item);
      }
    }
  } else {
    console.error(chalk.red('Unsupported format'));
    process.exit(1);
  }

  // Assume data is { epics: [...], stories: [...], tasks: [...], prompts: [...] }
  // Each item has key (local), id (optional), etc.

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

  // Assign plan ID
  const planId = `PLAN-${sequence.plans.toString().padStart(4, '0')}`;
  sequence.plans++;

  // Build key to ID maps
  const keyMaps = { epics: {}, stories: {}, tasks: {} };

  // First pass: assign IDs and build maps
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
      item.planId = planId;
      item.status = item.status || 'draft';
      item.created = item.created || new Date().toISOString();
      item.updated = item.updated || new Date().toISOString();
      if (type === 'stories') {
        item.uuid = item.uuid || crypto.randomUUID();
      }
    }
  }

  // Resolve keys
  for (const story of entities.stories) {
    if (story.epic && typeof story.epic === 'string' && !story.epic.startsWith('EP-')) {
      story.epic = keyMaps.epics[story.epic] || story.epic;
    }
  }
  // Assume tasks may reference stories similarly

  // Now, prepare to write
  const dirs = {
    plans: path.join(root, '.project', 'plans'),
    epics: path.join(root, '.project', 'epics'),
    stories: path.join(root, '.project', 'stories'),
    tasks: path.join(root, '.project', 'tasks'),
    prompts: path.join(root, '.project', 'prompts')
  };

  for (const dir of Object.values(dirs)) {
    await fs.ensureDir(dir);
  }

  // Check for conflicts if not upsert
  if (!upsert && !dryRun) {
    for (const type of ['epics', 'stories', 'tasks']) {
      for (const item of entities[type]) {
        const filePath = path.join(dirs[type], `${item.id}.json`);
        if (await fs.pathExists(filePath)) {
          console.error(chalk.red(`Conflict: ${filePath} already exists`));
          process.exit(1);
        }
      }
    }
  }

  // Dry run: print what would be done
  if (dryRun) {
    console.log(chalk.yellow('Dry run mode:'));
    console.log(`Plan: ${planId}`);
    console.log(`Epics: ${entities.epics.length}`);
    console.log(`Stories: ${entities.stories.length}`);
    console.log(`Tasks: ${entities.tasks.length}`);
    console.log(`Prompts: ${entities.prompts.length}`);
    console.log('Key mappings:');
    for (const type of ['epics', 'stories', 'tasks']) {
      for (const item of entities[type]) {
        if (item.key) {
          console.log(`  ${type}.${item.key} -> ${item.id}`);
        }
      }
    }
    return;
  }

  // Write plan
  const planFile = path.join(dirs.plans, `${planId}.yaml`);
  await fs.writeFile(planFile, yaml.dump(data));

  // Write entities
  for (const type of ['epics', 'stories', 'tasks']) {
    for (const item of entities[type]) {
      const filePath = path.join(dirs[type], `${item.id}.json`);
      await fs.writeJson(filePath, item, { spaces: 2 });
    }
  }

  // Write prompts
  for (const prompt of entities.prompts) {
    // Assume prompt has storyId or taskId, and content
    const id = prompt.storyId || prompt.taskId;
    const prefix = prompt.storyId ? 'STORY' : 'TASK';
    const promptFile = path.join(dirs.prompts, `${prefix}-${id}.md`);
    await fs.writeFile(promptFile, prompt.content || '');
  }

  // Also, for stories/tasks with prompt field
  for (const type of ['stories', 'tasks']) {
    for (const item of entities[type]) {
      if (item.prompt) {
        const prefix = type === 'stories' ? 'STORY' : 'TASK';
        const promptFile = path.join(dirs.prompts, `${prefix}-${item.id}.md`);
        const content = generatePromptMd(item.prompt);
        await fs.writeFile(promptFile, content);
      }
    }
  }

  // Save sequence
  await fs.writeJson(seqPath, sequence);

  console.log(chalk.green('✅ Bulk import completed'));
  console.log(`Plan: ${planId}`);
  console.log(`Epics: ${entities.epics.length}`);
  console.log(`Stories: ${entities.stories.length}`);
  console.log(`Tasks: ${entities.tasks.length}`);
  console.log(`Prompts: ${entities.prompts.length}`);

  // Validate
  console.log(chalk.cyan('🔄 Validating...'));
  await validate();

  // Post-import
  console.log(chalk.cyan('🔄 Running story index...'));
  await storyIndex();
  console.log(chalk.cyan('🔄 Running docs index...'));
  await docsIndex();
  if (await fs.pathExists(path.join(root, '.project', 'canonicalize.js'))) { // Wait, canonicalize is a command
    console.log(chalk.cyan('🔄 Running canonicalize...'));
    await canonicalize();
  }
}

function generatePromptMd(prompt) {
  // Assume prompt is { role, intent, constraints?, acceptance? }
  let md = `# Prompt\n\n`;
  if (prompt.role) md += `**Role:** ${prompt.role}\n\n`;
  if (prompt.intent) md += `**Intent:** ${prompt.intent}\n\n`;
  if (prompt.constraints) md += `**Constraints:** ${prompt.constraints}\n\n`;
  if (prompt.acceptance) md += `**Acceptance:** ${prompt.acceptance}\n\n`;
  return md;
}