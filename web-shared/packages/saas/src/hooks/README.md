# Vue Query Hooks 使用说明

## 概述

使用 `@tanstack/vue-query` 替换了原有的 Pinia store 方案，实现了更强大的缓存、并发控制和数据管理功能。

## 架构变化

### 之前 (Pinia Store)

```
Component → Store → API → Backend
```

### 现在 (Vue Query)

```
Component → Hooks → Vue Query → API → Backend
          ↑
     QueryClient (缓存管理)
```

## 核心文件

### 1. `src/hooks/use-area-query.ts`

- 区域数据的查询 hook
- 包含树结构转换、自动选择、获取所有节点等工具函数
- 提供 `useAreaQuery()` 和 `getAreaList()` 函数

### 2. `src/hooks/use-group-query.ts`

- 建筑分组数据的查询 hook
- 支持不同 `purpose` 参数的独立缓存
- 提供 `useGroupQuery(purpose)` 和 `getGroupList(purpose)` 函数

### 3. `src/bootstrap.ts`

- 配置了 Vue Query 插件和 QueryClient
- 设置了全局缓存策略（5分钟新鲜期，10分钟缓存保留）

## 使用方式

### 1. 在组件中使用响应式查询

```vue
<script setup lang="ts">
import { useAreaQuery, useGroupQuery } from '#/hooks';

// 响应式查询，自动处理加载状态、错误状态、缓存等
const { data: areas, isLoading: areaLoading, error: areaError } = useAreaQuery();
const { data: groups, isLoading: groupLoading, error: groupError } = useGroupQuery('building');
</script>

<template>
  <div v-if="areaLoading">加载中...</div>
  <div v-else-if="areaError">加载失败: {{ areaError.message }}</div>
  <div v-else>
    <!-- 使用 areas 数据 -->
  </div>
</template>
```

### 2. 在 ApiTreeSelect 中使用同步函数

```vue
<script setup lang="ts">
import { getAreaList, getGroupList } from '#/hooks';

const formOptions = {
  schema: [
    {
      component: 'ApiTreeSelect',
      componentProps: {
        api: getAreaList, // 直接传递函数
        // ... 其他配置
      },
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        api: () => getGroupList('building'), // 带参数的调用
        // ... 其他配置
      },
    },
  ],
};
</script>
```

### 3. 在 electricity_report.vue 中的实际应用

```vue
<script setup lang="ts">
import { useAreaQuery, useGroupQuery, getAreaList, getGroupList } from '#/hooks';

// 预加载数据（后台自动缓存）
useAreaQuery();
useGroupQuery('building');

// 在表单配置中使用
const formOptions = {
  schema: [
    {
      component: 'ApiTreeSelect',
      dependencies: {
        componentProps(values) {
          return {
            api: values.node_type === 'area' ? getAreaList : () => getGroupList('building'),
            // ... 其他配置
          };
        },
      },
    },
  ],
};
</script>
```

## 缓存策略

### Vue Query 缓存

- **staleTime**: 5分钟 - 数据被视为新鲜的时间
- **gcTime**: 10分钟 - 缓存保留时间
- **重试策略**: 失败时重试1次
- **自动去重**: 相同查询键的并发请求会被合并

### localStorage 缓存

- 为 `getAreaList` 和 `getGroupList` 提供额外的本地缓存
- 缓存时间：5分钟
- 避免页面刷新后的重复请求

## 优势对比

### 🆚 相比 Pinia Store

| 特性     | Pinia Store      | Vue Query |
| -------- | ---------------- | --------- |
| 缓存管理 | 手动实现         | 自动管理  |
| 并发控制 | 需要手动处理     | 自动去重  |
| 加载状态 | 手动管理         | 自动提供  |
| 错误处理 | 手动实现         | 自动重试  |
| 数据更新 | 手动刷新         | 智能更新  |
| 内存管理 | 持久化           | 自动清理  |
| 开发体验 | 需要更多样板代码 | 开箱即用  |

### ✅ 主要优势

1. **自动缓存管理**: 无需手动管理缓存逻辑
2. **并发请求去重**: 多个组件使用相同数据时只发起一次请求
3. **智能重试机制**: 网络错误时自动重试
4. **响应式状态**: 自动提供 loading、error、data 状态
5. **内存优化**: 自动清理不再使用的缓存
6. **类型安全**: 完整的 TypeScript 支持
7. **DevTools 支持**: Vue Query DevTools 调试支持

### 🎯 解决的问题

1. **重复请求**: 页面多个组件使用相同数据时的重复请求
2. **缓存管理**: 自动处理缓存过期、更新等逻辑
3. **错误处理**: 统一的错误重试和处理机制
4. **加载状态**: 自动提供加载状态，无需手动管理
5. **数据同步**: 自动保持数据的最新状态

## 迁移说明

### 从 Store 迁移到 Hooks

1. **移除 store 文件**: 删除 `src/store/area.ts` 和 `src/store/group.ts`
2. **更新导入**: 将 `import { useAreaStore } from '#/store'` 改为 `import { useAreaQuery } from '#/hooks'`
3. **更新使用方式**:
   - `areaStore.getAreaList()` → `getAreaList()`
   - `groupStore.getGroupList('building')` → `getGroupList('building')`

### 渐进式迁移

可以逐步迁移不同的页面：

1. 先迁移一个页面测试效果
2. 验证缓存和性能表现
3. 逐步迁移其他使用相同数据的页面
4. 最后移除 store 代码

## 调试和监控

### Vue Query DevTools

```bash
# 安装 devtools（可选）
pnpm add @tanstack/vue-query-devtools
```

在开发环境中可以使用 Vue Query DevTools 来监控查询状态、缓存情况等。

### 控制台日志

hooks 中已经包含了详细的日志，可以在浏览器控制台中查看缓存命中情况。
