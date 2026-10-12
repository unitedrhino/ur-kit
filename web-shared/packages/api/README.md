# API 代码生成器

这个工具用于通过 Apifox 开放 API 批量生成和整合多个 OpenAPI 规范的 TypeScript 代码。

## 功能特性

- 🚀 批量生成多个 API 的 TypeScript 代码
- 🔧 使用 OpenAPI Generator CLI 工具
- 📁 自动整合生成的文件到 src 目录
- ⚙️ 可配置的生成参数
- 📊 详细的执行日志
- 🔑 **使用 Apifox 开放 API 获取 OpenAPI 数据**
- 🎯 **支持多项目批量生成**
- 🧹 **自动清理之前的生成文件，确保干净的生成环境**
- 📂 **按模块分文件夹组织 apis 和 models**

## 使用方法

### 1. 获取 Apifox Access Token

首次运行时需要提供 Apifox API Access Token：

1. 打开 Apifox
2. 点击头像 -> 账号设置 -> API 访问令牌
3. 点击"新建令牌"，设置名称和有效期
4. 复制生成的令牌（仅显示一次，请妥善保存）

详细说明: https://apifox-openapi.apifox.cn/doc-4296599

### 2. 配置项目列表

在 `api-config.json` 文件中配置 Apifox 项目：

```json
{
  "apifox": {
    "apiVersion": "2024-03-28",
    "oasVersion": "3.0"
  },
  "projects": [
    { "id": "2", "title": "联犀-things模块", "modelName": "things" },
    { "id": "3", "title": "联犀-core模块", "modelName": "core" },
    { "id": "4", "title": "联犀-sale模块", "modelName": "sale" }
  ],
  "openapiGenerator": { ... },
  "output": { ... }
}
```

### 3. 运行生成脚本

```bash
# 在项目根目录运行（推荐）
pnpm codegen

# 或在 api 目录下运行
cd packages/api
pnpm codegen
# 或者
node codegen.js
```

首次运行时会提示输入 Access Token，之后会自动保存到 `.apifox-token` 文件。

### 4. 查看生成结果

生成的文件将保存在以下位置：

- `./CodeGenerator/[modelName]/` - 原始生成的文件
- `./src/[modelName]/` - 每个模块直接放在 src 下
- `./src/[modelName]/models/` - 模块的模型文件
- `./src/[modelName]/apis/` - 模块的 API 文件
- `./src/[modelName]/index.ts` - 模块的 index.ts
- `./src/base.ts` - 写死提供的基础配置文件（从第一个模块获取）
- `./src/index.ts` - 主入口文件，导出 base.ts 和所有模块

## 配置说明

### Apifox 配置 (apifox)

| 字段       | 说明                            | 默认值       |
| ---------- | ------------------------------- | ------------ |
| apiVersion | Apifox API 版本                 | 2024-03-28   |
| oasVersion | OpenAPI 规范版本 (2.0/3.0/3.1)  | 3.0          |

### 项目配置 (projects)

| 字段      | 说明                                     | 必填 | 默认值 |
| --------- | ---------------------------------------- | ---- | ------ |
| id        | Apifox 项目 ID                           | ✅   | -      |
| title     | 可视化名称，用于日志输出                 | ❌   | 同 modelName |
| modelName | 模块目录名，用于生成目录                 | ✅   | -      |
| enabled   | 是否启用此项目生成                       | ❌   | true   |

**如何获取项目 ID:**

在 Apifox 中打开项目，URL 中的数字即为项目 ID，例如：
`https://app.apifox.com/project/123456` 中的 `123456`

### OpenAPI 生成器配置 (openapiGenerator)

| 字段                 | 说明           | 默认值               |
| -------------------- | -------------- | -------------------- |
| templateDir          | 模板文件目录   | "./typescript-axios" |
| additionalProperties | 生成器额外属性 | 见配置文件           |

#### 重要配置参数说明

- `generateSourceCodeOnly=true` - 只生成源代码，不生成文档和配置文件
- `withSeparateModelsAndApi=true` - 分离模型和 API 文件到不同目录
- `apiPackage=apis` - API 文件放在 apis 目录
- `modelPackage=models` - 模型文件放在 models 目录
- `removeOperationIdPrefix=true` - 移除操作 ID 前缀
- `useSingleRequestParameter=false` - 不使用单一请求参数
- `legacyDiscriminatorBehavior=false` - 不使用旧的鉴别器行为

### 输出配置 (output)

| 字段      | 说明         | 默认值         |
| --------- | ------------ | -------------- |
| srcDir    | 源码根目录   | "./src"        |
| modelsDir | 模型文件目录 | "./src/models" |
| apisDir   | API 文件目录 | "./src/apis"   |

## Token 管理

### Token 存储

Access Token 保存在 `.apifox-token` 文件中（已加入 .gitignore）。

### 更新 Token

如果 Token 过期或需要更换，删除 `.apifox-token` 文件后重新运行脚本：

