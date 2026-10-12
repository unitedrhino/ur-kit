/**
 * 3D 模型组件规则引擎单测
 *
 * 覆盖 bindings.ts 纯函数：
 * - resolveBindingTarget 三级降级目标解析（uuid → path → 唯一 name），歧义不动
 * - evaluateColor 颜色规则（枚举/区间/默认色）
 * - evaluateVisible 显隐规则（bool 集合 / 数值下界）
 * - formatLabelText 标签文本
 * - matchBindings WS 消息匹配（批量 params 与单属性两种负载、跨产品）
 */
import { describe, expect, it } from 'vitest'

import {
  bindingKey,
  evaluateColor,
  evaluateVisible,
  formatLabelText,
  matchBindings,
  resolveBindingTarget
} from '../bindings'
import type { GltfNodeInfo, NodeBinding } from '../types'

const nodes: GltfNodeInfo[] = [
  { uuid: 'u1', name: 'Link1', path: 'Scene/Model/Link1', type: 'Group' },
  { uuid: 'u2', name: 'Motor', path: 'Scene/Model/Motor', type: 'Mesh' },
  { uuid: 'u3', name: 'Motor', path: 'Scene/Model/Copy/Motor', type: 'Mesh' },
  { uuid: 'u4', name: '(unnamed)', path: 'Scene/(unnamed)', type: 'Mesh' }
]

const makeBinding = (overrides: Partial<NodeBinding> = {}): NodeBinding => ({
  nodeID: '',
  nodePath: '',
  nodeName: '',
  productID: 'p1',
  deviceName: 'dev1',
  dataID: 'temperature',
  action: { type: 'color', colorRules: [] },
  ...overrides
})

describe('resolveBindingTarget 三级降级', () => {
  it('uuid 精确命中优先', () => {
    const result = resolveBindingTarget(makeBinding({ nodeID: 'u1', nodeName: 'Motor' }), nodes)
    expect(result.matchedBy).toBe('uuid')
    expect(result.node?.uuid).toBe('u1')
  })

  it('uuid 未命中时按 path 命中', () => {
    const result = resolveBindingTarget(makeBinding({ nodePath: 'Scene/Model/Motor', nodeName: 'Motor' }), nodes)
    expect(result.matchedBy).toBe('path')
    expect(result.node?.uuid).toBe('u2')
  })

  it('path 歧义（同路径重复不可能，此处验证 name 唯一兜底）', () => {
    const result = resolveBindingTarget(makeBinding({ nodeName: 'Link1' }), nodes)
    expect(result.matchedBy).toBe('name')
    expect(result.node?.uuid).toBe('u1')
  })

  it('name 重名歧义时放弃并给出原因', () => {
    const result = resolveBindingTarget(makeBinding({ nodeName: 'Motor' }), nodes)
    expect(result.node).toBeNull()
    expect(result.reason).toContain('歧义')
  })

  it('完全未命中返回未找到', () => {
    const result = resolveBindingTarget(makeBinding(), nodes)
    expect(result.node).toBeNull()
    expect(result.reason).toContain('未找到')
  })
})

describe('evaluateColor 颜色规则', () => {
  it('枚举规则命中返回映射色', () => {
    const action = { type: 'color' as const, colorRules: [{ mode: 'enum' as const, enumValue: '1', color: '#00ff00' }] }
    expect(evaluateColor(action, '1')).toBe('#00ff00')
    expect(evaluateColor(action, '2')).toBeNull()
  })

  it('区间规则含边界命中', () => {
    const action = {
      type: 'color' as const,
      colorRules: [
        { mode: 'range' as const, min: 80, max: 100, color: '#ff4d4f' },
        { mode: 'range' as const, min: 50, max: 79, color: '#faad14' }
      ]
    }
    expect(evaluateColor(action, 80)).toBe('#ff4d4f')
    expect(evaluateColor(action, 100)).toBe('#ff4d4f')
    expect(evaluateColor(action, 60)).toBe('#faad14')
    expect(evaluateColor(action, 10)).toBeNull()
  })

  it('未命中且配置默认色时返回默认色', () => {
    const action = { type: 'color' as const, colorRules: [], defaultColor: '#123456' }
    expect(evaluateColor(action, 'anything')).toBe('#123456')
  })
})

describe('evaluateVisible 显隐规则', () => {
  it('bool 模式：命中集合显示，否则隐藏', () => {
    const action = { type: 'visible' as const, visibleMode: 'bool' as const, visibleTrueValues: ['1', 'on'] }
    expect(evaluateVisible(action, 1)).toBe(true)
    expect(evaluateVisible(action, 'on')).toBe(true)
    expect(evaluateVisible(action, '0')).toBe(false)
  })

  it('threshold 模式：值 ≥ 下界显示，非数值隐藏', () => {
    const action = { type: 'visible' as const, visibleMode: 'threshold' as const, visibleMin: 50 }
    expect(evaluateVisible(action, 50)).toBe(true)
    expect(evaluateVisible(action, 49.9)).toBe(false)
    expect(evaluateVisible(action, 'abc')).toBe(false)
  })

  it('未配置规则返回 null（保持现状）', () => {
    expect(evaluateVisible({ type: 'visible' }, 1)).toBeNull()
  })
})

describe('formatLabelText 标签文本', () => {
  it('前缀缺省用属性名，单位拼接', () => {
    const binding = makeBinding({ dataName: '温度', dataUnit: '℃' })
    expect(formatLabelText({ type: 'label' }, binding, '25.6')).toBe('温度: 25.6 ℃')
  })

  it('自定义前缀优先', () => {
    const binding = makeBinding({ dataName: '温度' })
    expect(formatLabelText({ type: 'label', labelText: '机房温度' }, binding, 30)).toBe('机房温度: 30')
  })
})

describe('matchBindings 消息匹配', () => {
  const bindings = [
    makeBinding({ nodePath: 'Scene/Model/Motor' }),
    makeBinding({ productID: 'p2', deviceName: 'dev2', dataID: 'humidity' })
  ]

  it('批量 params 负载按 (productID,deviceName,identifier) 命中', () => {
    const hits = matchBindings(bindings, [
      { device: { productID: 'p1', deviceName: 'dev1' }, params: { temperature: 25.6, humidity: 60 } }
    ])
    const first = hits[0]
    expect(hits).toHaveLength(1)
    expect(first?.binding.dataID).toBe('temperature')
    expect(first?.value).toBe(25.6)
  })

  it('单属性 identifier/param 负载命中跨产品绑定', () => {
    const hits = matchBindings(bindings, [
      { device: { productID: 'p2', deviceName: 'dev2' }, identifier: 'humidity', param: '80' }
    ])
    const first = hits[0]
    expect(hits).toHaveLength(1)
    expect(first?.value).toBe('80')
  })

  it('无命中返回空', () => {
    expect(matchBindings(bindings, [{ device: { productID: 'px', deviceName: 'dx' }, params: { a: 1 } }])).toHaveLength(0)
  })
})

describe('bindingKey', () => {
  it('三元组拼接', () => {
    expect(bindingKey({ productID: 'p1', deviceName: 'dev1', dataID: 'temperature' })).toBe('p1|dev1|temperature')
  })
})
