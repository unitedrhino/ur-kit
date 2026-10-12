/** 执行双端真实项目仓储，验证管理员不继承全量项目以及明确成员权限。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** load 加载生产仓储，仅替换网络与映射边界，不复制项目筛选算法。 */
function load(app, request) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/data/repositories/project.repository.impl.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('require', 'exports', js)(() => ({ request, ProjectMapper: { toEntity: x => x } }), exports);
  return new exports.ProjectRepositoryImpl();
}

for (const app of ['mobile']) {
  test(app + ' 管理员无成员资格时列表为空且缓存详情拒绝', async () => {
    const repo = load(app, async o => {
      if (o.url.endsWith('self/get-one')) return { userID: '1' };
      assert.equal(o.omitProjectContext, true);
      assert.notEqual(o.data.isGetAll, true);
      assert.ok(o.data.adminUserID === '1' || o.data.targetID === '1');
      return { total: 0, list: [] };
    });
    assert.deepEqual(await repo.getList({ page: 1, size: 20 }), { total: 0, list: [] });
    await assert.rejects(repo.getOne('old'), /尚未加入/);
  });

  test(app + ' 拥有者与明确成员取并集，忽略其他账号授权并保留服务端分页', async () => {
    const repo = load(app, async o => {
      if (o.url.endsWith('self/get-one')) return { userID: '1' };
      if (o.data.adminUserID) return { total: 1, list: [{ projectID: 'own', adminUserID: '1' }] };
      if (o.data.targetID) return { total: 3, list: [
        { projectID: 'member', targetID: '1', authType: 3 },
        { projectID: 'foreign', targetID: '2', authType: 1 },
        { projectID: 'invalid', targetID: '1', authType: 0 },
      ] };
      assert.deepEqual(o.data.projectIDs, ['own', 'member']);
      assert.deepEqual(o.data.page, { page: 2, size: 1 });
      assert.equal(o.data.projectName, '过滤');
      return { total: 2, list: [{ projectID: 'member' }] };
    });
    assert.deepEqual(await repo.getList({ page: 2, size: 1, projectName: '过滤' }), { total: 2, list: [{ projectID: 'member' }] });
  });

  test(app + ' 查询失败不降级为全量项目', async () => {
    const repo = load(app, async o => {
      if (o.url.endsWith('self/get-one')) return { userID: '1' };
      throw new Error('offline');
    });
    await assert.rejects(repo.getList({ page: 1, size: 20 }), /offline/);
  });
}
