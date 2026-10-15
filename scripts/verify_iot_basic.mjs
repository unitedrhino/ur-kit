// 本文件核对 IoT 基础应用固定的合同与共享 Web 包快照，防止不同 SaaS 来源被意外混用。
import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// ROOT 定位 ur-kit 仓库根目录，不依赖执行命令时的工作目录。
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// LOCK 保存应用确认过的合同与共享包内容摘要。
const LOCK = path.join(ROOT, 'apps/iot-basic/ur-kit.lock.json');
// SHARED 保存 SaaS 固定提交导出的 Web 共享包。
const SHARED = path.join(ROOT, 'web-shared');
// CONTRACTS 保存 SaaS 固定提交导出的 API 与 proto 清单。
const CONTRACTS = path.join(ROOT, 'contracts/manifest.json');
// APP_MANIFESTS 列出必须独立安装的 Web 与 uni-app 依赖声明。
const APP_MANIFESTS = [
  path.join(ROOT, 'apps/iot-basic/web/package.json'),
  path.join(ROOT, 'apps/iot-basic/mobile/package.json'),
];
// APP_ENV_FILES 列出 Web 各构建模式的应用身份配置，必须与共享登录路由约定一致。
const APP_ENV_FILES = ['.env.development', '.env.test', '.env.production'];

// verifyAppIdentity 防止构建模式覆盖应用名，使登录后组织前缀路由失效。
async function verifyAppIdentity() {
  for (const filename of APP_ENV_FILES) {
    const envPath = path.join(ROOT, 'apps/iot-basic/web', filename);
    const content = await readFile(envPath, 'utf8');
    const appName = content.match(/^VITE_GLOB_APPNAME=(.*)$/m)?.[1]?.trim();
    if (appName !== 'org-iot-client') {
      throw new Error(`${envPath}: VITE_GLOB_APPNAME 必须是 org-iot-client`);
    }
  }
}

// verifyAppDependencies 禁止应用通过工作区浮动版本或仓外路径依赖 SaaS 源码。
async function verifyAppDependencies() {
  for (const manifestPath of APP_MANIFESTS) {
    const manifest = JSON.parse(await readFile(manifestPath));
    for (const kind of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const [name, version] of Object.entries(manifest[kind] ?? {})) {
        if (typeof version !== 'string') {
          throw new Error(`${manifestPath}: ${name} 的依赖版本无效`);
        }
        if (version.startsWith('workspace:')) {
          throw new Error(`${manifestPath}: ${name} 使用未锁定的工作区依赖`);
        }
        if (!version.startsWith('link:') && !version.startsWith('file:')) {
          continue;
        }
        const target = path.resolve(path.dirname(manifestPath), version.slice(version.indexOf(':') + 1));
        const withinRoot = path.relative(ROOT, target);
        if (withinRoot === '..' || withinRoot.startsWith(`..${path.sep}`) || path.isAbsolute(withinRoot)) {
          throw new Error(`${manifestPath}: ${name} 指向 ur-kit 仓库外`);
        }
        if (!(await stat(target)).isDirectory()) {
          throw new Error(`${manifestPath}: ${name} 的本地依赖不是目录`);
        }
        const resolved = path.relative(ROOT, await realpath(target));
        if (resolved === '..' || resolved.startsWith(`..${path.sep}`) || path.isAbsolute(resolved)) {
          throw new Error(`${manifestPath}: ${name} 经符号链接指向 ur-kit 仓库外`);
        }
      }
    }
  }
}

// sourceFiles 列出共享包可发布的普通文件，过滤安装和构建产生的临时目录。
async function sourceFiles(relative = '') {
  const entries = await readdir(path.join(SHARED, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo' || name === 'packages/api/CodeGenerator') {
        continue;
      }
      files.push(...await sourceFiles(name));
    } else if (entry.isFile()) {
      if (!entry.name.endsWith('.tsbuildinfo')) {
        files.push(name);
      }
    } else {
      throw new Error(`共享包存在非普通文件: ${name}`);
    }
  }
  return files;
}

// sha256 返回文件内容摘要，锁文件按完整内容比较而非仅比较来源提交名。
function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

// snapshotHash 逐项计入相对路径和内容摘要，检测文件新增、删除与内容变化。
async function snapshotHash() {
  const hash = createHash('sha256');
  const files = await sourceFiles();
  files.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  for (const name of files) {
    hash.update(name);
    hash.update('\0');
    hash.update(sha256(await readFile(path.join(SHARED, name))));
    hash.update('\n');
  }
  return hash.digest('hex');
}

// currentLock 读取当前快照并生成待核对的来源提交与内容摘要。
async function currentLock() {
  const manifestBytes = await readFile(CONTRACTS);
  const manifest = JSON.parse(manifestBytes);
  const source = JSON.parse(await readFile(path.join(SHARED, 'source.json')));
  if (!/^[0-9a-f]{40}$/.test(manifest.saas_commit) || !/^[0-9a-f]{40}$/.test(source.saasCommit)) {
    throw new Error('合同或共享包来源提交格式无效');
  }
  return {
    contractsSaasCommit: manifest.saas_commit,
    contractsManifestSHA256: sha256(manifestBytes),
    webSharedSaasCommit: source.saasCommit,
    webSharedSHA256: await snapshotHash(),
  };
}

// main 输出当前锁或核对已提交锁；更新锁必须由开发者显式审阅并提交。
async function main() {
  await verifyAppIdentity();
  await verifyAppDependencies();
  const actual = await currentLock();
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--print') {
    process.stdout.write(`${JSON.stringify(actual, null, 2)}\n`);
    return;
  }
  if (args.length !== 0 && !(args.length === 2 && args[0] === '--lock')) {
    throw new Error('用法: node scripts/verify_iot_basic.mjs [--print | --lock <文件>]');
  }
  const lockPath = args[0] === '--lock' ? args[1] : LOCK;
  const expected = JSON.parse(await readFile(lockPath));
  for (const [key, value] of Object.entries(actual)) {
    if (expected[key] !== value) {
      throw new Error(`IoT 基础应用版本锁不匹配: ${key}`);
    }
  }
  process.stdout.write(`IoT 基础应用合同与共享包版本锁验证通过: ${actual.webSharedSHA256}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
