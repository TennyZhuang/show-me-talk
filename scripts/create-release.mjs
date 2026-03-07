import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import packageJson from '../package.json' with { type: 'json' };

const execFileAsync = promisify(execFile);

const projectRoot = resolve(import.meta.dirname, '..');
const distDir = resolve(projectRoot, 'dist');
const releaseDir = resolve(projectRoot, 'release');
const outputFile = resolve(releaseDir, `show-me-talk-v${packageJson.version}-chrome.zip`);

await mkdir(dirname(outputFile), { recursive: true });

await execFileAsync('zip', ['-rq', outputFile, '.'], {
  cwd: distDir,
});

process.stdout.write(`${outputFile}\n`);
