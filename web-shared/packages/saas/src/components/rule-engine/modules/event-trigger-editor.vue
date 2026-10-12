<!-- 文件说明：项目规则任务按当前项目物模型选择精确订阅主题，并回显旧条件。 -->
<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import type { RuleEngineScope } from '../aitask.api';
import type { EventSuggestion, EventTopic, EventTriggerConfig, ModelOption, ProjectDeviceOption } from '../event-trigger';

import { computed, ref, watch } from 'vue';

import { CoreAi, ThingsApi } from '@vben/api';
import { message } from '@vben/saas';
import { $t } from '@vben/saas/locales';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Label } from '@unitedrhino/saas-ui/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unitedrhino/saas-ui/ui/select';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';

import { EVENT_OPERATORS, MODEL_TOPICS, isModelTopic, modelTopicKey, parseEventSuggestion, serializeEventTrigger } from '../event-trigger';

const props = defineProps<{
  /** 当前项目 ID 用于读取项目设备和限定任务执行范围。 */
  projectID?: string;
  /** 规则范围决定候选目录和项目归属约束。 */
  scope?: RuleEngineScope;
}>();
const scope = computed(() => props.scope || 'project');

/** model 保存尚未发布的事件主题选择。 */
const model = defineModel<EventTriggerConfig>({ required: true });
const topics = ref<EventTopic[]>([]);
const devices = ref<ProjectDeviceOption[]>([]);
const tenantProducts = ref<Array<{ id: string; name: string }>>([]);
const modelsByProduct = ref<Record<string, ModelOption[]>>({});
const loading = ref(false);
const generating = ref(false);
const description = ref('');
const reconfigureConfirm = ref(false);
const suggestion = ref<EventSuggestion | null>(null);
/** schemaRequests 合并同一个产品的物模型请求。 */
const schemaRequests = new Map<string, Promise<ModelOption[]>>();

/** products 从项目设备去重，避免列出本项目无法产生消息的产品。 */
const products = computed(() => {
  if (scope.value !== 'project') return tenantProducts.value;
  const unique = new Map<string, string>();
  for (const device of devices.value) unique.set(device.productID, device.productName || device.productID);
  return [...unique].map(([id, name]) => ({ id, name }));
});
/** modelTopicLabel 返回物模型主题的当前语言名称，未知主题保留接口说明。 */
function modelTopicLabel(code: string, fallback = ''): string {
  const key = MODEL_TOPICS.find((item) => item.code === code)?.label;
  return key ? $t(key) : fallback;
}
/** availableTopics 隐藏仅供旧任务兼容的批量属性主题。 */
const availableTopics = computed(() => topics.value.filter((item) => item.code !== 'device.report.thing.property.v2'));
const selectedProductID = computed(() => model.value.topicMatch?.productID || '');
const selectedDeviceName = computed(() => model.value.topicMatch?.deviceName || '');
const selectedModelID = computed(() => model.value.topicMatch?.[modelTopicKey(model.value.subscribeTopic)] || '');
/** selectedModels 在不限定产品时按标识符去重，同一标识可匹配当前项目多个产品。 */
const selectedModels = computed(() => {
  const models = selectedProductID.value ? modelsByProduct.value[selectedProductID.value] || [] : Object.values(modelsByProduct.value).flat();
  return [...new Map(models.filter((item) => item.topic === model.value.subscribeTopic).map((item) => [item.identifier, item])).values()];
});
const selectedDevices = computed(() => devices.value.filter((item) => item.productID === selectedProductID.value));
/** suggestionAllProducts 仅在所有候选共享同一主题标识时提供全部产品选择。 */
const suggestionAllProducts = computed(() => {
  const candidates = suggestion.value?.candidates || [];
  return !suggestion.value?.deviceName && candidates.length > 1 && candidates.every((item) => item.topic === candidates[0]?.topic && item.identifier === candidates[0]?.identifier);
});

/** loadTopics 只接受后端注册的消息主题。 */
async function loadTopics() {
  const result = await CoreAi.postApiV1AiCloneTaskGetSubscribeTopics();
  topics.value = (result?.list || []).map((item) => ({ code: item.code, description: item.description, filterFields: item.filterFields || [] }));
}

