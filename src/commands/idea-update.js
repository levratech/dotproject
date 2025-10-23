import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import matter from 'gray-matter';
import { globby } from 'globby';
import { findProjectRoot } from '../utils/findProjectRoot.js';
import { sortKeys } from '../utils/jsonUtils.js';
import docsIndex from './docs-index.js';

/**
 * Update metadata or sections of an idea file.
 */
export default async function ideaUpdate(id, options) {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const ideasDir = path.join(root, '.project', 'ideas');
  if (!(await fs.pathExists(ideasDir))) {
    console.error(chalk.red('Ideas directory not found.'));
    process.exit(1);
  }

  const files = await globby('**/*.md', { cwd: ideasDir });
  let filePath = null;
  let originalData = null;
  let originalBody = null;

  for (const file of files) {
    const fullPath = path.join(ideasDir, file);
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = matter(content);
    if (parsed.data.id === id) {
      filePath = fullPath;
      originalData = parsed.data;
      originalBody = parsed.content;
      break;
    }
  }

  if (!filePath) {
    console.error(chalk.red(`❌ ${id} not found`));
    process.exit(1);
  }

  const changes = [];
  const newData = { ...originalData };

  if (options.title) {
    newData.title = options.title;
    changes.push(`title → ${options.title}`);
  }

  if (options.status) {
    newData.status = options.status;
    changes.push(`status → ${options.status}`);
  }

  if (options.tags) {
    const tags = options.tags.split(',').map(t => t.trim());
    newData.tags = tags;
    changes.push(`tags → [${tags.join(', ')}]`);
  }

  let newBody = originalBody;
  if (options.summary) {
    newBody = updateSummarySection(originalBody, options.summary);
    changes.push('summary updated');
  }

  if (changes.length === 0) {
    console.log(chalk.yellow(`⚠️ No changes specified`));
    return;
  }

  const sortedData = sortKeys(newData);
  const newContent = matter.stringify(newBody, sortedData);
  await fs.writeFile(filePath, newContent);

  console.log(chalk.green(`✅ Updated ${id}`));
  changes.forEach(change => console.log(`  • ${change}`));

  // Reindex docs
  await docsIndex();
}

/**
 * Update or append the ## Summary section in the body.
 */
function updateSummarySection(body, summary) {
  const summaryHeader = '## Summary\n';
  if (body.includes('## Summary')) {
    const start = body.indexOf('## Summary') + summaryHeader.length;
    const endMarker = body.indexOf('\n## ', start);
    const end = endMarker === -1 ? body.length : endMarker;
    return body.substring(0, start) + summary + '\n' + body.substring(end);
  } else {
    return body + '\n' + summaryHeader + summary + '\n';
  }
}