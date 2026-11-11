/** 场景动作与触发条件增删、重排及保存的回归验证。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load() {
  const source = fs.readFileSync(path.join(__dirname, '../src/providers/scene-edit.provider.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const saved = [];
  const dependencies = {
    '../domain/models/scene-condition.model': { createEmptyCondition: () => ({}) },
    '../services/scene.service': { sceneService: { validateScene: () => ({ valid: true, errors: [] }), create: async value => saved.push(value), update: async value => saved.push(value) } },
    '../services/area.service': { areaService: {} },
    './current-family.provider': { currentFamilyProvider: { getState: () => ({ projectID: '' }) } },
  };
  const exports = {};
  new Function('exports', 'require', js)(exports, id => { if (!(id in dependencies)) throw Error(id); return dependencies[id]; });
  return { provider: exports.sceneEditProvider, saved };
}
test('多动作重排、删除后追加并保存，顺序连续', async () => {
  const { provider, saved } = load();
  provider.addAction({ type: 'delay', order: 0, delay: 5 });
  provider.addAction({ type: 'delay', order: 0, delay: 10 });
  provider.reorderAction(0, 'down');
  provider.removeAction(1);
  provider.addAction({ type: 'delay', order: 0, delay: 15 });
  provider.addTrigger({ type: 'timer', order: 0 });
  provider.addTrigger({ type: 'timer', order: 0 });
  provider.removeTrigger(0);
  provider.addTrigger({ type: 'timer', order: 0 });
  await provider.save();
  assert.deepEqual(saved[0].actions.map(a => [a.delay, a.order]), [[10, 0], [15, 1]]);
  assert.deepEqual(saved[0].triggers.map(t => t.order), [0, 1]);
});
