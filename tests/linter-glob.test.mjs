import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
const { getRootDirs } = pluginRequire('./utils/get-root-dirs.js');

test('Next linter keeps default, explicit, wildcard, brace and array root discovery', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'retrykit-lint-'));
  const slash = value => value.replace(/\\/g, '/').replace(/\/$/, '');
  const a = slash(path.join(root, 'apps', 'alpha'));
  const b = slash(path.join(root, 'apps', 'beta'));
  fs.mkdirSync(a, { recursive: true });
  fs.mkdirSync(b, { recursive: true });
  fs.writeFileSync(path.join(root, 'apps', 'not-a-directory'), 'fixture');
  const roots = rootDir => getRootDirs({ cwd: root, settings: { next: { rootDir } } }).map(value => slash(path.resolve(value))).sort();
  try {
    assert.deepEqual(roots(undefined), [slash(root)]);
    assert.deepEqual(roots(a), [a]);
    assert.deepEqual(roots(slash(root) + '/apps/*'), [a, b]);
    assert.deepEqual(roots(slash(root) + '/apps/{alpha,beta}'), [a, b]);
    assert.deepEqual(roots([a, b]), [a, b]);
    assert.deepEqual(roots(slash(root) + '/missing/*'), []);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Next uses the audited tinyglobby replacement, with no braces dependency', () => {
  const resolved = pluginRequire.resolve('fast-glob');
  assert.match(fs.readFileSync(path.join(path.dirname(resolved), '..', 'package.json'), 'utf8'), /"name":\s*"tinyglobby"/);
  assert.throws(() => require.resolve('braces'), { code: 'MODULE_NOT_FOUND' });
});


