import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Document, Paragraph, Packer } from 'docx';
import mammoth from 'mammoth';
const require = createRequire(import.meta.url);

test('Word extraction and Mammoth CLI preserve Unicode text after parser upgrade', async () => {
  const text = 'Examuna regression: algebra 2 + 2 = 4. العربية';
  const buffer = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph(text)] }] }));
  assert.equal((await mammoth.extractRawText({ buffer })).value.trim(), text);
  const folder = await mkdtemp(path.join(os.tmpdir(), 'examuna-docx-'));
  try {
    const input = path.join(folder, 'fixture.docx');
    await writeFile(input, buffer);
    const cli = path.resolve(path.dirname(require.resolve('mammoth')), '../bin/mammoth');
    const output = spawnSync(process.execPath, [cli, input, '--output-format', 'html'], { encoding: 'utf8', timeout: 10000 });
    assert.ifError(output.error);
    assert.equal(output.status, 0, output.stderr);
    assert.ok(output.stdout.includes(text), output.stdout);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
