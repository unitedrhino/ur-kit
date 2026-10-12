/**
 * 设备控制卡片 UI 映射服务：把后端物模型控制数据转换成本地卡片描述。
 */
import type {
  ActionItem,
  DeviceControlModel,
  PropertyItem,
  ThingModelDefine,
} from '../domain/models/device-control.model';

/** ControlCardItemKind 表示控制卡片中一行数据的来源类型。 */
export type ControlCardItemKind = 'action' | 'property';

/** ControlCardControlType 表示移动端当前支持渲染的卡片控件类型。 */
export type ControlCardControlType =
  | 'button'
  | 'enum'
  | 'input'
  | 'readonly'
  | 'slider'
  | 'switch'
  | 'timestamp';

/** ControlCardPropertyUiItem 描述物模型属性在卡片中的渲染信息。 */
export interface ControlCardPropertyUiItem {
  /** controlType 表示属性行应渲染成展示、开关、滑块或输入类控件。 */
  controlType: ControlCardControlType;
  /** identifier 表示属性在物模型中的唯一标识。 */
  identifier: string;
  /** kind 固定为 property，用于详情页区分属性行和行为行。 */
  kind: 'property';
  /** property 保留原始属性数据，便于下发控制和展示实时值。 */
  property: PropertyItem;
}

/** ControlCardActionUiItem 描述物模型行为在卡片中的按钮行信息。 */
export interface ControlCardActionUiItem {
  /** action 保留原始行为定义，用于执行行为或跳转参数页。 */
  action: ActionItem;
  /** controlType 固定为 button，表示行为在卡片中以按钮入口呈现。 */
  controlType: 'button';
  /** hasInput 表示行为是否存在入参，决定是否需要参数记忆或执行页。 */
  hasInput: boolean;
  /** identifier 表示行为在物模型中的唯一标识。 */
  identifier: string;
  /** kind 固定为 action，用于详情页区分属性行和行为行。 */
  kind: 'action';
}

/** ControlCardUiItem 是详情控制卡片可以渲染的属性行或行为行。 */
export type ControlCardUiItem = ControlCardActionUiItem | ControlCardPropertyUiItem;

/** DeviceControlCardUi 是设备详情页当前使用的本地卡片 UI 描述对象。 */
export interface DeviceControlCardUi {
  /** controlCard 聚合可读写属性和行为，可操作项按属性优先、行为随后排序。 */
  controlCard: {
    items: ControlCardUiItem[];
    title: string;
  };
  /** readonlyCard 聚合只读属性，用于详情页第一张物模型信息卡片。 */
  readonlyCard: {
    items: ControlCardPropertyUiItem[];
    title: string;
  };
  /** systemPropertyCard 聚合系统属性，用于设备设置页展示和控制。 */
  systemPropertyCard: {
    items: ControlCardPropertyUiItem[];
    title: string;
  };
}

/** getPropertyControlType 根据物模型 define 与读写模式选择移动端控件。 */
export function getPropertyControlType(
  define: ThingModelDefine,
  readonly: boolean,
): ControlCardControlType {
  if (readonly) return 'readonly';
  if (define.type === 'bool') return 'switch';
  if (define.type === 'enum') return 'enum';
  if (define.type === 'int' || define.type === 'float') return 'slider';
  if (define.type === 'timestamp') return 'timestamp';
  return 'input';
}

/** isSystemProperty 判断属性是否属于系统功能分组。 */
export function isSystemProperty(property: Pick<PropertyItem, 'funcGroup'>): boolean {
  return Number(property.funcGroup || 0) === 2;
}

/** buildWritableProperties 补齐没有最新上报值但可下发控制的物模型属性。 */
function buildWritableProperties(controlModel: DeviceControlModel | null): PropertyItem[] {
  if (!controlModel) return [];
  const merged = new Map<string, PropertyItem>();
  controlModel.properties
    .filter((property) => property.mode !== 'r')
    .forEach((property) => merged.set(property.identifier, property));
  controlModel.thingModel.properties
    .filter((property) => property.mode !== 'r')
    .forEach((property) => {
      if (merged.has(property.identifier)) return;
      merged.set(property.identifier, {
        identifier: property.identifier,
        name: property.name,
        mode: 'rw',
        define: property.define,
        funcGroup: property.funcGroup,
        value: null,
        timestamp: 0,
      });
    });
  return Array.from(merged.values());
}

/** buildDeviceControlCardUi 将控制模型拆成只读卡片和可操作卡片，后续可替换为后端 UI JSON。 */
export function buildDeviceControlCardUi(
  controlModel: DeviceControlModel | null,
): DeviceControlCardUi {
  const properties = controlModel?.properties || [];
  const writableProperties = buildWritableProperties(controlModel);
  const actions = controlModel?.actions || [];
  const normalWritableProperties = writableProperties.filter((property) => !isSystemProperty(property));
  const systemProperties = properties.filter((property) => isSystemProperty(property));
  const readonlyItems = properties
    .filter((property) => !isSystemProperty(property))
    .filter((property) => property.mode === 'r')
    .map((property) => ({
      controlType: getPropertyControlType(property.define, true),
      identifier: property.identifier,
      kind: 'property' as const,
      property,
    }));
  const writableItems = normalWritableProperties
    .map((property) => ({
      controlType: getPropertyControlType(property.define, false),
      identifier: property.identifier,
      kind: 'property' as const,
      property,
    }));
  const actionItems = actions.map((action) => ({
    action,
    controlType: 'button' as const,
    hasInput: action.input.length > 0,
    identifier: action.identifier,
    kind: 'action' as const,
  }));
  const systemPropertyItems = systemProperties.map((property) => ({
    controlType: getPropertyControlType(property.define, property.mode === 'r'),
    identifier: property.identifier,
    kind: 'property' as const,
    property,
  }));

  return {
    controlCard: {
      items: [...writableItems, ...actionItems],
      title: '控制',
    },
    readonlyCard: {
      items: readonlyItems,
      title: '只读属性',
    },
    systemPropertyCard: {
      items: systemPropertyItems,
      title: '系统功能',
    },
  };
}
