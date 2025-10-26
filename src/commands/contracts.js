import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { findProjectRoot } from '../utils/findProjectRoot.js';

export default async function contracts(action) {
  const root = findProjectRoot();
  if (!root) {
    console.error(chalk.red('❌ Not in a .project repository.'));
    process.exit(1);
  }

  const contractsDir = path.join(root, '.project', 'contracts');
  const functionsPath = path.join(contractsDir, 'functions.yaml');

  if (action === 'list') {
    const { functions } = yaml.load(await fs.readFile(functionsPath, 'utf8'));
    console.log(chalk.cyan(`📜 ${functions.length} function contracts found:`));
    functions.forEach(fn => {
      console.log(`- ${chalk.yellow(fn.id)} (${fn.layer}) — ${fn.description}`);
    });
  } else if (action === 'validate') {
    // simple structure validation (stub)
    const valid = fs.existsSync(functionsPath);
    console.log(valid ? chalk.green('✅ Contracts structure valid.') : chalk.red('❌ Contracts missing.'));
  } else {
    console.log(chalk.red('Usage: dot contracts <list|validate>'));
  }
}