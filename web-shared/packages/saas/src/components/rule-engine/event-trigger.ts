/**
 * 文件说明：项目规则任务的事件触发配置、主题字段校验和 AI 建议解析。
 */
import { $t } from '@vben/saas/locales';

/** EventRule 是一条消息体字段比较条件。 */
export interface EventRule {
  path: string;
  op: 'contains' | 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ne' | 'prefix' | 'suffix';
  value: string;
}

/** EventTriggerConfig 是表单状态，保持用户填写的数值文本直至保存。 */
export interface EventTriggerConfig {
  triggerType: 'schedule' | 'subscribe_message';
  subscribeTopic: string;
  topicMatch?: TopicMatch;
  /** legacyFilter 原样保留旧任务条件，普通信息编辑不得重写其匹配范围。 */
  legacyFilter?: string;
  logic: 'and' | 'or';
  rules: EventRule[];
}

/** TopicMatch 保存物模型标识及可选的产品、设备主题片段。 */
export interface TopicMatch {
  productID?: string;
  deviceName?: string;
  identifier?: string;
  actionID?: string;
}

/** ModelOption 是当前项目产品物模型中的一个可订阅条目。 */
export interface ModelOption {
  topic: string;
  productID: string;
  productName: string;
  identifier: string;
  name: string;
  params?: Array<{ identifier: string; name: string }>;
}

/** ProjectDeviceOption 是当前项目设备选择所需的字段。 */
export interface ProjectDeviceOption {
  productID: string;
  deviceName: string;
  deviceAlias?: string;
  productName?: string;
}

/** MODEL_TOPICS 是三类可按物模型标识精确订阅的主题。 */
export const MODEL_TOPICS = [
  { code: 'device.report.thing.event', label: 'iotApp.ruleTrigger.modelEvent', schemaType: 2, key: 'identifier' },
  { code: 'device.report.thing.action', label: 'iotApp.ruleTrigger.modelAction', schemaType: 3, key: 'actionID' },
  { code: 'device.report.thing.property', label: 'iotApp.ruleTrigger.modelProperty', schemaType: 1, key: 'identifier' },
] as const;

/** isModelTopic 判断主题是否支持物模型标识的精确选择。 */
export function isModelTopic(code: string): boolean {
  return MODEL_TOPICS.some((item) => item.code === code);
}

/** modelTopicKey 返回当前主题在 NATS 模板中的标识键。 */
export function modelTopicKey(code: string): 'actionID' | 'identifier' {
  return code === 'device.report.thing.action' ? 'actionID' : 'identifier';
}

/** EventTopic 是后端可订阅主题的最小展示合同。 */
export interface EventTopic {
  code: string;
  description: string;
  filterFields: Array<{ path: string; label: string }>;
}

/** EVENT_OPERATORS 与后端 matchRule 支持的运算符保持一致。 */
export const EVENT_OPERATORS = [
  { value: 'eq', label: 'iotApp.ruleTrigger.opEq' },
  { value: 'ne', label: 'iotApp.ruleTrigger.opNe' },
  { value: 'gt', label: 'iotApp.ruleTrigger.opGt' },
  { value: 'gte', label: 'iotApp.ruleTrigger.opGte' },
  { value: 'lt', label: 'iotApp.ruleTrigger.opLt' },
  { value: 'lte', label: 'iotApp.ruleTrigger.opLte' },
  { value: 'contains', label: 'iotApp.ruleTrigger.opContains' },
  { value: 'prefix', label: 'iotApp.ruleTrigger.opPrefix' },
  { value: 'suffix', label: 'iotApp.ruleTrigger.opSuffix' },
] as const;

/** operatorSet 用于在回填和保存前拒绝后端不支持的比较方式。 */
const operatorSet = new Set<string>(EVENT_OPERATORS.map((item) => item.value));
/** numericOperators 标识必须填写数值的比较方式。 */
const numericOperators = new Set<string>(['gt', 'gte', 'lt', 'lte']);
const topicToken = /^[^.*>\s]+$/;