/** loadProjectDevices 分页读取当前项目设备及其物模型，选项不会混入其他项目。 */
async function loadProjectDevices() {
  const projectID = props.projectID;
  if (!projectID) return;
  const list: ProjectDeviceOption[] = [];
  let page = 1;
  while (true) {
    const result = await ThingsApi.postApiV1ThingsDeviceInfoGetList(
      { page: { page, size: 200 } }, { headers: { 'project-id': projectID } },
    );
    list.push(...(result?.list || []).filter((item) => item.productID && item.deviceName).map((item) => ({
      productID: item.productID!, deviceName: item.deviceName!, deviceAlias: item.deviceAlias, productName: item.productName,
    })));
    if ((result?.list?.length || 0) < 200 || Number(result?.total || 0) > 0 && list.length >= Number(result?.total)) break;
    page += 1;
  }
  if (projectID === props.projectID) {
    devices.value = list;
    await loadAllModels();
  }
}

/** loadTenantProducts 使用当前企业产品目录，允许尚未绑定项目设备的产品配置规则。 */
async function loadTenantProducts() {
  const list: Array<{ id: string; name: string }> = [];
  let page = 1;
  while (true) {
    const result = await ThingsApi.postApiV1ThingsProductInfoGetList({ page: { page, size: 200 } });
    list.push(...(result?.list || []).filter((item) => item.productID).map((item) => ({ id: item.productID!, name: item.productName || item.productID! })));
    if ((result?.list?.length || 0) < 200 || Number(result?.total || 0) > 0 && list.length >= Number(result?.total)) break;
    page += 1;
  }
  tenantProducts.value = list;
  await loadAllModels();
}

/** loadTenantDevices 装载企业设备；选择设备时仍按产品校验。 */
async function loadTenantDevices() {
  const list: ProjectDeviceOption[] = [];
  let page = 1;
  while (true) {
    const result = await ThingsApi.postApiV1ThingsDeviceInfoGetList({ page: { page, size: 200 } });
    list.push(...(result?.list || []).filter((item) => item.productID && item.deviceName).map((item) => ({
      productID: item.productID!, deviceName: item.deviceName!, deviceAlias: item.deviceAlias, productName: item.productName,
    })));
    if ((result?.list?.length || 0) < 200 || Number(result?.total || 0) > 0 && list.length >= Number(result?.total)) break;
    page += 1;
  }
  devices.value = list;
}

/** schemaParams 兼容物模型参数的数组和标识符映射格式，供旧条件摘要使用。 */
function schemaParams(affordance: unknown): Array<{ identifier: string; name: string }> {
  let parsed: any = affordance;
  if (typeof affordance === 'string') {
    try { parsed = JSON.parse(affordance); } catch { return []; }
  }
  const params = parsed?.params;
  if (Array.isArray(params)) return params.filter((item) => item?.identifier || item?.id).map((item) => ({ identifier: item.identifier || item.id, name: item.name || item.identifier || item.id }));
  if (params && typeof params === 'object') return Object.entries(params).map(([key, raw]) => {
    const item = raw as { identifier?: string; name?: string };
    return { identifier: item?.identifier || key, name: item?.name || item?.identifier || key };
  });
  return [];
}

/** loadModels 读取产品完整物模型并缓存，事件/行为/属性共用同一目录。 */
async function loadModels(productID: string): Promise<ModelOption[]> {
  if (modelsByProduct.value[productID]) return modelsByProduct.value[productID]!;
  const pending = schemaRequests.get(productID);
  if (pending) return pending;
  const context = `${scope.value}:${props.projectID || ''}`;
  const request = (async () => {
    const entries: ModelOption[] = [];
    let page = 1;
    while (true) {
      const result = await ThingsApi.postApiV1ThingsProductSchemaGetList({ productID, page: { page, size: 200 } });
      for (const item of result?.list || []) {
        const topic = MODEL_TOPICS.find((candidate) => candidate.schemaType === item.type)?.code;
        if (!topic || !item.identifier) continue;
        entries.push({
          topic, productID, productName: products.value.find((product) => product.id === productID)?.name || productID,
          identifier: item.identifier, name: item.name || item.identifier, params: schemaParams(item.affordance),
        });
      }
      if ((result?.list?.length || 0) < 200 || Number(result?.total || 0) > 0 && page * 200 >= Number(result?.total)) break;
      page += 1;
    }
    if (context !== `${scope.value}:${props.projectID || ''}`) return [];
    modelsByProduct.value = { ...modelsByProduct.value, [productID]: entries };
    return entries;
  })().finally(() => schemaRequests.delete(productID));
  schemaRequests.set(productID, request);
  return request;
}

