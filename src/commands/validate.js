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