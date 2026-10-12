import type { CloneEntity } from '../entities/clone.entity';

/**
 * Clone 仓储接口
 */
export interface ICloneRepository {
  /**
   * 获取 Clone 列表
   * @param filter 过滤条件
   * @param page 页码
   * @param pageSize 每页大小
   */
  getList(filter: CloneFilter, page?: number, pageSize?: number): Promise<CloneListResult>;
}

/**
 * Clone 过滤条件
 */
export interface CloneFilter {
  /** 按 CloneGroup ID 过滤 */
  cloneGroupID?: number;
  /** 按 Agent ID 过滤 */
  agentID?: number;
  /** 按名称模糊搜索 */
  name?: string;
  /** 按状态过滤 */
  status?: number;
  /** 按 code 精确查询 */
  code?: string;
}

/**
 * Clone 列表结果
 */
export interface CloneListResult {
  list: CloneEntity[];
  total: number;
}
