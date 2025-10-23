--- FILE: AGENTS.md
```md
# DotProject Development Guide

## Package Manager Policy

**ALWAYS use pnpm instead of npm for all Node.js package management operations.** This ensures consistency across the project and avoids potential issues with lockfile conflicts.

- ✅ Use `pnpm install`, `pnpm run`, `pnpm build`, etc.
- ❌ Never use `npm install`, `npm run`, `npm build`, etc.

## Important Notes

- Always use `pnpm run restart` instead of manually stopping/starting services
- Check logs with `pnpm run logs` when troubleshooting
- **ALWAYS use pnpm for all Node.js package management operations**
```

--- FILE: README.md
```md
# dotproject

A CLI tool to manage project metadata in a `.project` folder within a git repository.

## Installation

```bash
npm install -g dotproject
```

## Usage

### Initialize project

```bash
dot init
```

This command creates a `.project` folder in the repository root (if it doesn't exist), adds starter folders (`stories`, `epics`, `docs`), and writes a basic `.project/config.json` file with metadata.

### Create new story

```bash
dot story new
```

Prompts for story title, risk level, and associated epic, then creates a new file `.project/stories/ST-XXXX.json` with a unique ID, UUID, and timestamps.

## Commands

- `dot init`: Initialize the project structure
- `dot story new`: Create a new story

## Requirements

- Node.js 18+
- Git repository (to locate the project root)

```

--- FILE: package.json
```json
{
  "name": "dotproject",
  "version": "1.0.0",
  "description": "A CLI tool to manage project metadata in .project folder",
  "main": "src/index.js",
  "type": "module",
  "bin": {
    "dotproject": "bin/cli.js",
    "dot": "bin/cli.js"
  },
  "scripts": {
    "start": "node bin/cli.js"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^5.0.0",
    "fs-extra": "^11.0.0",
    "inquirer": "^9.0.0",
    "globby": "^14.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "author": "levratech",
  "license": "MIT"
}
```

--- FILE: bin/cli.js
```js
#!/usr/bin/env node

import { Command } from 'commander';
import init from '../src/commands/init.js';
import storyNew from '../src/commands/story-new.js';
import atlasBuild from '../src/commands/atlas-build.js';

const program = new Command();

program
  .name('dotproject')
  .description('CLI to manage project metadata')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize .project folder')
  .action(init);

const storyCmd = program
  .command('story')
  .description('Story commands');

storyCmd
  .command('new')
  .description('Create new story')
  .action(storyNew);

const atlasCmd = program
  .command('atlas')
  .description('Atlas commands');

atlasCmd
  .command('build')
  .description('Build project atlas')
  .action(atlasBuild);

program.parse();
```

--- FILE: schemas/story.json
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique story identifier"
    },
    "title": {
      "type": "string",
      "description": "Story title"
    },
    "risk": {
      "type": "string",
      "description": "Risk level"
    },
    "epic": {
      "type": "string",
      "description": "Associated epic"
    },
    "uuid": {
      "type": "string",
      "description": "Unique UUID"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    },
    "updated": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp"
    }
  },
  "required": ["id", "title", "uuid", "created", "updated"]
}
```

--- FILE: src/index.js
```js
// Main entry point for the dotproject library
// Currently empty, as this is primarily a CLI tool
```

--- FILE: src/commands/atlas-build.js
```js
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
```

--- FILE: src/commands/init.js
```js
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
```

--- FILE: src/commands/story-new.js
```js
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
```

--- FILE: src/utils/findProjectRoot.js
```js
import path from 'path';
import fs from 'fs';

/**
 * Recursively finds the project root by looking for .project or .git directory.
 * Starts from the current working directory and traverses up.
 * @param {string} start - Starting directory (defaults to process.cwd())
 * @returns {string|null} - Path to the root directory or null if not found
 */
export function findProjectRoot(start = process.cwd()) {
  let current = start;
  while (true) {
    if (
      fs.existsSync(path.join(current, '.project')) ||
      fs.existsSync(path.join(current, '.git'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
```

