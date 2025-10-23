#!/usr/bin/env node

import { Command } from 'commander';
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

// --- Parse CLI ---
program.parse();
