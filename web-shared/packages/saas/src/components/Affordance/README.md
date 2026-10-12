# Affordance 物模型数据定义组件

物模型（设备能力模型）中各类数据类型的表单定义组件集合，用于平台物联网应用中配置属性、事件、行为的参数结构。

## 目录结构

```
Affordance/
├── README.md           # 本文档
├── constants.ts        # 共享常量与工具函数
├── schema-types.ts     # 物模型类型定义（由 tygo 生成）
│
├── x-struct.vue        # 结构体参数表格（主入口）
├── x-struct-definition.vue  # 结构体递归定义（支持嵌套）
│
├── x-bool-definition.vue    # 布尔型数据定义
├── x-number-definition.vue  # 整数/浮点型数据定义
├── x-enum-definition.vue    # 枚举型数据定义（内嵌使用）
├── x-array-definition.vue   # 数组型数据定义
│
├── x-enum-mapping.vue  # 枚举映射（独立表单控件）
└── x-digital.vue       # 数字输入（独立表单控件）
```

## 组件分类

### 独立表单控件（与 ProForm 直接绑定）

| 组件 | 说明 | 数据路径示例 |
|------|------|--------------|
| `XStruct` | 结构体参数表格，编辑 `Spec[]` | `affordance.define.specs` |
| `XEnumMapping` | 枚举键值映射，编辑 `Record<string, string>` | `affordance.define.mapping` |
| `XDigital` | 数字输入 | `name`、`value` 等 |

### 数据定义子组件（v-model 嵌入使用）

用于 `XStruct` / `XStructDefinition` 表格中「数据定义」列，根据 `dataType.type` 动态渲染：

| 组件 | 数据类型 | 说明 |
|------|----------|------|
| `XBoolDefinition` | `bool` | 0/1 映射（关/开） |
| `XNumberDefinition` | `int` / `float` | 数值范围、初始值、步长、单位 |
| `XEnumDefinition` | `enum` | 枚举键值 + 描述，可增删行 |
| `XArrayDefinition` | `array` | 元素类型 + 嵌套定义 |
| `XStructDefinition` | `struct` | 递归结构体表格 |

简单类型（`string`、`timestamp`）在父组件内联渲染，无独立子组件。

## 使用方式

### 1. 在 ProForm 中使用 XStruct

```vue
<template>
  <ProForm :form="form" label-placement="left" label-width="auto">
    <XStruct path="affordance.define.specs" label="结构体" required />
  </ProForm>
</template>
```

- `path` 指向 `Spec[]` 数组
- 每个 `Spec` 含：`name`、`identifier`、`dataType`（Define）

### 2. 数据定义子组件的 v-model 约定

所有 `x-*-definition.vue` 均使用：

- **Props**：`modelValue: Define`
- **Emits**：`update:modelValue`，传入新的 `Define` 对象

父组件在 `@update:model-value` 中合并到当前 `Spec` 并调用 `writeSpecs` 同步表单。

## Define 数据结构

```ts
interface Define {
  type: DataType           // bool | int | float | string | enum | timestamp | array | struct
  mapping?: Record<string, string>  // bool/enum: 键值映射
  min?: string             // int/float: 最小值
  max?: string             // int/float/string: 最大值或长度
  start?: string           // 初始值
  step?: string            // 步长
  unit?: string            // 单位
  specs?: Spec[]           // struct: 子参数
  arrayInfo?: Define       // array: 元素定义
}
```

## 数据类型与 UI 对应

| 类型 | 数据定义 UI |
|------|-------------|
| `bool` | 两个输入：0 映射、1 映射 |
| `int` | 数值范围、初始值、步长、单位 |
| `float` | 同 int，精度 3 位小数 |
| `string` | 最大长度（字节，≤2048） |
| `enum` | 枚举键值 + 描述表格，支持添加/删除 |
| `timestamp` | 静态说明文案 |
| `array` | 元素类型选择 + 按类型渲染嵌套定义 |
| `struct` | 递归参数表格 |

## 常量与工具

- **DATA_TYPE_OPTIONS**：`NSelect` 的数据类型选项
- **initDefineByType(type)**：按类型生成默认 `Define`
- **IDENTIFIER_HINT**：参数名/标识符校验提示文案

## 依赖

- `naive-ui`：基础 UI 组件
- `pro-naive-ui`：ProForm、useProField
