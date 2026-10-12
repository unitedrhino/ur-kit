const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadBindConfirmDelayModule() {
  const sourcePath = path.join(root, 'src/services/bind-confirm-delay.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const fn = new Function('exports', 'module', output);
  fn(module.exports, module);
  return module.exports;
}

test('provision bind waits 5 seconds before a single bind attempt', async () => {
  const {
    BIND_CONFIRM_DELAY_MS,
    waitBeforeBind,
  } = loadBindConfirmDelayModule();
  let attempts = 0;
  const delays = [];

  await waitBeforeBind(
    async () => {
      attempts += 1;
    },
    {
      delay: async (ms) => {
        delays.push(ms);
      },
    },
  );

  assert.equal(BIND_CONFIRM_DELAY_MS, 5_000);
  assert.equal(attempts, 1);
  assert.deepEqual(delays, [5_000]);
});

test('provision bind does not retry after the delayed bind attempt fails', async () => {
  const { waitBeforeBind } = loadBindConfirmDelayModule();
  let attempts = 0;

  await assert.rejects(
    waitBeforeBind(
      async () => {
        attempts += 1;
        throw new Error('bind failed once');
      },
      {
        delay: async () => {},
      },
    ),
    /bind failed once/,
  );

  assert.equal(attempts, 1);
});
