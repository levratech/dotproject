import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import matter from 'gray-matter';
import { globby } from 'globby';
import { findProjectRoot } from '../utils/findProjectRoot.js';
import { sortKeys } from '../utils/jsonUtils.js';

/**
 * Build docs index from .project/docs/ and .project/ideas/.
 */
export default async function docsIndex() {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const projectDir = path.join(root, '.project');
  const docsDir = path.join(projectDir, 'docs');
  const ideasDir = path.join(projectDir, 'ideas');

  const docs = [];
  const ideas = [];

  // Index docs
  if (await fs.pathExists(docsDir)) {
    const docFiles = await globby('**/*.md', { cwd: docsDir });
    for (const file of docFiles) {
      const filePath = path.join(docsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data } = matter(content);
      if (data.id && data.title) {
        docs.push({
          id: data.id,
          title: data.title,
          tags: data.tags || [],
          created: data.created,
          path: path.relative(projectDir, filePath)
        });
      }
    }
  }

  // Index ideas
  if (await fs.pathExists(ideasDir)) {
    const ideaFiles = await globby('**/*.md', { cwd: ideasDir });
    for (const file of ideaFiles) {
      const filePath = path.join(ideasDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data } = matter(content);
      if (data.id && data.title) {
        ideas.push({
          id: data.id,
          title: data.title,
          tags: data.tags || [],
          created: data.created,
          path: path.relative(projectDir, filePath)
        });
      }
    }
  }

  const indexData = {
    timestamp: new Date().toISOString(),
    docs: docs.concat(ideas)
  };

  const indexPath = path.join(projectDir, 'docs', 'index.json');
  await fs.ensureDir(path.dirname(indexPath));
  await fs.writeJson(indexPath, sortKeys(indexData), { spaces: 2 });

  console.log(chalk.green(`✅ Indexed ${ideas.length} ideas and ${docs.length} docs.`));
}