# OpenAPI Generated Code

此目录由 `codegen.js` 自动生成，**禁止手动修改**，`generated/` 不进入 Git。脚本先核对固定 SaaS 提交的 Swagger SHA-256，再使用独立锁文件安装的 CLI 与 `openapitools.json` 指定的生成器版本，在临时目录完成 Core/Things 两组客户端；任一组失败时保留原有生成结果。

## 重新生成

```bash
pnpm --dir apps/iot-basic/mobile codegen
```

首次生成前，在 `apps/iot-basic/mobile` 执行 `pnpm install --ignore-workspace --frozen-lockfile` 并安装 Java 运行时。

固定 Swagger 的 `DataAreaDetail`、`DeviceSchemaUpdateReq` 有匿名属性，两个批量返回模型把任意 JSON 元素写为 `invalid/UNKNOWN`。脚本仅在已校验哈希的临时副本中移除匿名属性，并把这两处元素视为任意 JSON；上游模型变化时中止，需重新核对合同。生成后运行 `pnpm tsc` 检查完整 TypeScript 客户端。

## 使用规则

- 仅在 `data/repositories/` 和 `data/mappers/` 中引用生成的 DTOs
- 不得在 `domain/`、`services/`、`providers/`、`pages/`、`components/` 中直接引用
