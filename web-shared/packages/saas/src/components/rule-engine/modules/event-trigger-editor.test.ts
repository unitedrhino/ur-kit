/** 文件说明：物模型目录加载、AI 建议回填与旧条件保留测试。 */
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyEventTrigger, readEventTrigger } from '../event-trigger';
import EventTriggerEditor from './event-trigger-editor.vue';

/** mocks 隔离当前项目设备、物模型目录及 AI 建议。 */
const mocks = vi.hoisted(() => ({
  products: vi.fn(), topics: vi.fn(), devices: vi.fn(), schemas: vi.fn(), chat: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn(),
}));
vi.mock('@vben/api', () => ({
  CoreAi: { postApiV1AiCloneTaskGetSubscribeTopics: mocks.topics, postApiV1AiChatCompletions: mocks.chat },
  ThingsApi: { postApiV1ThingsProductInfoGetList: mocks.products, postApiV1ThingsDeviceInfoGetList: mocks.devices, postApiV1ThingsProductSchemaGetList: mocks.schemas },
}));
vi.mock('@vben/saas', () => ({ message: { error: mocks.error, success: mocks.success, warning: mocks.warning } }));

describe('物模型主题编辑器', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.products.mockResolvedValue({ list: [{productID:'p1',productName:'公共产品'}], total:1 });
    mocks.topics.mockResolvedValue({ list: [{ code: 'device.report.thing.event', description: '物模型事件', filterFields: [{ path: '$.identifier', label: '事件标识符' }] }] });
    mocks.devices.mockResolvedValue({ list: [{ productID: 'p1', productName: '测试产品', deviceName: 'd1', deviceAlias: '设备 A' }], total: 1 });
    mocks.schemas.mockResolvedValue({ list: [{ type: 2, identifier: 'fault', name: '故障事件', affordance: '{"params":{"temperature":{"name":"温度"}}}' }], total: 1 });
  });

  it('自然语言按钮在配置表单内只解析建议，不提交表单', async () => {
    mocks.chat.mockResolvedValue({ content: '{"topic":"device.report.thing.event"}' });
    const wrapper = shallowMount(EventTriggerEditor, { props: { scope: 'common', modelValue: { ...emptyEventTrigger(), triggerType: 'subscribe_message' } } });
    await flushPromises();
    wrapper.findComponent({ name: 'Textarea' }).vm.$emit('update:modelValue', '所有企业的事件');
    const button = wrapper.find('[data-testid="aitask-event-generate"]');
    expect(button.attributes('type')).toBe('button');
    await button.trigger('click');
    await flushPromises();
    expect(mocks.chat).toHaveBeenCalledOnce();
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({ subscribeTopic: 'device.report.thing.event' });
    wrapper.unmount();
  });

  it('公共规则也能选择物模型，全部物模型选择保持通配订阅', async () => {
    mocks.chat.mockResolvedValue({ content: '{"topic":"device.report.thing.event","modelID":"fault"}' });
    const wrapper = shallowMount(EventTriggerEditor, { props: { scope: 'common', modelValue: { ...emptyEventTrigger(), triggerType: 'subscribe_message', subscribeTopic: 'device.report.thing.event' } } });
    await flushPromises();
    expect(mocks.products).toHaveBeenCalled();
    const state = (wrapper.vm.$ as any).setupState;
    state.description = '所有企业的故障事件';
    await state.generateSuggestion();
    const selected = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any;
    expect(selected.topicMatch.identifier).toBe('fault');
    await wrapper.setProps({ modelValue: selected });
    state.onModelChange('__all__');
    await wrapper.setProps({ modelValue: wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any });
    const saved = state.serialize();
    expect(JSON.parse(saved.subscribePayloadFilter).topicMatch).toBeUndefined();
    wrapper.unmount();
  });

  it('AI 回填项目内实际存在的事件，不发布任务', async () => {
    mocks.chat.mockResolvedValue({ content: '{"topic":"device.report.thing.event","modelID":"fault"}' });
    const wrapper = shallowMount(EventTriggerEditor, { props: { projectID: '9007199254740993', modelValue: emptyEventTrigger() } });
    await flushPromises();
    const state = (wrapper.vm.$ as any).setupState;
    state.description = '故障事件触发';
    await state.generateSuggestion();
    const suggestion = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any;
    expect(suggestion.topicMatch).toEqual({ productID: 'p1', identifier: 'fault' });
    expect(mocks.devices.mock.calls[0]?.[1]).toEqual({ headers: { 'project-id': '9007199254740993' } });
    expect(mocks.success).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('AI 返回未在物模型中的标识时拒绝回填', async () => {
    mocks.chat.mockResolvedValue({ content: '{"topic":"device.report.thing.event","modelID":"unknown"}' });
    const wrapper = shallowMount(EventTriggerEditor, { props: { projectID: '301', modelValue: emptyEventTrigger() } });
    await flushPromises();
    const state = (wrapper.vm.$ as any).setupState;
    state.description = '未知事件';
    await state.generateSuggestion();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(mocks.error).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('同名事件在多个项目产品中出现时要求页内选择', async () => {
    mocks.devices.mockResolvedValue({ list: [
      { productID: 'p1', productName: '产品一', deviceName: 'd1' },
      { productID: 'p2', productName: '产品二', deviceName: 'd2' },
    ], total: 2 });
    mocks.chat.mockResolvedValue({ content: '{"topic":"device.report.thing.event","modelID":"fault"}' });
    const wrapper = shallowMount(EventTriggerEditor, { props: { projectID: '301', modelValue: emptyEventTrigger() } });
    await flushPromises();
    const state = (wrapper.vm.$ as any).setupState;
    state.description = '故障事件';
    await state.generateSuggestion();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(state.suggestion.candidates).toHaveLength(2);
    const productCandidate = state.suggestion.candidates[1];
    state.chooseSuggestionAllProducts();
    expect((wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any).topicMatch).toEqual({ identifier: 'fault' });
    state.chooseSuggestion(productCandidate);
    expect((wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any).topicMatch.productID).toBe('p2');
    wrapper.unmount();
  });

  it('不选产品时可保存当前项目物模型标识', async () => {
    mocks.devices.mockResolvedValue({ list: [
      { productID: 'p1', productName: '产品一', deviceName: 'd1' },
      { productID: 'p2', productName: '产品二', deviceName: 'd2' },
    ], total: 2 });
    const config = { ...emptyEventTrigger(), triggerType: 'subscribe_message' as const,
      subscribeTopic: 'device.report.thing.event', topicMatch: { identifier: 'fault' } };
    const wrapper = shallowMount(EventTriggerEditor, { props: { projectID: '301', modelValue: config } });
    await flushPromises();
    const saved = (wrapper.vm as any).serialize();
    expect(JSON.parse(saved.subscribePayloadFilter).topicMatch).toEqual({ identifier: 'fault' });
    expect(mocks.schemas).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('旧任务只编辑名称时，序列化保留原过滤串', async () => {
    const raw = '{"rules":[{"path":"$.identifier","op":"eq","value":"fault"}]}';
    const config = readEventTrigger({ triggerType: 'subscribe_message', subscribeTopic: 'device.report.thing.event', subscribePayloadFilter: raw });
    const wrapper = shallowMount(EventTriggerEditor, { props: { projectID: '301', modelValue: config } });
    await flushPromises();
    const result = (wrapper.vm as any).serialize();
    expect(result.subscribePayloadFilter).toBe(raw);
    wrapper.unmount();
  });
});
