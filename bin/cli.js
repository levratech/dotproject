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