# Core/Things 强类型 HTTP 客户端

`go/`、`java/`、`node/` 的 Core 与 Things 源码由仓库根目录 `contracts/source/backend/.swagger/` 的固定 SaaS 提交生成。生成器版本固定为 OpenAPI Generator `7.8.0`；源 Swagger 中三处无效字段只在生成用临时副本中修正，原始合同保留以便审计。

先在 `apps/iot-basic/mobile` 执行 `pnpm install --ignore-workspace --frozen-lockfile` 安装锁定生成器，然后在仓库根目录运行：

```bash
python3 scripts/generate_http_clients.py
go test ./sdks/openapi/...
cd sdks/openapi/node && npm ci && npm run build && npm test
```

Java Core 与 Things 分别是 `java/core` 和 `java/things` 的 Maven 项目，使用 JDK 17 执行 `mvn -DskipTests package`。Node 首批以 Git tag 获取源码，在 `node/` 构建后从本地 `dist/core` 或 `dist/things` 导入；`package.json` 的 `exports` 可供本地包依赖使用，尚未发布包仓。Go 可直接导入 `github.com/unitedrhino/ur-kit/sdks/openapi/go/core` 或 `.../things`。

生成客户端的请求模型保留旧数字 ID 列表供旧端兼容；JavaScript 后端需要传递超过 `2^53-1` 的列表 ID 时，使用 `alarmIDStrings`、`productCategoryIDStrings`、`categoryIDStrings`、`sceneIDStrings`。同一请求不能同时填写新旧列表。客户端的服务地址和认证头必须由调用方从配置注入，不写入公开仓。
