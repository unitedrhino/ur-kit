/** 执行原生及 H5 的真实成员分层代码，验证身份边界、退出合同及过期异步响应。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** 仅替换网络和项目详情边界，生产 Service、Repository、Mapper、Provider 均实际执行。 */
function setup(app, options = {}) {
  const root = path.resolve(__dirname, app === 'wechat' ? '../../wechat/miniprogram' : '../src');
  const calls = [];
  const fixture = { members: [{ projectID: 'family', targetID: 'member', authType: 3 }], ...options };
  const cache = new Map();
  const request = async (input) => {
    calls.push(input);
    const { url, data } = input;
    if (fixture.request) return fixture.request(input);
    if (url.endsWith('project/get-list')) {
      if (!data.targetID && fixture.listError) throw new Error('成员列表离线');
      const list = data.targetID ? fixture.members.filter(x => x.targetID === data.targetID) : fixture.members;
      return { list, total: list.length };
    }
    if (url.endsWith('project/delete')) {
      if (fixture.deleteError) throw new Error('退出请求失败');
      fixture.members = fixture.members.filter(x => x.targetID !== data.targetID);
    } else if (url.endsWith('project/create')) {
      fixture.members.push({ ...data });
    } else if (url.endsWith('/user-search')) {
      return { userID: 'candidate', userName: '候选用户' };
    } else if (!url.endsWith('project/update')) throw new Error('意外接口：' + url);
    return {};
  };
  const projectService = { getOne: async projectID => {
    if (fixture.project) return fixture.project(projectID);
    return { projectID, adminUserID: 'owner' };
  } };
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const source = fs.readFileSync(file, 'utf8');
    const js = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    } }).outputText;
    new Function('require', 'exports', js)((id) => {
      if (id.endsWith('/utils/request')) return { request };
      if (id.endsWith('/project.service')) return { projectService };
      return load(path.relative(root, path.resolve(path.dirname(file), id + '.ts')));
    }, exports);
    return exports;
  }
  const service = load('services/family-member.service.ts').familyMemberService;
  const provider = load('providers/family-member.provider.ts').familyMemberProvider;
  return { service, provider, fixture, calls };
}

for (const app of ['mobile-uniapp']) {
  test(app + ' 负责人可管理成员但不能退出或删除本人的负责人授权', async () => {
    const { provider, calls } = setup(app);
    await provider.initialize('family', 'owner');
    assert.equal(provider.getState().access.canManage, true);
    assert.equal(provider.getState().access.canLeave, false);
    await assert.rejects(provider.leave(), /直接成员/);
    await assert.rejects(provider.remove('owner'), /负责人/);
    assert.equal(calls.some(x => x.url.endsWith('/delete')), false);
    await provider.create('new-member', 3, '朋友');
    assert.ok(provider.getState().list.some(x => x.targetID === 'new-member'));
  });

  for (const authType of [1, 2, 3]) {
    test(app + ' 成员权限 ' + authType + ' 不能管理别人，退出仅删除本人字符串 ID 授权', async () => {
      const userID = '9007199254740993';
      const { provider, fixture, calls } = setup(app, { members: [{ projectID: 'family', targetID: userID, authType }] });
      await provider.initialize('family', userID);
      assert.equal(provider.getState().access.canManage, false);
      assert.equal(provider.getState().access.canLeave, true);
      await assert.rejects(provider.create('other', 1), /负责人/);
      await assert.rejects(provider.remove('other'), /负责人/);
      await assert.rejects(provider.updateRemark('other', ''), /负责人/);
      await provider.leave();
      const deletes = calls.filter(x => x.url.endsWith('/delete'));
      assert.deepEqual(deletes, [{ url: '/api/v1/things/data/project/delete', data: { projectID: 'family', targetID: userID, targetType: 'user' } }]);
      assert.deepEqual(fixture.members, []);
      assert.equal(provider.getState().access, null);
      assert.equal(provider.getState().projectID, '');
    });
  }

  test(app + ' 陌生账号及无效成员权限默认关闭全部变更入口', async () => {
    for (const authType of [undefined, 0, 9]) {
      const { provider, calls } = setup(app, { members: [{ projectID: 'family', targetID: 'stranger', authType }] });
      await provider.initialize('family', 'stranger');
      assert.equal(provider.getState().access, null);
      assert.match(provider.getState().error, /尚未加入/);
      await assert.rejects(provider.leave(), /直接成员/);
      assert.equal(calls.some(x => x.url.endsWith('/delete')), false);
    }
  });

  test(app + ' 退出失败保留成员身份与原列表，不清空成功前状态', async () => {
    const { provider } = setup(app, { deleteError: true });
    await provider.initialize('family', 'member');
    await assert.rejects(provider.leave(), /退出请求失败/);
    assert.equal(provider.getState().access.canLeave, true);
    assert.equal(provider.getState().projectID, 'family');
    assert.equal(provider.getState().list.length, 1);
  });

  test(app + ' 服务端已撤销本人资格时再次退出不会发送删除', async () => {
    const { provider, fixture, calls } = setup(app);
    await provider.initialize('family', 'member');
    fixture.members = [];
    await assert.rejects(provider.leave(), /直接成员/);
    assert.equal(calls.some(x => x.url.endsWith('/delete')), false);
  });

  test(app + ' 同一家庭切换账号后，迟到的负责人响应不能恢复管理权限', async () => {
    let release;
    let count = 0;
    const { provider } = setup(app, { project: projectID => {
      if (++count === 1) return new Promise(resolve => { release = resolve; });
      return { projectID, adminUserID: 'owner' };
    } });
    const old = provider.initialize('family', 'owner');
    await provider.initialize('family', 'member');
    release({ projectID: 'family', adminUserID: 'owner' });
    await old;
    assert.equal(provider.getState().access.userID, 'member');
    assert.equal(provider.getState().access.canManage, false);
  });

  test(app + ' 资格查询失败不得保留上一个家庭的权限', async () => {
    const { provider, fixture } = setup(app);
    await provider.initialize('family', 'owner');
    fixture.project = () => { throw new Error('身份查询离线'); };
    await provider.initialize('other-family', 'owner');
    assert.equal(provider.getState().access, null);
    assert.match(provider.getState().error, /身份查询离线/);
    await assert.rejects(provider.create('other', 3), /负责人/);
  });

  test(app + ' 创建后的刷新失败向调用方报错，不显示旧列表为成功结果', async () => {
    const { provider, fixture } = setup(app);
    await provider.initialize('family', 'owner');
    fixture.listError = true;
    await assert.rejects(provider.create('new-member', 3), /成员列表离线/);
    assert.match(provider.getState().error, /成员列表离线/);
    assert.equal(provider.getState().pageState.loading, false);
  });

  test(app + ' 输入新账号时清除旧搜索对象', async () => {
    const { provider } = setup(app);
    await provider.initialize('family', 'owner');
    await provider.searchUser('old-account');
    assert.equal(provider.getState().searchedUser.userID, 'candidate');
    provider.clearSearch();
    assert.equal(provider.getState().searchedUser, null);
  });
}