```bash
rm packages/api/.apifox-token
pnpm codegen
```

## 自动清理机制

脚本会在每次生成之前自动清理之前的文件，确保：

1. **清理 CodeGenerator 目录**: 删除之前生成的所有模块目录
2. **清理 src 目录**: 删除之前整合的文件
3. **清理 temp 目录**: 删除临时 OpenAPI JSON 文件
4. **干净的生成环境**: 避免旧文件干扰新的生成结果

## 手动清理（可选）

如果需要手动清理，也可以使用：

```bash
npm run cleanup
```

## 文件整合规则

1. **模块目录**: 每个模块直接放在 src 下，包含 models、apis、api.ts、index.ts
2. **base.ts**: 写死提供的基础配置文件，从第一个模块获取内容
3. **index.ts**: 主入口文件，导出 base.ts 和所有模块（驼峰命名）
4. **模块命名**: 自动转换为驼峰命名，如 `things-ee` → `ThingsEeApi`
5. **每个模块**: 不再包含 base.ts，但包含 api.ts 文件

## 最终文件结构

运行脚本后，你将得到以下文件结构：

```
src/
├── base.ts                    # 写死提供的基础配置文件（从第一个模块获取）
├── index.ts                   # 主入口文件：导出 base.ts 和所有模块
├── core/                      # core 模块
│   ├── models/               # 模型文件
│   ├── apis/                 # API 文件
│   ├── api.ts                # 模块的 api.ts 文件
│   └── index.ts              # 模块的 index.ts
├── sale/                      # sale 模块
│   ├── models/               # 模型文件
│   ├── apis/                 # API 文件
│   ├── api.ts                # 模块的 api.ts 文件
│   └── index.ts              # 模块的 index.ts
├── things/                    # things 模块
│   ├── models/               # 模型文件
│   ├── apis/                 # API 文件
│   ├── api.ts                # 模块的 api.ts 文件
│   └── index.ts              # 模块的 index.ts
└── things-ee/                 # things-ee 模块
    ├── models/               # 模型文件
    ├── apis/                 # API 文件
    ├── api.ts                # 模块的 api.ts 文件
    └── index.ts              # 模块的 index.ts
```

## 依赖要求

- Node.js 18+
- OpenAPI Generator CLI (会自动安装)
- node-fetch (用于调用 Apifox API)

## 故障排除

### OpenAPI Generator CLI 安装失败

```bash
# 手动安装
npm install -g @openapitools/openapi-generator-cli
```

### 权限问题

```bash
# 使用 sudo 安装全局包
sudo npm install -g @openapitools/openapi-generator-cli
```

### Token 无效或过期

```bash
# 删除 token 文件重新输入
rm .apifox-token
pnpm codegen
```

### API 请求失败

- 检查网络连接
- 确认 Access Token 有效
- 确认项目 ID 正确
- 检查 Apifox 项目权限

## 示例输出

```
🚀 开始批量生成 API...

📋 加载配置完成，发现 4 个项目配置
🔑 已从本地文件加载 token
🧹 生成前清理之前的文件...
   删除目录: things
   删除目录: core
✅ 清理完成，删除了 2 个 CodeGenerator 目录
   删除 src 目录
✅ src 目录清理完成

🔧 正在生成 API 配置...
   📋 配置: 联犀-things模块 (ID: 2) -> ./CodeGenerator/things
   📋 配置: 联犀-core模块 (ID: 3) -> ./CodeGenerator/core
   📋 配置: 联犀-sale模块 (ID: 4) -> ./CodeGenerator/sale
   📋 配置: 联犀-admin模块 (ID: 5) -> ./CodeGenerator/admin
✅ 成功生成 4 个 API 配置

🚀 正在生成 联犀-things模块 的 API...
   项目 ID: 2
   模块名: things
   输出目录: ./CodeGenerator/things
   📥 正在从 Apifox 导出 OpenAPI 数据...
   ✅ OpenAPI 数据获取成功
   💾 已保存到临时文件: ./temp/things-openapi.json
   🔨 执行 OpenAPI Generator...
✅ 联犀-things模块 API 生成完成

📊 API 生成统计: 4/4 成功

🔧 开始整合文件到 src 目录...
📂 发现 4 个生成目录

📁 处理 core 目录...
   发现 12 个模型文件
   📋 复制模型文件: CoreModel.ts -> core/models/
   发现 6 个 API 文件
   📋 复制 API 文件: CoreApi.ts -> core/apis/
   📋 复制 api.ts -> core/
   📋 复制 index.ts -> core/
   📋 获取 base.ts 内容来自: core (将用于写死提供)

🎉 所有文件整合完成！

✅ 写死提供 base.ts 完成 (./src/base.ts)
✅ 生成 src/index.ts 完成 (./src/index.ts)
🧹 临时文件清理完成

✨ 代码生成任务完成！
```
