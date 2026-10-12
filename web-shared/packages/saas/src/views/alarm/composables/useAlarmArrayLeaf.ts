/**
 * 文件说明：告警条件数组属性叶子「属性 → 点位 → [成员]」级联选择的共享逻辑。
 * StepConditionNode 与 TriggerEditor 复用；dataID 采用点分路径（属性.点位[.成员]），
 * 后端 ParseDataID/评估链路按该路径定位测点。
 */
import type { LeafCondition, SchemaField } from '../types/alarm-v2.types';

/** ArrayLeafContext 数组叶子当前的级联上下文（字段 + 反解出的点位/成员）。 */
export interface ArrayLeafContext {
  field: SchemaField;
  hasPoint: boolean;
  point?: number;
  member?: string;
  /** 成员/元素的 valueType（用于比较符与聚合选项）。 */
  memberValueType?: string;
  memberUnit?: string;
  /** dataID 是否完整（有点位；结构体数组还需选成员）。 */
  complete: boolean;
}

/** arrayFieldOf 按字段路径前缀匹配叶子对应的数组属性字段。 */
export function arrayFieldOf(fields: SchemaField[], leaf: LeafCondition): SchemaField | undefined {
  if (leaf.sourceType !== 'property') return undefined;
  return fields.find(
    (field) => field.valueType === 'array' && Boolean(field.arrayMeta) && (leaf.dataID ?? '').startsWith(`${field.dataID}.`),
  );
}

/** arrayPointOptions 生成点位下拉选项（点位0..点位N-1）。 */
export function arrayPointOptions(field: SchemaField): Array<{ label: string; value: string }> {
  const max = field.arrayMeta?.max ?? 10;
  return Array.from({ length: max }, (_, index) => ({ label: `点位${index}`, value: String(index) }));
}

/** arrayMemberOptions 生成结构体成员下拉选项。 */
export function arrayMemberOptions(field: SchemaField): Array<{ label: string; value: string }> {
  return (field.arrayMeta?.specs ?? []).map((spec) => ({ label: spec.name, value: spec.identifier }));
}

/** arrayContextOf 反解叶子的数组级联上下文；叶子未选数组字段时返回 undefined。 */
export function arrayContextOf(fields: SchemaField[], leaf: LeafCondition): ArrayLeafContext | undefined {
  // 刚选中整字段时 dataID 精确等于字段 dataID
  const exact = fields.find(
    (field) => field.valueType === 'array' && field.arrayMeta && field.dataID === leaf.dataID,
  );
  if (exact?.arrayMeta) {
    return {
      field: exact,
      hasPoint: false,
      complete: false,
      memberValueType: exact.arrayMeta.elementValueType,
      memberUnit: exact.arrayMeta.elementUnit,
    };
  }
  const byPrefix = arrayFieldOf(fields, leaf);
  if (!byPrefix?.arrayMeta) return undefined;
  const rest = (leaf.dataID ?? '').slice(byPrefix.dataID.length + 1);
  const parts = rest.split('.');
  // 尾点占位（属性.）的点位段为空串，Number('') === 0 会误判成已选点位0
  const point = parts[0] === '' ? Number.NaN : Number(parts[0]);
  if (!Number.isInteger(point) || point < 0 || point >= byPrefix.arrayMeta.max) {
    return { field: byPrefix, hasPoint: false, complete: false, memberValueType: byPrefix.arrayMeta.elementValueType };
  }
  const member = byPrefix.arrayMeta.struct ? (parts[1] ?? '') : undefined;
  const spec = member ? byPrefix.arrayMeta.specs.find((item) => item.identifier === member) : undefined;
  return {
    field: byPrefix,
    hasPoint: true,
    point,
    member: member || undefined,
    memberValueType: member ? spec?.valueType : byPrefix.arrayMeta.elementValueType,
    memberUnit: member ? spec?.unit : byPrefix.arrayMeta.elementUnit,
    complete: byPrefix.arrayMeta.struct ? Boolean(member && spec) : true,
  };
}

/** buildArrayLeafPatch 用点位/成员生成叶子的更新补丁（dataID 拼点分路径）。
 *  memberValueType 一并返回，供组件按成员类型重置比较符与聚合方式。 */
export function buildArrayLeafPatch(
  ctx: ArrayLeafContext,
  point: number,
  member?: string,
): Partial<LeafCondition> & { memberValueType?: string } {
  const dataID = member
    ? `${ctx.field.dataID}.${point}.${member}`
    : `${ctx.field.dataID}.${point}`;
  const memberSpec = member ? ctx.field.arrayMeta?.specs.find((s) => s.identifier === member) : undefined;
  const memberValueType = member
    ? memberSpec?.valueType
    : ctx.field.arrayMeta?.elementValueType;
  return {
    dataID,
    dataName: `${ctx.field.name} 点位${point}${member ? ` ${member}` : ''}`,
    sourceType: 'property',
    memberValueType,
  };
}

/** arrayLeafTargetIncomplete 判断数组叶子是否尚未选完整（缺点位或结构体缺成员）。 */
export function arrayLeafTargetIncomplete(fields: SchemaField[], leaf: LeafCondition): boolean {
  const ctx = arrayContextOf(fields, leaf);
  return Boolean(ctx) && !ctx!.complete;
}
