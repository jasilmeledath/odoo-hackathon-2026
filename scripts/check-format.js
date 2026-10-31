// Check tracked source files with the repository-pinned Prettier version.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORMATTED_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.jsonc',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

const listResult = spawnSync('git', ['ls-files', '-z'], {
  cwd: REPOSITORY_ROOT,
  encoding: 'utf8',
});

if (listResult.status !== 0) {
  process.stderr.write(listResult.stderr || 'Could not list tracked files.\n');
  process.exit(listResult.status || 1);
}

const files = listResult.stdout
  .split('\0')
  .filter(Boolean)
  .filter((file) => FORMATTED_EXTENSIONS.has(path.extname(file).toLowerCase()));
const prettierCli = path.join(REPOSITORY_ROOT, 'node_modules', 'prettier', 'bin', 'prettier.cjs');

if (!existsSync(prettierCli)) {
  process.stderr.write('Prettier is not installed. Run `npm install` from the repository root.\n');
  process.exit(1);
}

if (files.length === 0) {
  process.stdout.write('No tracked source files need formatting checks.\n');
  process.exit(0);
}

const result = spawnSync(process.execPath, [prettierCli, '--check', ...files], {
  cwd: REPOSITORY_ROOT,
  stdio: 'inherit',
});

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
