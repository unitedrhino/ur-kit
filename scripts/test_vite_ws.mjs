// 本文件执行应用真实 Vite 配置中的代理选项，以本机 Upgrade 验证开发链路。
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHTTPServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { SourceTextModule, SyntheticModule } from 'node:vm';

/** 可由开发机指定已安装 Vite 的入口，默认使用本仓 devDependency，不复制依赖。 */
const viteEntry = process.env.UR_KIT_TEST_VITE_MODULE;
const { createServer } = await import(viteEntry ? pathToFileURL(viteEntry).href : 'vite');
/** 使用临时空站点隔离依赖扫描，测试范围仅为实际配置返回的代理。 */
const fixture = await mkdtemp(join(tmpdir(), 'ur-kit-vite-ws-'));
/** 本机平台替身完成标准握手，向应用侧发送一条真实 WS 文本帧。 */
const upstream = createHTTPServer((_, response) => { response.writeHead(404); response.end(); });
const sockets = new Set();
upstream.on('upgrade', (request, socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.on('error', () => {});
  socket.on('data', () => socket.end());
  const accept = createHash('sha1').update(request.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const payload = Buffer.from('{"type":"connected"}');
  socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]));
});
await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
/** 将现有配置工厂作为模块执行；替身仅隔离 UI 构建设施，不改代理选项。 */
async function loadProxyConfig() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const filename = 'apps/iot-basic/web/vite.config.mts';
  const source = process.env.UR_KIT_WS_CONFIG_REF
    ? execFileSync('git', ['show', `${process.env.UR_KIT_WS_CONFIG_REF}:${filename}`], { cwd: root, encoding: 'utf8' })
    : await readFile(join(root, filename), 'utf8');
  const backend = `http://127.0.0.1:${upstream.address().port}`;
  const previous = process.env.BACKEND_URL;
  process.env.BACKEND_URL = backend;
  try {
    const module = new SourceTextModule(stripTypeScriptTypes(source));
    await module.link(async specifier => {
      const exports = specifier === '@vben/vite-config' ? { defineConfig: callback => callback }
        : specifier === 'node:path' ? { resolve }
        : specifier === 'sass' ? { NodePackageImporter: class {} }
        : specifier === 'vite' ? { loadEnv: () => ({ VITE_GLOB_API_URL: backend, VITE_PORT: 0 }) }
        : (() => { throw new Error(`配置增加了尚未识别的导入：${specifier}`); })();
      return new SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
      });
    });
    await module.evaluate();
    return (await module.namespace.default({ mode: 'development' })).vite.server;
  } finally {
    if (previous === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = previous;
  }
}
let vite;
try {
  const server = await loadProxyConfig();
  vite = await createServer({ configFile: false, root: fixture, logLevel: 'error', server: { ...server, host: '127.0.0.1', port: 0 } });
  await vite.listen();
  const address = vite.httpServer.address();
  const message = await new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/api/v1/system/common/websocket/connect?token=local-test`);
    const timer = setTimeout(() => { socket.close(); reject(new Error('Vite 未完成 WS Upgrade')); }, 2000);
    socket.onmessage = event => { clearTimeout(timer); socket.close(); resolve(event.data); };
    socket.onerror = () => { clearTimeout(timer); reject(new Error('Vite WS 连接失败')); };
  });
  assert.equal(JSON.parse(message).type, 'connected');
  console.log('真实 Vite /api 代理完成 WS Upgrade 并收到平台帧');
} finally {
  await vite?.close();
  for (const socket of sockets) socket.destroy();
  await new Promise(resolve => upstream.close(resolve));
  await rm(fixture, { recursive: true, force: true });
}
