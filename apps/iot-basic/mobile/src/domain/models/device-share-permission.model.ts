/** 将基础控制分组展开为后端支持的功能权限，排除系统功能和上行行为。 */
import type { ThingModelSchema } from './device-control.model';

/** buildBasicControlPermissions 返回按物模型标识索引的权限，只读属性3、可写属性及下行行为2。 */
export function buildBasicControlPermissions(model: ThingModelSchema): Record<string, { perm: number }> {
  /** permissions 是本次基础控制可授予的精确功能集合。 */
  const permissions: Record<string, { perm: number }> = {};
  model.properties.filter((item) => item.funcGroup !== 2).forEach((item) => {
    permissions[item.identifier] = { perm: item.mode === 'r' ? 3 : 2 };
  });
  model.actions.filter((item) => item.funcGroup !== 2 && item.dir === 'down').forEach((item) => {
    permissions[item.identifier] = { perm: 2 };
  });
  return permissions;
}