/** emptyEventTrigger 返回新的表单状态，避免创建与编辑复用数组引用。 */
export function emptyEventTrigger(): EventTriggerConfig {
  return { triggerType: 'schedule', subscribeTopic: '', logic: 'and', rules: [] };
}

/** readEventTrigger 回读已保存条件；旧任务的无效过滤串不在界面里伪装成全量订阅。 */
export function readEventTrigger(task: { triggerType?: string; subscribeTopic?: string; subscribePayloadFilter?: string }, allowTopicOnly = false): EventTriggerConfig {
  const config = emptyEventTrigger();
  config.triggerType = task.triggerType === 'subscribe_message' ? 'subscribe_message' : 'schedule';
  config.subscribeTopic = task.subscribeTopic || '';
  if (config.triggerType !== 'subscribe_message') return config;
  if (!task.subscribePayloadFilter) {
    config.legacyFilter = '';
    return config;
  }
  try {
    const parsed = JSON.parse(task.subscribePayloadFilter);
    if (!['', 'and', 'or'].includes(parsed.logic ?? '')) throw new Error('已保存的条件逻辑无效');
    config.logic = parsed.logic === 'or' ? 'or' : 'and';
    if (!Array.isArray(parsed.rules)) throw new Error('已保存的事件条件格式无效');
    config.rules = parsed.rules.map((rule: Record<string, unknown>) => {
      if (!rule || typeof rule.path !== 'string' || !operatorSet.has(String(rule.op)) || !['string', 'number', 'boolean'].includes(typeof rule.value)) {
        throw new Error('已保存的条件字段无效');
      }
      return { path: rule.path, op: rule.op as EventRule['op'], value: String(rule.value) };
    });
    if (parsed.topicMatch) {
      if (typeof parsed.topicMatch !== 'object' || Array.isArray(parsed.topicMatch) || parsed.rules.length > 0) throw new Error('物模型主题选择无效');
      config.topicMatch = parsed.topicMatch as TopicMatch;
    } else if (!allowTopicOnly || parsed.rules.length > 0) {
      config.legacyFilter = task.subscribePayloadFilter;
    }
  } catch {
    throw new Error($t('iotApp.ruleTrigger.invalidSavedConditions'));
  }
  return config;
}

/** validateEventTrigger 校验主题、字段和值；参数字段限于属性或事件消息的 params 标识符。 */
export function validateEventTrigger(config: EventTriggerConfig, topics: EventTopic[], allowTopicOnly = false): void {
  if (config.triggerType !== 'subscribe_message') return;
  const topic = topics.find((item) => item.code === config.subscribeTopic);
  if (!topic) throw new Error($t('iotApp.ruleTrigger.unknownSource'));
  if (config.legacyFilter === undefined) {
    if (!isModelTopic(config.subscribeTopic)) return;
    const match = config.topicMatch;
    const identifier = match?.[modelTopicKey(config.subscribeTopic)];
    if (allowTopicOnly && !match) return;
    if (!match || match.productID && (typeof match.productID !== 'string' || !topicToken.test(match.productID)) || typeof identifier !== 'string' || !topicToken.test(identifier) || match.deviceName && (typeof match.deviceName !== 'string' || !topicToken.test(match.deviceName) || !match.productID)) {
      throw new Error($t('iotApp.ruleTrigger.invalidModel'));
    }
    return;
  }
  if (config.rules.length > 20) throw new Error($t('iotApp.ruleTrigger.tooManyConditions'));
  for (const rule of config.rules) {
    const known = topic.filterFields.some((field) => field.path === rule.path);
    const dynamic = ['device.report.thing.property.v2', 'device.report.thing.event'].includes(topic.code)
      && /^\$\.params\.[A-Za-z0-9_-]+$/.test(rule.path);
    if (!known && !dynamic) throw new Error($t('iotApp.ruleTrigger.fieldNotInSource', { field: rule.path || $t('iotApp.ruleTrigger.emptyField') }));
    if (!operatorSet.has(rule.op)) throw new Error($t('iotApp.ruleTrigger.invalidOperator'));
    if (rule.value.trim() === '') throw new Error($t('iotApp.ruleTrigger.valueRequired'));
    if (numericOperators.has(rule.op) && !Number.isFinite(Number(rule.value))) throw new Error($t('iotApp.ruleTrigger.numericRequired'));
  }
}

