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