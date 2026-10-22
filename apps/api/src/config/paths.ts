import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

/**
 * Locate the @loqta/api package root regardless of whether the process was
 * started from the repository root or from apps/api.
 */
export function findApiRoot(startDirectory = process.cwd()): string {
  let current = resolve(startDirectory);

  for (;;) {
    const packagePath = join(current, 'package.json');
    if (existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as {
          name?: string;
        };
        if (packageJson.name === '@loqta/api') {
          return current;
        }
      } catch {
        // Ignore malformed package files while walking up.
      }
    }

    const nestedApi = join(current, 'apps', 'api');
    if (existsSync(join(nestedApi, 'package.json'))) {
      return nestedApi;
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return process.cwd();
}

export function resolveFromApiRoot(path: string): string {
  if (path === ':memory:' || isAbsolute(path)) {
    return path;
  }
  return resolve(findApiRoot(), path);
}