/** loadAllModels 分批查询候选产品，供 AI 建议与旧条件名称回显。 */
async function loadAllModels(): Promise<ModelOption[]> {
  const all: ModelOption[] = [];
  const ids = products.value.map((item) => item.id);
  for (let index = 0; index < ids.length; index += 4) {
    const batch = await Promise.all(ids.slice(index, index + 4).map((id) => loadModels(id)));
    all.push(...batch.flat());
  }
  return all;
}

/** initialize 按规则范围装载消息目录及可选物模型。 */
async function initialize() {
  loading.value = true;
  try {
    await Promise.all([loadTopics(), scope.value === 'project' ? loadProjectDevices() : Promise.all([loadTenantProducts(), loadTenantDevices()])]);
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || $t('iotApp.ruleTrigger.loadSourcesFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

watch(() => [props.projectID, scope.value], () => {
  devices.value = [];
  tenantProducts.value = [];
  modelsByProduct.value = {};
  schemaRequests.clear();
  void initialize();
}, { immediate: true });
watch([selectedProductID, products], ([productID]) => {
  if (productID && products.value.some((item) => item.id === productID)) void loadModels(productID).catch((error) => notifyRequestError(error, () => error?.message || $t('iotApp.ruleTrigger.loadModelsFailed'), (text) => message.error(text)));
}, { immediate: true });

/** onTopicChange 切换消息类型时清空不属于新主题的选择。 */
function onTopicChange(value: unknown) {
  model.value = { ...model.value, subscribeTopic: String(value || ''), topicMatch: undefined, rules: [], legacyFilter: undefined };
  suggestion.value = null;
}

/** onProductChange 清空旧产品下的设备及物模型选择；全部产品使用主题通配。 */
function onProductChange(value: unknown) {
  const productID = value === '__all__' ? '' : String(value || '');
  model.value = { ...model.value, topicMatch: productID ? { productID } : {} };
}

/** onDeviceChange 将具体设备作为可选的主题片段。 */
function onDeviceChange(value: unknown) {
  model.value = { ...model.value, topicMatch: { ...model.value.topicMatch!, deviceName: value === '__all__' ? undefined : String(value) } };
}

/** onModelChange 保存与消息类型对应的物模型标识键。 */
function onModelChange(value: unknown) {
  // 公共规则选择全部物模型时恢复整个消息类型，避免提交后端不支持的半条主题。
  if (scope.value === 'common' && value === '__all__') {
    model.value = { ...model.value, topicMatch: undefined };
    return;
  }
  model.value = { ...model.value, topicMatch: { ...model.value.topicMatch!, [modelTopicKey(model.value.subscribeTopic)]: value === '__all__' ? undefined : String(value || '') } };
}

/** confirmReconfigure 明确替换旧条件，防止普通编辑意外放大触发范围。 */
function confirmReconfigure() {
  model.value = { ...model.value, legacyFilter: undefined, rules: [], logic: 'and', topicMatch: undefined };
  reconfigureConfirm.value = false;
}

/** legacySummary 用物模型名称回显旧任务条件，保留不认识字段的标识。 */
const legacySummary = computed(() => model.value.rules.map((rule) => {
  const all = Object.values(modelsByProduct.value).flat();
  let label = topics.value.find((item) => item.code === model.value.subscribeTopic)?.filterFields.find((field) => field.path === rule.path)?.label;
  if (rule.path === '$.identifier') label = `${$t('iotApp.ruleTrigger.modelEvent')} ${all.find((item) => item.topic === model.value.subscribeTopic && item.identifier === rule.value)?.name || rule.value}`;
  if (rule.path === '$.device.productID') label = `${$t('iotApp.project.productCol')} ${products.value.find((item) => item.id === rule.value)?.name || rule.value}`;
  if (rule.path === '$.device.deviceName') label = `${$t('iotApp.project.typeDevice')} ${devices.value.find((item) => item.deviceName === rule.value)?.deviceAlias || rule.value}`;
  if (rule.path.startsWith('$.params.')) {
    const id = rule.path.slice('$.params.'.length);
    label = `${$t('iotApp.accessOverview.paramsInfo')} ${all.flatMap((item) => item.params || []).find((item) => item.identifier === id)?.name || id}`;
  }
  return `${label || rule.path.replace(/^\$\./, '')} ${(EVENT_OPERATORS.find((item) => item.value === rule.op)?.label ? $t(EVENT_OPERATORS.find((item) => item.value === rule.op)!.label) : rule.op)} ${rule.value}`;
}));

/** chooseSuggestion 将用户确认的歧义候选回填为主题，可选择全部产品。 */
function chooseSuggestion(item: ModelOption, allProducts = false) {
  model.value = {
    triggerType: 'subscribe_message', subscribeTopic: item.topic, logic: 'and', rules: [],
    topicMatch: { ...(!allProducts ? { productID: item.productID } : {}), ...(suggestion.value?.deviceName ? { deviceName: suggestion.value.deviceName } : {}), [modelTopicKey(item.topic)]: item.identifier },
  };
  suggestion.value = null;
  message.success($t('iotApp.ruleTrigger.topicBackfilled'));
}

/** chooseSuggestionAllProducts 将同标识的候选归并为当前项目全产品主题。 */
function chooseSuggestionAllProducts() {
  const first = suggestion.value?.candidates[0];
  if (first && suggestionAllProducts.value) chooseSuggestion(first, true);
}

/** generateSuggestion 只允许 AI 从当前项目真实目录中建议主题及物模型。 */
async function generateSuggestion() {
  if (!description.value.trim()) return message.warning($t('iotApp.ruleTrigger.descriptionRequired'));
  if (!topics.value.length) return message.error($t('iotApp.ruleTrigger.sourcesNotLoaded'));
  generating.value = true;
  suggestion.value = null;
  try {
    const catalog = await loadAllModels();
    const instruction = [
      scope.value === 'common'
        ? '把用户描述解析为一个 JSON 对象，只输出 JSON。格式：{"topic":"主题编码","modelID":"可选的物模型标识符","deviceName":"可选的设备名称"}。公共规则订阅所有企业的匹配消息；用户指定具体物模型时从目录选择，未指定时可省略 modelID。'
        : '把用户描述解析为一个 JSON 对象，只输出 JSON。格式：{"topic":"主题编码","modelID":"物模型标识符","deviceName":"可选的设备名称"}。',
      '事件、行为、属性仅选择物模型主题；参数值、大小比较和业务判断由工具代码处理，不要输出 rules。',
      scope.value === 'common'
        ? '只能使用提供的主题编码与目录中的物模型标识；无法确定用户指定的消息类型或物模型时返回空文本，不要猜测。'
        : '只能使用目录中的主题和物模型标识符；无法确定消息类型或物模型时返回空文本，不要猜测。',
      JSON.stringify({ topics: availableTopics.value.map((item) => ({ code: item.code, name: item.description })), devices: devices.value.map((item) => ({ productID: item.productID, deviceName: item.deviceName, alias: item.deviceAlias })), models: catalog.map(({ topic, productID, productName, identifier, name }) => ({ topic, productID, productName, identifier, name })) }),
    ].join('\n');
    const result = await CoreAi.postApiV1AiChatCompletions({
      agentID: 0, stream: false,
      messages: [
        { role: 'system', contents: [{ type: 'text', text: instruction }] },
        { role: 'user', contents: [{ type: 'text', text: description.value.trim() }] },
      ],
    });
    if (scope.value === 'common') {
      const raw = (result?.content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const data = JSON.parse(raw);
      if (!data || typeof data.topic !== 'string' || !availableTopics.value.some((item) => item.code === data.topic)) throw new Error($t('iotApp.ruleTrigger.aiInvalidMessageType'));
      if (!data.modelID) {
        if (data.rules !== undefined || data.productID !== undefined || data.deviceName !== undefined) throw new Error($t('iotApp.ruleTrigger.aiModelNeedsSelection'));
        model.value = { triggerType: 'subscribe_message', subscribeTopic: data.topic, logic: 'and', rules: [] };
        message.success($t('iotApp.ruleTrigger.messageTypeBackfilled'));
        return;
      }
    }
    const parsed = parseEventSuggestion(result?.content || '', availableTopics.value, catalog, devices.value, description.value);
    if (parsed.candidates.length) {
      suggestion.value = parsed;
      message.warning($t('iotApp.ruleTrigger.multipleModels'));
    } else if (parsed.config) {
      model.value = parsed.config;
      message.success($t('iotApp.ruleTrigger.topicBackfilled'));
    }
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || $t('iotApp.ruleTrigger.sourceGenerationFailed'), (text) => message.error(text));
  } finally {
    generating.value = false;
  }
}

/** serialize 校验项目设备和物模型目录后生成任务保存参数。 */
function serialize() {
  if (loading.value || !topics.value.length) throw new Error($t('iotApp.ruleTrigger.sourcesNotReady'));
  if (model.value.triggerType === 'subscribe_message' && isModelTopic(model.value.subscribeTopic) && model.value.legacyFilter === undefined) {
    const match = model.value.topicMatch;
    if (match?.productID && !products.value.some((item) => item.id === match.productID)) throw new Error($t('iotApp.ruleTrigger.productRequired'));
    if (match?.deviceName && !devices.value.some((item) => item.productID === match.productID && item.deviceName === match.deviceName)) throw new Error($t('iotApp.ruleTrigger.deviceProductMismatch'));
    if ((scope.value !== 'common' || match?.[modelTopicKey(model.value.subscribeTopic)]) && !selectedModels.value.some((item) => item.identifier === match?.[modelTopicKey(model.value.subscribeTopic)])) throw new Error($t('iotApp.ruleTrigger.modelNotInProduct'));
  }
  return serializeEventTrigger(model.value, topics.value, props.projectID, scope.value === 'common');
}

defineExpose({ serialize });
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="aitask-trigger-editor">
    <div class="flex flex-col gap-1.5">
      <Label class="text-xs">{{ $t('iotApp.ruleTrigger.chooseTrigger') }}</Label>
      <Select v-model="model.triggerType">
        <SelectTrigger data-testid="aitask-trigger-type"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="schedule">{{ $t('iotApp.ruleTrigger.scheduleOrManual') }}</SelectItem>
          <SelectItem value="subscribe_message">{{ $t('iotApp.ruleTrigger.messageTrigger') }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <template v-if="model.triggerType === 'subscribe_message'">
      <p class="text-muted-foreground text-xs">{{ scope === 'project' ? $t('iotApp.ruleTrigger.scopeProject') : scope === 'tenant' ? $t('iotApp.ruleTrigger.scopeTenant') : $t('iotApp.ruleTrigger.scopeAll') }} {{ $t('iotApp.ruleTrigger.scopeHint') }}</p>

      <template v-if="model.legacyFilter !== undefined">
        <div class="rounded-md border p-3 text-sm">
          <p class="font-medium">{{ $t('iotApp.ruleTrigger.legacyConditions') }}</p>
          <p class="text-muted-foreground mt-1">{{ topics.find((item) => item.code === model.subscribeTopic)?.description || model.subscribeTopic }}</p>
          <p v-for="(line, index) in legacySummary" :key="index" class="mt-1">{{ line }}</p>
          <p v-if="!legacySummary.length" class="mt-1">{{ $t('iotApp.ruleTrigger.allMatching') }}</p>
          <Button type="button" variant="outline" size="sm" class="mt-3" @click="reconfigureConfirm = true">{{ $t('iotApp.ruleTrigger.reselectModel') }}</Button>
          <div v-if="reconfigureConfirm" class="mt-2 flex items-center gap-2">
            <span class="text-destructive text-xs">{{ $t('iotApp.ruleTrigger.replaceWarning') }}</span>
            <Button type="button" size="sm" variant="destructive" @click="confirmReconfigure">{{ $t('iotApp.ruleTrigger.confirmReplace') }}</Button>
            <Button type="button" size="sm" variant="ghost" @click="reconfigureConfirm = false">{{ $t('iotApp.common.cancel') }}</Button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-1.5">
          <Label class="text-xs">{{ $t('iotApp.ruleTrigger.messageType') }}</Label>
          <Select :model-value="model.subscribeTopic" @update:model-value="onTopicChange">
            <SelectTrigger data-testid="aitask-event-topic"><SelectValue :placeholder="loading ? $t('iotApp.project.loadingDots') : $t('iotApp.ruleTrigger.selectMessageType')" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="topic in availableTopics" :key="topic.code" :value="topic.code">{{ modelTopicLabel(topic.code, topic.description) }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <template v-if="isModelTopic(model.subscribeTopic)">
          <p v-if="!loading && !products.length" class="text-muted-foreground text-sm">{{ scope === 'project' ? $t('iotApp.ruleTrigger.noProjectDevices') : $t('iotApp.ruleTrigger.noTenantProducts') }}</p>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div class="flex flex-col gap-1.5">
              <Label class="text-xs">{{ $t('iotApp.ruleTrigger.optionalProduct') }}</Label>
              <Select :model-value="selectedProductID || '__all__'" @update:model-value="onProductChange">
                <SelectTrigger data-testid="aitask-model-product"><SelectValue :placeholder="$t('iotApp.ruleTrigger.allProducts')" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{{ $t('iotApp.ruleTrigger.allProducts') }}</SelectItem>
                  <SelectItem v-for="item in products" :key="item.id" :value="item.id">{{ item.name }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label class="text-xs">{{ $t('iotApp.ruleTrigger.optionalDevice') }}</Label>
              <Select :model-value="selectedDeviceName || '__all__'" :disabled="!selectedProductID" @update:model-value="onDeviceChange">
                <SelectTrigger data-testid="aitask-model-device"><SelectValue :placeholder="$t('iotApp.ruleTrigger.allProductDevices')" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{{ $t('iotApp.ruleTrigger.allProductDevices') }}</SelectItem>
                  <SelectItem v-for="item in selectedDevices" :key="item.deviceName" :value="item.deviceName">{{ item.deviceAlias || item.deviceName }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label class="text-xs">{{ modelTopicLabel(model.subscribeTopic) }}</Label>
              <Select :model-value="selectedModelID || (scope === 'common' ? '__all__' : '')" :disabled="scope !== 'common' && !selectedModels.length" @update:model-value="onModelChange">
                <SelectTrigger data-testid="aitask-model-identifier"><SelectValue :placeholder="$t('iotApp.ruleTrigger.selectModel')" /></SelectTrigger>
                <SelectContent><SelectItem v-if="scope === 'common'" value="__all__">{{ $t('iotApp.ruleTrigger.allModels') }}</SelectItem><SelectItem v-for="item in selectedModels" :key="item.identifier" :value="item.identifier">{{ item.name }}({{ item.identifier }})</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </template>
        <p v-if="isModelTopic(model.subscribeTopic) && scope === 'common'" class="text-muted-foreground text-sm">{{ $t('iotApp.ruleTrigger.commonRuleHint') }}</p>

        <div class="flex flex-col gap-1.5">
          <Label class="text-xs">{{ $t('iotApp.ruleTrigger.naturalLanguage') }}</Label>
          <Textarea v-model="description" :rows="2" :placeholder="$t('iotApp.ruleTrigger.naturalExample')" data-testid="aitask-event-prompt" />
          <Button type="button" variant="outline" size="sm" class="self-start" :disabled="generating || loading" data-testid="aitask-event-generate" @click="generateSuggestion">
            {{ generating ? $t('iotApp.ruleTrigger.parsing') : $t('iotApp.ruleTrigger.parseAndFill') }}
          </Button>
          <p class="text-muted-foreground text-xs">{{ $t('iotApp.ruleTrigger.topicOnlyHint') }}</p>
        </div>
        <div v-if="suggestion?.candidates.length" class="rounded-md border p-3 text-sm">
          <p class="mb-2 font-medium">{{ $t('iotApp.ruleTrigger.multipleMatch') }}</p>
          <div class="flex flex-wrap gap-2">
            <Button type="button" v-if="suggestionAllProducts" variant="outline" size="sm" @click="chooseSuggestionAllProducts">{{ $t('iotApp.ruleTrigger.allProducts') }} / {{ suggestion.candidates[0]?.identifier }}</Button>
            <Button type="button" v-for="item in suggestion.candidates" :key="`${item.productID}:${item.identifier}`" variant="outline" size="sm" @click="chooseSuggestion(item)">{{ item.productName }} / {{ item.name }}({{ item.identifier }})</Button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
