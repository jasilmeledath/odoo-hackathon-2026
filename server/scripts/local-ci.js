// Run promotion checks against an isolated local PostgreSQL database.
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Client } from 'pg';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPOSITORY_ROOT = path.resolve(SERVER_ROOT, '..');
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const LOCAL_POSTGRES_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true });

const run = (args, databaseUrl) => {
  const result = spawnSync(NPM_COMMAND, args, {
    cwd: REPOSITORY_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${NPM_COMMAND} ${args.join(' ')} failed with exit code ${result.status ?? 1}`);
  }
};

const connectToMaintenanceDatabase = async (connectionUrl) => {
  let lastError;
  for (const databaseName of ['postgres', 'template1']) {
    const maintenanceUrl = new URL(connectionUrl);
    maintenanceUrl.pathname = `/${databaseName}`;
    maintenanceUrl.searchParams.delete('schema');
    const client = new Client({ connectionString: maintenanceUrl.toString() });
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
    }
  }

  const connectionErrors = lastError?.errors?.map((error) => error.message).filter(Boolean);
  const connectionMessage = connectionErrors?.join('; ') || lastError?.message || 'connection failed';
  throw new Error(
    `Cannot connect to local PostgreSQL (${connectionMessage}). Start PostgreSQL and check server/.env.`,
  );
};

const main = async () => {
  const envPath = path.join(SERVER_ROOT, '.env');
  const baseDatabaseUrl = process.env.DATABASE_URL;
  if (!baseDatabaseUrl) {
    const envHint = existsSync(envPath) ? 'server/.env has no DATABASE_URL.' : 'server/.env is missing.';
    throw new Error(`${envHint} Copy server/.env.example and configure a local PostgreSQL connection.`);
  }

  let baseUrl;
  try {
    baseUrl = new URL(baseDatabaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(baseUrl.protocol)) {
    throw new Error('The local promotion checks require a PostgreSQL DATABASE_URL.');
  }
  if (!LOCAL_POSTGRES_HOSTS.has(baseUrl.hostname)) {
    throw new Error(
      'The promotion database must be local. Use localhost, 127.0.0.1, or ::1 in DATABASE_URL.',
    );
  }

  process.stdout.write('Checking formatting for tracked source files...\n');
  run(['run', 'check:format'], baseDatabaseUrl);

  const temporaryDatabase = `brightloop_ci_${process.pid}_${randomBytes(4).toString('hex')}`;
  const maintenanceClient = await connectToMaintenanceDatabase(baseDatabaseUrl);
  let databaseCreated = false;

  try {
    await maintenanceClient.query(`CREATE DATABASE "${temporaryDatabase}"`);
    databaseCreated = true;
    process.stdout.write(`Created fresh local database ${temporaryDatabase}.\n`);

    const testDatabaseUrl = new URL(baseDatabaseUrl);
    testDatabaseUrl.pathname = `/${temporaryDatabase}`;

    process.stdout.write('Applying migrations to the fresh database...\n');
    run(['--prefix', 'server', 'run', 'db:migrate:deploy'], testDatabaseUrl.toString());

    process.stdout.write('Generating the Prisma client...\n');
    run(['--prefix', 'server', 'run', 'db:generate'], testDatabaseUrl.toString());

    process.stdout.write('Running server tests...\n');
    run(['--prefix', 'server', 'test'], testDatabaseUrl.toString());

    process.stdout.write('Building the client...\n');
    run(['--prefix', 'client', 'run', 'build'], testDatabaseUrl.toString());
  } finally {
    try {
      if (databaseCreated) {
        process.stdout.write(`Removing temporary database ${temporaryDatabase}...\n`);
        await maintenanceClient.query(`DROP DATABASE IF EXISTS "${temporaryDatabase}" WITH (FORCE)`);
      }
    } finally {
      await maintenanceClient.end();
    }
  }

  process.stdout.write('All local promotion checks passed.\n');
};

main().catch((error) => {
  process.stderr.write(`Local CI failed: ${error.message}\n`);
  process.exitCode = 1;
});
