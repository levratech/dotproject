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

--- FILE: jest.config.js
```js
export default {
  testEnvironment: "node",
  verbose: true,
  roots: ["<rootDir>/tests"],
  transform: {},
};
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
    "test": "NODE_OPTIONS=--experimental-vm-modules jest --color"
  },
  "dependencies": {
    "ajv": "^8.17.1",
    "chalk": "^5.0.0",
    "commander": "^11.0.0",
    "fs-extra": "^11.0.0",
    "globby": "^14.0.0",
    "inquirer": "^9.0.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "chalk": "^5.3.0",
    "fs-extra": "^11.2.0",
    "tmp": "^0.2.1",
    "execa": "^9.0.0",
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0"
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
import chalk from 'chalk';
import init from '../src/commands/init.js';
import storyNew from '../src/commands/story-new.js';
import atlasBuild from '../src/commands/atlas-build.js';
import validate from '../src/commands/validate.js';
import canonicalize from '../src/commands/canonicalize.js';
import storyIndex from '../src/commands/story-index.js';
import idea from '../src/commands/idea.js';
import ideaUpdate from '../src/commands/idea-update.js';
import docsIndex from '../src/commands/docs-index.js';

const program = new Command();

program
  .name('dotproject')
  .description('CLI to manage project metadata')
  .version('1.0.0');

// --- Init command ---
program
  .command('init')
  .description('Initialize .project folder')
  .action(init);

// --- Story commands ---
const storyCmd = program
  .command('story')
  .description('Story commands');

storyCmd
  .command('new')
  .description('Create new story')
  .action(storyNew);

storyCmd
  .command('index')
  .description('Index stories and epics')
  .action(storyIndex);

// --- Atlas commands ---
const atlasCmd = program
  .command('atlas')
  .description('Atlas commands');

atlasCmd
  .command('build')
  .description('Build project atlas')
  .action(atlasBuild);

// --- Validation commands ---
program
  .command('validate')
  .description('Validate JSON files against schemas')
  .action(validate);

// --- Canonicalize ---
program
  .command('canonicalize')
  .description('Canonicalize JSON files')
  .action(canonicalize);

// --- Idea commands (grouped) ---
const ideaCmd = new Command('idea')
  .description('Manage .project ideas');

ideaCmd
  .command('new <title>')
  .description('Create a new idea file')
  .action((title) => idea('new', title));

ideaCmd
  .command('list')
  .description('List all ideas')
  .action(() => idea('list'));

ideaCmd
  .command('open <id>')
  .description('Open an idea in the system editor')
  .action((id) => idea('open', id));

ideaCmd
  .command('update <id>')
  .description('Update metadata or sections of an idea file')
  .option('--title <title>', 'Update the title')
  .option('--status <status>', 'Update status (draft, open, closed)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--summary <summary>', 'Replace or append summary text')
  .action(ideaUpdate);

program.addCommand(ideaCmd);

// --- Docs commands ---
const docsCmd = program
  .command('docs')
  .description('Docs commands');

docsCmd
  .command('index')
  .description('Build docs index')
  .action(docsIndex);

program
  .command('test')
  .description('Run Jest tests')
  .action(async () => {
    const { execaSync } = await import('execa');
    console.log(chalk.cyan('🧪 Running tests...'));
    execaSync('npx', ['jest', '--color'], { stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: '--experimental-vm-modules' } });
  });

// --- Parse CLI ---
program.parse();

program.parse();

```

--- FILE: schemas/idea.json
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique idea identifier"
    },
    "title": {
      "type": "string",
      "description": "Idea title"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tags for categorization"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "open", "closed"],
      "description": "Idea status"
    }
  },
  "required": ["id", "title", "tags", "created", "status"]
}
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

--- FILE: src/commands/canonicalize.js
```js
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
```

--- FILE: src/commands/docs-index.js
```js
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
```

--- FILE: src/commands/idea-update.js
```js
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
```

--- FILE: src/commands/idea.js
```js
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

--- FILE: src/commands/story-index.js
```js
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

--- FILE: src/commands/validate.js
```js
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import Ajv from 'ajv';
import { globby } from 'globby';
import { findProjectRoot } from '../utils/findProjectRoot.js';

/**
 * Validate JSON files in .project/ against schemas.
 */
export default async function validate() {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('Not in a git repository or .project folder not found.'));
    process.exit(1);
  }

  const projectDir = path.join(root, '.project');
  const schemasDir = path.join(root, 'schemas');

  const ajv = new Ajv();
  const storySchemaPath = path.join(schemasDir, 'story.json');
  if (!(await fs.pathExists(storySchemaPath))) {
    console.error(chalk.red('Story schema not found.'));
    process.exit(1);
  }
  const storySchema = await fs.readJson(storySchemaPath);
  const validateStory = ajv.compile(storySchema);

  const files = await globby('stories/**/*.json', { cwd: projectDir });
  let validCount = 0;
  let invalidCount = 0;
  const errors = [];

  for (const file of files) {
    const filePath = path.join(projectDir, file);
    const data = await fs.readJson(filePath);
    const valid = validateStory(data);
    if (valid) {
      validCount++;
    } else {
      invalidCount++;
      errors.push(`${file} (${ajv.errorsText(validateStory.errors)})`);
    }
  }

  console.log(chalk.green(`✅ ${validCount} stories valid`));
  if (invalidCount > 0) {
    console.log(chalk.red(`❌ ${invalidCount} invalid: ${errors.join(', ')}`));
    process.exit(1);
  }
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

--- FILE: src/utils/jsonUtils.js
```js
/**
 * Utility functions for JSON handling.
 */

/**
 * Recursively sort object keys for canonical JSON.
 */
export function sortKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeys(obj[key]);
  });
  return sorted;
}
```

--- FILE: tests/cli/init.test.js
```js
import fs from "fs-extra";
import path from "path";
import { jest } from '@jest/globals';
import init from "../../src/commands/init.js";
import { makeTempProject } from "../helpers/setup.js";

jest.mock('chalk', () => ({
  green: jest.fn(),
  red: jest.fn()
}));

describe("dot init", () => {
  it("creates a .project folder with base files", async () => {
    const cwd = makeTempProject();
    // Create .git to simulate a repo
    fs.mkdirSync(path.join(cwd, '.git'));
    // Change to the temp dir
    process.chdir(cwd);
    await init();
    const projectPath = path.join(cwd, ".project");
    expect(fs.existsSync(projectPath)).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "stories"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "epics"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "docs"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "config.json"))).toBe(true);
  });
});
```

--- FILE: tests/helpers/setup.js
```js
import fs from "fs-extra";
import os from "os";
import path from "path";

export function makeTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotproject-"));
  process.chdir(dir);
  return dir;
}
```

