import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import crypto from 'crypto';
import { globby } from 'globby';
import { findProjectRoot } from '../utils/findProjectRoot.js';

/**
 * Build the project atlas by gathering readable source files into a markdown file.
 */
export default async function atlasBuild() {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const atlasDir = path.join(root, '.project', 'atlas');
  await fs.ensureDir(atlasDir);

  const files = await getFiles(root);
  const { content, metadata } = await generateAtlas(root, files);

  await writeAtlas(atlasDir, content);
  await writeIndex(atlasDir, metadata);

  console.log(chalk.green('✅ Built project atlas'));
  console.log(`Files included: ${files.length}`);
  console.log(`Output: .project/atlas/atlas.md`);
}

/**
 * Get list of files to include in the atlas.
 */
async function getFiles(root) {
  const includePatterns = ['**/*.{js,ts,json,md,yml,yaml,py,go,rs}'];
  const ignorePatterns = await getIgnorePatterns(root);
  const files = await globby(includePatterns, { cwd: root, absolute: true, ignore: ignorePatterns });
  return files;
}

/**
 * Get combined ignore patterns from built-ins and .atlasignore file.
 */
async function getIgnorePatterns(root) {
  const builtInIgnores = [
    'node_modules/**',
    '.git/**',
    '.project/**',
    'dist/**',
    'build/**',
    '.next/**',
    'coverage/**',
    'tmp/**',
    '*.log',
    '*.lock',
    '*.sqlite'
  ];

  let customIgnores = [];
  const atlasIgnorePath = path.join(root, '.project', '.atlasignore');
  if (await fs.pathExists(atlasIgnorePath)) {
    console.log(`Using ignore rules from .project/.atlasignore`);
    customIgnores = await loadIgnoreFile(atlasIgnorePath);
  } else {
    const rootAtlasIgnore = path.join(root, '.atlasignore');
    if (await fs.pathExists(rootAtlasIgnore)) {
      console.log(`Using ignore rules from .atlasignore`);
      customIgnores = await loadIgnoreFile(rootAtlasIgnore);
    }
  }

  return [...builtInIgnores, ...customIgnores];
}

/**
 * Load and parse .atlasignore file.
 */
async function loadIgnoreFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  return lines.map(pattern => pattern.endsWith('/') ? pattern + '**' : pattern);
}

/**
 * Generate the atlas content and metadata.
 */
async function generateAtlas(root, files) {
  let content = '';
  const metadata = [];

  for (const file of files) {
    const relativePath = path.relative(root, file);
    const ext = path.extname(file).slice(1) || 'txt';
    const fileContent = await fs.readFile(file, 'utf-8');
    const lines = fileContent.split('\n').length;
    const size = (await fs.stat(file)).size;
    const hash = crypto.createHash('sha1').update(fileContent).digest('hex');

    content += `--- FILE: ${relativePath}\n\`\`\`${ext}\n${fileContent}\n\`\`\`\n\n`;

    metadata.push({
      path: relativePath,
      size,
      sha1: hash,
      lines
    });
  }

  return { content, metadata };
}

/**
 * Write the atlas markdown file.
 */
async function writeAtlas(atlasDir, content) {
  const atlasPath = path.join(atlasDir, 'atlas.md');
  await fs.writeFile(atlasPath, content);
}

/**
 * Write the index metadata file.
 */
async function writeIndex(atlasDir, metadata) {
  const indexData = {
    files: metadata,
    totalFiles: metadata.length,
    timestamp: new Date().toISOString()
  };
  const indexPath = path.join(atlasDir, 'index.json');
  await fs.writeJson(indexPath, indexData, { spaces: 2 });
}