// Run the local promotion gate and prepare the required develop-to-main pull request.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    env: options.env ?? process.env,
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
  });

  if (result.error) throw result.error;
  return result;
};

const gitOutput = (args) => {
  const result = run('git', args, { capture: true });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return result.stdout.trim();
};

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

try {
  const branch = gitOutput(['branch', '--show-current']);
  if (branch !== 'develop') {
    fail(`Promotion must start from develop; current branch is ${branch || '(detached HEAD)'}.`);
  }

  const workingTree = gitOutput(['status', '--porcelain']);
  if (workingTree) {
    fail('Commit or remove all changes, including untracked files, before promoting.');
  }

  process.stdout.write('Fetching current develop and main refs...\n');
  const fetchResult = run('git', ['fetch', 'origin', 'develop', 'main']);
  if (fetchResult.status !== 0) process.exit(fetchResult.status ?? 1);

  const sourceSha = gitOutput(['rev-parse', 'HEAD']);
  const remoteDevelopSha = gitOutput(['rev-parse', 'origin/develop']);
  if (sourceSha !== remoteDevelopSha) {
    fail('Local develop must match origin/develop. Run `git pull --ff-only` and try again.');
  }

  const ancestorResult = run('git', ['merge-base', '--is-ancestor', 'origin/main', 'develop']);
  if (ancestorResult.status !== 0) {
    fail('origin/main is not an ancestor of develop. Integrate main into develop before promotion.');
  }

  const checksResult = run(NPM_COMMAND, ['run', 'ci:local']);
  if (checksResult.status !== 0) process.exit(checksResult.status ?? 1);

  const hookResult = run('git', ['config', '--local', 'core.hooksPath', '.githooks']);
  if (hookResult.status !== 0) process.exit(hookResult.status ?? 1);

  const existingPrResult = run(
    'gh',
    ['pr', 'list', '--state', 'open', '--base', 'main', '--head', 'develop', '--json', 'number,url'],
    { capture: true },
  );
  if (existingPrResult.status !== 0) {
    process.stderr.write(existingPrResult.stderr || 'Could not check for an existing develop-to-main PR.\n');
    process.exit(existingPrResult.status ?? 1);
  }

  const body = [
    'Promote the reviewed develop branch to main.',
    '',
    `Local promotion checks passed for commit ${sourceSha}:`,
    '- Prettier check on tracked source files',
    '- Fresh local PostgreSQL migrations',
    '- Server test suite',
    '- Client production build',
    '',
    'This PR was prepared by `npm run promote:main`; review it before merging.',
  ].join('\n');

  const existingPrs = JSON.parse(existingPrResult.stdout);
  if (existingPrs.length > 0) {
    const editResult = run('gh', ['pr', 'edit', String(existingPrs[0].number), '--body', body]);
    if (editResult.status !== 0) process.exit(editResult.status ?? 1);
    process.stdout.write(
      `Checks passed for ${sourceSha}. Updated the promotion PR description: ${existingPrs[0].url}\n`,
    );
    process.exit(0);
  }

  const createResult = run('gh', [
    'pr',
    'create',
    '--base',
    'main',
    '--head',
    'develop',
    '--title',
    'chore(repo): promote develop to main',
    '--body',
    body,
  ]);
  if (createResult.status !== 0) process.exit(createResult.status ?? 1);
} catch (error) {
  process.stderr.write(`Local promotion failed: ${error.message}\n`);
  process.exit(1);
}
