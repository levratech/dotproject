#!/usr/bin/env node

import { Command } from 'commander';
import init from '../src/commands/init.js';
import storyNew from '../src/commands/story-new.js';
import atlasBuild from '../src/commands/atlas-build.js';
import validate from '../src/commands/validate.js';
import storyIndex from '../src/commands/story-index.js';
import canonicalize from '../src/commands/canonicalize.js';
import idea from '../src/commands/idea.js';
import docsIndex from '../src/commands/docs-index.js';

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

storyCmd
  .command('index')
  .description('Index stories and epics')
  .action(storyIndex);

const atlasCmd = program
  .command('atlas')
  .description('Atlas commands');

atlasCmd
  .command('build')
  .description('Build project atlas')
  .action(atlasBuild);

program
  .command('validate')
  .description('Validate JSON files against schemas')
  .action(validate);

program
  .command('canonicalize')
  .description('Canonicalize JSON files')
  .action(canonicalize);

program
  .command('idea <action> [arg]')
  .description('Manage .project ideas')
  .action(idea);

const docsCmd = program
  .command('docs')
  .description('Docs commands');

docsCmd
  .command('index')
  .description('Build docs index')
  .action(docsIndex);

program.parse();