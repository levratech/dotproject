import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import matter from 'gray-matter';
import { globby } from 'globby';
import { spawn } from 'child_process';
import { findProjectRoot } from '../utils/findProjectRoot.js';

/**
 * Manage .project ideas.
 */
export default async function idea(action, arg) {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const ideasDir = path.join(root, '.project', 'ideas');
  await fs.ensureDir(ideasDir);

  if (action === 'new') {
    await ideaNew(ideasDir, arg);
  } else if (action === 'list') {
    await ideaList(ideasDir);
  } else if (action === 'open') {
    await ideaOpen(ideasDir, arg);
  } else {
    console.error(chalk.red('Invalid action. Use new, list, or open.'));
    process.exit(1);
  }
}

/**
 * Create a new idea.
 */
async function ideaNew(ideasDir, title) {
  if (!title) {
    console.error(chalk.red('Title is required.'));
    process.exit(1);
  }

  const nextId = await getNextIdeaId(ideasDir);
  const id = `IDEA-${nextId.toString().padStart(4, '0')}`;
  const fileName = `idea-${nextId.toString().padStart(4, '0')}.md`;
  const filePath = path.join(ideasDir, fileName);

  const frontMatter = formatFrontMatter({
    id,
    title,
    tags: [],
    created: new Date().toISOString(),
    status: 'draft'
  });

  const content = `${frontMatter}## Summary\n(Add notes here)\n`;

  await fs.writeFile(filePath, content);
  console.log(chalk.green(`✅ Created idea ${id} at ${filePath}`));
}

/**
 * List all ideas.
 */
async function ideaList(ideasDir) {
  const files = await globby('**/*.md', { cwd: ideasDir });
  const ideas = [];

  for (const file of files) {
    const filePath = path.join(ideasDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    if (data.id && data.title) {
      ideas.push(data);
    }
  }

  if (ideas.length === 0) {
    console.log('No ideas found.');
    return;
  }

  console.log('ID\t\tTitle\t\t\tTags\t\tStatus');
  console.log('─'.repeat(80));
  ideas.forEach(idea => {
    console.log(`${idea.id}\t${idea.title}\t\t${idea.tags.join(', ')}\t\t${idea.status}`);
  });
}

/**
 * Open an idea in the default editor.
 */
async function ideaOpen(ideasDir, id) {
  if (!id) {
    console.error(chalk.red('ID is required.'));
    process.exit(1);
  }

  const files = await globby('**/*.md', { cwd: ideasDir });
  let filePath = null;

  for (const file of files) {
    const fullPath = path.join(ideasDir, file);
    const content = await fs.readFile(fullPath, 'utf-8');
    const { data } = matter(content);
    if (data.id === id) {
      filePath = fullPath;
      break;
    }
  }

  if (!filePath) {
    console.error(chalk.red(`Idea ${id} not found.`));
    process.exit(1);
  }

  const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(openCmd, [filePath], { stdio: 'inherit' });
}

/**
 * Get the next idea ID.
 */
async function getNextIdeaId(ideasDir) {
  const seqPath = path.join(ideasDir, 'sequence.json');
  let next = 1;
  if (await fs.pathExists(seqPath)) {
    const seq = await fs.readJson(seqPath);
    next = seq.next;
  }
  await fs.writeJson(seqPath, { next: next + 1 });
  return next;
}

/**
 * Format front matter.
 */
function formatFrontMatter(data) {
  return `---
id: ${data.id}
title: "${data.title}"
tags: [${data.tags.map(t => `"${t}"`).join(', ')}]
created: ${data.created}
status: ${data.status}
---
`;
}