/** serializeEventTrigger 生成 clone-task 现有订阅合同；项目归属由服务端单独校验。 */
export function serializeEventTrigger(config: EventTriggerConfig, topics: EventTopic[], projectID = '', allowTopicOnly = false) {
  if (config.triggerType !== 'subscribe_message') return { triggerType: 'schedule' as const };
  validateEventTrigger(config, topics, allowTopicOnly);
  return {
    triggerType: 'subscribe_message' as const,
    subscribeTopic: config.subscribeTopic,
    subscribePayloadFilter: config.legacyFilter !== undefined ? config.legacyFilter : JSON.stringify({ logic: 'and', rules: [], ...(isModelTopic(config.subscribeTopic) && config.topicMatch ? { topicMatch: config.topicMatch } : {}) }),
    ...(projectID ? { scopeProjectID: projectID } : {}),
    scheduleType: 'none' as const,
  };
}

/** EventSuggestion 将唯一选择或待确认候选交给表单，不直接保存任务。 */
export interface EventSuggestion {
  config?: EventTriggerConfig;
  candidates: ModelOption[];
  deviceName?: string;
}

/** parseEventSuggestion 仅从当前项目真实物模型目录接受 AI 建议。 */
export function parseEventSuggestion(content: string, topics: EventTopic[], catalog: ModelOption[], devices: ProjectDeviceOption[], description = ''): EventSuggestion {
  const clean = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(clean);
  } catch {
    throw new Error($t('iotApp.ruleTrigger.aiNoSource'));
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.topic !== 'string' || !topics.some((item) => item.code === data.topic)) {
    throw new Error($t('iotApp.ruleTrigger.aiInvalidSource'));
  }
  const topic = data.topic;
  if (!isModelTopic(topic)) return { config: { ...emptyEventTrigger(), triggerType: 'subscribe_message', subscribeTopic: topic }, candidates: [] };
  if (typeof data.modelID !== 'string' || !data.modelID) throw new Error($t('iotApp.ruleTrigger.aiNoModel'));
  let candidates = catalog.filter((item) => item.topic === topic && (item.identifier === data.modelID || item.name === data.modelID));
  if (candidates.length === 0) throw new Error($t('iotApp.ruleTrigger.aiModelOutOfScope'));
  let deviceName: string | undefined;
  if (data.deviceName != null && data.deviceName !== '') {
    if (typeof data.deviceName !== 'string') throw new Error($t('iotApp.ruleTrigger.aiInvalidDevice'));
    const device = devices.find((item) => item.deviceName === data.deviceName || item.deviceAlias === data.deviceName);
    if (!device) throw new Error($t('iotApp.ruleTrigger.aiDeviceOutOfScope'));
    deviceName = device.deviceName;
    candidates = candidates.filter((item) => item.productID === device.productID);
  }
  if (candidates.length > 1) {
    const explicit = candidates.filter((item) => description.includes(item.productID) || description.includes(item.productName));
    if (explicit.length === 1) candidates = explicit;
  }
  if (candidates.length === 0) throw new Error($t('iotApp.ruleTrigger.deviceModelMismatch'));
  if (candidates.length > 1) return { candidates, deviceName };
  const chosen = candidates[0]!;
  return {
    candidates: [],
    config: {
      ...emptyEventTrigger(), triggerType: 'subscribe_message', subscribeTopic: topic,
      topicMatch: { productID: chosen.productID, ...(deviceName ? { deviceName } : {}), [modelTopicKey(topic)]: chosen.identifier },
    },
  };
}
