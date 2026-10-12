/**
 * Schema 版本迁移注册表
 *
 * 提供 schema 版本升级的链式迁移框架。
 * Phase 1 不注册任何迁移，仅预留扩展入口。
 */

import type { GoviewSchema } from './types';
import { CURRENT_SCHEMA_VERSION } from './types';
import { cloneDeep } from 'lodash';
import { sanitizeTemplateRuntimeForScreen } from '../template-runtime-sanitize';

/** 迁移函数类型 */
type MigrationFn = (schema: any) => any;

/** 迁移条目 */
interface MigrationEntry {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: MigrationFn;
}

/**
 * 迁移链，按版本顺序排列
 *
 * 示例（未来使用）：
 * {
 *   fromVersion: '1.0.0',
 *   toVersion: '1.1.0',
 *   description: '新增 requestIoTDeviceConfig 默认值',
 *   migrate: (schema) => {
 *     schema.componentList.forEach((comp: any) => {
 *       if (comp.request && !comp.request.requestIoTDeviceConfig) {
 *         comp.request.requestIoTDeviceConfig = { dataView: 'prop' };
 *       }
 *     });
 *     return schema;
 *   }
 * }
 */
const MIGRATION_CHAIN: MigrationEntry[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    description: '清理组件运行态快照字段（dataset、_lastDynamicDataset、_simplifiedData 运行态数据），统一 IoT 数据链路配置',
    migrate: sanitizeRuntimeSnapshots,
  },
];

function sanitizeRuntimeSnapshots(schema: any) {
  if (!Array.isArray(schema?.componentList)) return schema;
  return {
    ...schema,
    componentList: sanitizeTemplateRuntimeForScreen(schema.componentList),
  };
}

/**
 * 简单的语义化版本比较
 * 返回：正数 = a > b，0 = 相等，负数 = a < b
 */
function semverCompare(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * 将旧版本 Schema 迁移到当前版本
 *
 * 链式执行：按 MIGRATION_CHAIN 顺序依次应用匹配的迁移函数，
 * 直到 schema.version 达到 CURRENT_SCHEMA_VERSION。
 */
export function migrateSchema(schema: any): GoviewSchema {
  let current = cloneDeep(schema);

  // 无版本号视为最早版本
  if (!current.version) {
    current.version = '1.0.0';
  }

  if (current.version !== CURRENT_SCHEMA_VERSION) {
    for (const entry of MIGRATION_CHAIN) {
      if (
        semverCompare(current.version, entry.fromVersion) >= 0
        && semverCompare(current.version, entry.toVersion) < 0
      ) {
        current = entry.migrate(current);
        current.version = entry.toVersion;
      }
    }

    // 确保版本号正确
    current.version = CURRENT_SCHEMA_VERSION;
  }

  return current;
}
