<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div class="nb-panel">
    <!-- 左栏：模型点位节点树（与画布拾取双向联动） -->
    <div class="nb-tree-col" :style="{ width: 'min(' + treeWidth + 'px, 60%)' }">
      <div class="nb-section-title">{{ editorT('bigscreenEditor.ui.componentModelPoints') }}</div>
      <n-input v-model:value="nodeFilter" size="small" :placeholder="editorT('bigscreenEditor.ui.componentSearchNodesDescriptions')" clearable />
      <div v-if="treeData.length === 0" class="nb-hint">{{ editorT('bigscreenEditor.ui.componentParseNodesAutomaticallyAfterLoadingTheModel') }}</div>
      <n-tree
        v-else
        block-line
        :data="treeData"
        :pattern="nodeFilter"
        :selected-keys="selectedKeys"
        :default-expanded-keys="defaultExpandedKeys"
        :render-label="renderLabel"
        key-field="key"
        label-field="label"
        children-field="children"
        class="nb-tree"
        @update:selected-keys="onTreeNodeSelect"
      />
    </div>

    <!-- 可拖拽分隔条：调整左右栏宽度 -->
    <div class="nb-resizer" @mousedown="startResize"></div>

    <!-- 右栏：选中节点的数据绑定 -->
    <div class="nb-bind-col">
      <div class="nb-section-title">{{ editorT('bigscreenEditor.ui.componentNodeDataBinding') }}</div>
      <template v-if="!selectedNode">
        <div class="nb-hint">{{ editorT('bigscreenEditor.ui.componentClickAModelPartOnTheCanvasOr') }}</div>
      </template>
      <template v-else>
        <div class="nb-node-chip" :title="selectedNode.path">{{ selectedNode.name }}</div>
        <!-- 节点业务描述（可编辑，持久化到大屏 JSON；节点树同步显示） -->
        <n-input
          :value="nodeDesc"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentNodeDescriptionEGJ1BaseRotation')"
          @update:value="onDescInput"
        />

        <!-- 已有绑定列表 -->
        <div v-if="selectedBindings.length > 0" class="nb-binding-list">
          <div v-for="(item, index) in selectedBindings" :key="index" class="nb-binding-row">
            <span class="nb-binding-text">{{ bindingSummary(item) }}</span>
            <span class="flex-1"></span>
            <n-button size="tiny" text type="primary" @click="startEdit(index)">{{ editorT('orgManage.common.edit') }}</n-button>
            <n-button size="tiny" text type="error" @click="removeBinding(index)">{{ editorT('orgManage.common.delete') }}</n-button>
          </div>
        </div>

        <n-button size="small" type="primary" dashed class="nb-add-btn" @click="addBinding">{{ editorT('bigscreenEditor.ui.componentAddBinding') }}</n-button>

        <!-- 绑定编辑表单 -->
        <template v-if="editing">
          <div class="nb-field-label">{{ editorT('iotApp.deviceDetail.deviceProps') }}</div>
          <div class="nb-form-col">
            <n-select
              v-model:value="editing.productID"
              size="small"
              :options="productOptions"
              :loading="loadingProducts"
              :placeholder="editorT('scene.ui.selectProduct')"
              filterable
              @update:value="onProductChange"
            />
            <n-select
              v-model:value="editing.deviceName"
              size="small"
              :options="deviceOptions"
              :loading="loadingDevices"
              :disabled="!editing.productID"
              :placeholder="editorT('iotApp.ota.chooseDevices')"
              filterable
            />
            <n-select
              v-model:value="editing.dataID"
              size="small"
              :options="schemaOptions"
              :loading="loadingSchema"
              :disabled="!editing.productID"
              :placeholder="editorT('bigscreenEditor.ui.componentSelectPropertyModelField')"
              filterable
              @update:value="onSchemaChange"
            />
          </div>

          <div class="nb-field-label">{{ editorT('bigscreenEditor.ui.componentTriggerAction') }}</div>
          <n-radio-group v-model:value="editing.action.type" size="small">
            <n-radio-button value="color">{{ editorT('bigscreenEditor.ui.componentColorChange') }}</n-radio-button>
            <n-radio-button value="visible">{{ editorT('bigscreenEditor.ui.componentVisibility') }}</n-radio-button>
            <n-radio-button value="label">{{ editorT('bigscreenEditor.ui.componentValueLabel') }}</n-radio-button>
            <n-radio-button value="motion">{{ editorT('bigscreenEditor.ui.componentMotion') }}</n-radio-button>
          </n-radio-group>

          <!-- 变色规则 -->
          <template v-if="editing.action.type === 'color'">
            <div class="nb-field-label">{{ editorT('bigscreenEditor.ui.componentColorRules') }}</div>
            <div class="nb-form-col">
              <div v-for="(rule, index) in editing.action.colorRules" :key="index" class="nb-rule-row">
                <n-select
                  v-model:value="rule.mode"
                  size="tiny"
                  style="width: 68px"
                  :options="[
                    { label: editorT('orgManage.flow.opEq'), value: 'enum' },
                    { label: editorT('bigscreenEditor.ui.componentRange'), value: 'range' }
                  ]"
                />
                <n-input
                  v-if="rule.mode === 'enum'"
                  v-model:value="rule.enumValue"
                  size="tiny"
                  :placeholder="editorT('orgManage.cloneGroup.valuePlaceholder')"
                  style="flex: 1"
                />
                <template v-else>
                  <n-input-number v-model:value="rule.min" size="tiny" placeholder="≥" style="width: 64px" :show-button="false" />
                  <span class="nb-rule-sep">~</span>
                  <n-input-number v-model:value="rule.max" size="tiny" placeholder="≤" style="width: 64px" :show-button="false" />
                </template>
                <n-color-picker v-model:value="rule.color" size="tiny" :show-alpha="false" style="width: 44px" />
                <n-button size="tiny" text type="error" @click="removeRule(index)">{{ editorT('bigscreenEditor.ui.componentDelete') }}</n-button>
              </div>
              <n-button size="tiny" dashed @click="addRule">{{ editorT('orgManage.cloneGroup.addRule') }}</n-button>
            </div>
            <div class="nb-field-label">{{ editorT('bigscreenEditor.ui.componentDefaultColorNoMatch') }}</div>
            <div class="flex items-center gap-2">
              <n-switch v-model:value="useDefaultColor" size="small" />
              <n-color-picker
                v-if="useDefaultColor"
                v-model:value="editing.action.defaultColor"
                size="small"
                :show-alpha="false"
                style="width: 110px"
              />
            </div>
          </template>

          <!-- 显隐规则 -->
          <template v-else-if="editing.action.type === 'visible'">
            <div class="nb-field-label">{{ editorT('bigscreenEditor.ui.componentVisibilityCondition') }}</div>
            <div class="nb-form-col">
              <n-radio-group v-model:value="editing.action.visibleMode" size="small">
                <n-radio value="bool">{{ editorT('bigscreenEditor.ui.componentMatchEnumerationValue') }}</n-radio>
                <n-radio value="threshold">{{ editorT('bigscreenEditor.ui.componentValueLowerBound') }}</n-radio>
              </n-radio-group>
              <n-input
                v-if="editing.action.visibleMode === 'bool'"
                :value="(editing.action.visibleTrueValues ?? []).join(',')"
                size="small"
                :placeholder="editorT('bigscreenEditor.ui.componentValuesTreatedAsVisibleCommaSeparatedEG')"
                @update:value="onVisibleTrueValues"
              />
              <n-input-number
                v-else
                v-model:value="editing.action.visibleMin"
                size="small"
                :placeholder="editorT('bigscreenEditor.ui.componentShowWhenPropertyValueThisValue')"
                :show-button="false"
              />
            </div>
          </template>

          <!-- 位姿运动 -->
          <template v-else-if="editing.action.type === 'motion'">
            <div class="nb-field-label">{{ editorT('bigscreenEditor.ui.componentDriveModePropertyValueCoefficient') }}</div>
            <div class="nb-form-col">
              <n-select
                v-model:value="editing.action.axis"
                size="small"
                :options="[
                  { label: editorT('bigscreenEditor.ui.componentRotateAroundYYaw'), value: 'ry' },
                  { label: editorT('bigscreenEditor.ui.componentRotateAroundXPitch'), value: 'rx' },
                  { label: editorT('bigscreenEditor.ui.componentRotateAroundZRoll'), value: 'rz' },
                  { label: editorT('bigscreenEditor.ui.componentTranslateAlongYRaiseLower'), value: 'py' },
                  { label: editorT('bigscreenEditor.ui.componentTranslateAlongXHorizontalMovement'), value: 'px' },
                  { label: editorT('bigscreenEditor.ui.componentTranslateAlongZForwardBackward'), value: 'pz' }
                ]"
                :placeholder="editorT('bigscreenEditor.ui.componentSelectDriveAxis')"
              />
              <n-input-number
                v-model:value="editing.action.factor"
                size="small"
                :placeholder="editorT('bigscreenEditor.ui.componentCoefficientDegreesOrMetersPerUnit')"
                :step="0.1"
              />
              <div class="nb-hint">{{ editorT('bigscreenEditor.ui.componentEGCoefficient15PropertyValue100') }}</div>
            </div>
          </template>

          <!-- 数值标签 -->
          <template v-else>
            <div class="nb-field-label">{{ editorT('bigscreenEditor.ui.componentLabelPrefix') }}</div>
            <n-input
              v-model:value="editing.action.labelText"
              size="small"
              :placeholder="editing.dataName || editing.dataID || editorT('bigscreenEditor.ui.componentUseThePropertyNameByDefault')"
            />
          </template>

          <n-button size="small" type="primary" class="nb-save-btn" :disabled="!bindingReady" @click="saveBinding">
            {{ editorT('bigscreenEditor.ui.componentSaveBinding') }}
          </n-button>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

/**
 * 3D 模型节点绑定面板（「数据」页签定制面板）
 *
 * 左右分栏：左栏模型点位节点树（搜索/选中），右栏选中节点的绑定编辑
 * （设备物模型属性 + 触发动作：变色/显隐/数值标签）。
 * 数据落在 option.nodeBindings / option.selectedNodePath，与画布拾取双向联动；
 * 数据链路由 canvas.vue 的 watch(nodeBindings) 自治驱动，本组件不负责请求。
 */
import { computed, h, onUnmounted, ref, watch, type PropType } from 'vue'

import { getRequestClient } from '@vben/api'

import { getDeviceList, getProductList, getProductSchema } from '@/api/thingsDevice'
import { option } from './config'
import type { BindingColorRule, GltfNodeInfo, NodeBinding } from './types'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

// ── 节点树 ────────────────────────────────────────────────

interface TreeNode {
  key: string
  label: string
  /** 自身绑定的设备点位数（0 = 本节点未绑定） */
  bindSelf?: number
  /** 子树内绑定总数（含自身；父级分组折叠时可显示汇总徽标） */
  bindSub?: number
  children?: TreeNode[]
}

const nodeFilter = ref('')

/** 左栏宽度（px），拖拽分隔条调整后持久化到大屏 JSON */
const treeWidth = computed(() => (props.optionData as any).panelTreeWidth ?? 168)

let resizing = false
function startResize(e: MouseEvent) {
  e.preventDefault()
  resizing = true
  const move = function (ev: MouseEvent) {
    if (!resizing) return
    ev.preventDefault()
    const treeLeft = document.querySelector('.nb-tree-col')?.getBoundingClientRect().left ?? 0
    const w = Math.min(480, Math.max(120, ev.clientX - treeLeft))
    ;(props.optionData as any).panelTreeWidth = Math.round(w)
  }
  const up = function () {
    resizing = false
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

/** 节点业务描述（path → 描述），取自 option.nodeDescs */
const nodeDescs = computed<Record<string, string>>(() => props.optionData.nodeDescs ?? {})

const nodeDesc = computed(() => {
  const path = props.optionData.selectedNodePath
  return path ? nodeDescs.value[path] ?? '' : ''
})

function onDescInput(value: string) {
  const path = props.optionData.selectedNodePath
  if (!path) return
  const descs = { ...(props.optionData.nodeDescs ?? {}) }
  if (value.trim()) descs[path] = value.trim()
  else delete descs[path]
  props.optionData.nodeDescs = descs
}

/** 节点绑定数（path → 绑定条数）。key 做归一化（剔除点号）：three 名字清理规则可能随版本
 * 变化（如 Model.001 → Model001），归一化后旧绑定与新解析路径仍可命中 */
const normalizeModelPath = (p: string) => p.replace(/\./g, '')
const bindingCountByPath = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const b of props.optionData.nodeBindings ?? []) {
    const key = normalizeModelPath(b.nodePath)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
})

/** 扁平节点快照 → 树形结构（key 即层级 path；label 为纯文本，绑定链样式由 renderLabel 渲染） */
const treeData = computed<TreeNode[]>(() => {
  const nodes: GltfNodeInfo[] = props.optionData.parsedNodes ?? []
  const descs = props.optionData.nodeDescs ?? {}
  const bindCounts = bindingCountByPath.value
  const map = new Map<string, TreeNode>()
  const result: TreeNode[] = []
  for (const node of nodes) {
    const desc = descs[node.path]
    map.set(node.path, {
      key: node.path,
      label: desc ? `${node.name}（${desc}）` : node.name,
      children: []
    })
  }
  for (const node of nodes) {
    const treeNode = map.get(node.path)!
    const sepIndex = node.path.lastIndexOf('/')
    const parentKey = sepIndex > 0 ? node.path.slice(0, sepIndex) : ''
    const parent = parentKey ? map.get(parentKey) : undefined
    if (parent?.children) parent.children.push(treeNode)
    else result.push(treeNode)
  }
  // 倒序遍历（GLTF traverse 序父先于子 → 倒序即子先于父）：把子树绑定数逐层汇入祖先，
  // 使绑定节点到根的整条链都带 bindSub > 0，供 renderLabel 变色/汇总徽标使用
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]
    if (!node) continue
    const treeNode = map.get(node.path)!
    treeNode.bindSelf = bindCounts[normalizeModelPath(node.path)] ?? 0
    treeNode.bindSub = (treeNode.bindSub ?? 0) + treeNode.bindSelf
    const sepIndex = node.path.lastIndexOf('/')
    const parentKey = sepIndex > 0 ? node.path.slice(0, sepIndex) : ''
    const parent = parentKey ? map.get(parentKey) : undefined
    if (parent) parent.bindSub = (parent.bindSub ?? 0) + (treeNode.bindSub ?? 0)
  }
  // 无子节点的清掉空数组（n-tree 渲染展开箭头）
  for (const treeNode of map.values()) {
    if (!treeNode.children?.length) delete treeNode.children
  }
  return result
})

/** 节点树 label 自定义渲染：绑定节点绿色加粗带 ⚡自身数；祖先链绿色带 ⚡子树汇总数；无绑定保持原样 */
const renderLabel = (args: { option: unknown; selected: boolean; checked: boolean }) => {
  const o = (args?.option ?? {}) as TreeNode
  const bindSelf = o.bindSelf ?? 0
  if (!o.bindSub) return o.label
  const style = bindSelf > 0 ? 'color:#18a058;font-weight:600' : 'color:#18a058'
  return h('span', { style }, [
    o.label,
    h('span', { style: 'margin-left:4px;font-size:11px' }, `⚡${bindSelf > 0 ? bindSelf : o.bindSub}`)
  ])
}

const defaultExpandedKeys = computed(() => {
  const nodes = props.optionData.parsedNodes ?? []
  return nodes.slice(0, 3).map((n) => n.path)
})

const selectedKeys = computed(() => {
  const path = props.optionData.selectedNodePath
  return path ? [path] : []
})

function onTreeNodeSelect(keys: Array<string | number>) {
  props.optionData.selectedNodePath = String(keys[0] ?? '')
}

const selectedNode = computed(() => {
  const path = props.optionData.selectedNodePath
  if (!path) return null
  return (props.optionData.parsedNodes ?? []).find((n) => n.path === path) ?? null
})

// ── 节点绑定 ────────────────────────────────────────────────

const editingIndex = ref(-1)
/** 编辑中的绑定副本（保存时写回 nodeBindings，避免未保存的中间态触发数据链路重建） */
const editing = ref<NodeBinding | null>(null)

const selectedBindings = computed(() => {
  const path = props.optionData.selectedNodePath
  return (props.optionData.nodeBindings ?? []).filter((b: NodeBinding) => b.nodePath === path)
})

const bindingReady = computed(() => Boolean(editing.value?.productID && editing.value?.deviceName && editing.value?.dataID))

function addBinding() {
  const node = selectedNode.value
  if (!node) return
  editing.value = {
    nodeID: node.uuid,
    nodePath: node.path,
    nodeName: node.name,
    productID: '',
    productName: '',
    deviceName: '',
    dataID: '',
    dataName: '',
    dataUnit: '',
    action: { type: 'color', colorRules: [] }
  }
  editingIndex.value = -1
}

function startEdit(index: number) {
  const binding = selectedBindings.value[index]
  if (!binding) return
  editingIndex.value = (props.optionData.nodeBindings ?? []).indexOf(binding)
  editing.value = JSON.parse(JSON.stringify(binding)) as NodeBinding
  // 编辑态回填设备/属性下拉数据
  if (binding.productID) {
    void loadDevices(binding.productID)
    void loadSchema(binding.productID)
  }
}

function saveBinding() {
  const binding = editing.value
  if (!binding || !bindingReady.value) return
  const list = props.optionData.nodeBindings ?? []
  if (editingIndex.value >= 0 && editingIndex.value < list.length) {
    list[editingIndex.value] = binding
  } else {
    list.push(binding)
  }
  props.optionData.nodeBindings = [...list]
  editing.value = null
  editingIndex.value = -1
}

function removeBinding(index: number) {
  const binding = selectedBindings.value[index]
  if (!binding) return
  const list = props.optionData.nodeBindings ?? []
  const pos = list.indexOf(binding)
  if (pos >= 0) {
    list.splice(pos, 1)
    props.optionData.nodeBindings = [...list]
  }
}

function bindingSummary(binding: NodeBinding): string {
  const actionName = binding.action.type === 'color' ? editorT('bigscreenEditor.ui.componentColorChange') : binding.action.type === 'visible' ? editorT('bigscreenEditor.ui.componentVisibility') : editorT('iotApp.productPage.tags')
  // 前置节点名：多节点绑定时一眼看出该行属于哪个模型部件
  const nodePrefix = binding.nodeName ? `${binding.nodeName} · ` : ''
  return `${nodePrefix}${binding.dataName || binding.dataID} @ ${binding.deviceName}（${actionName}）`
}

// 选中节点变化时收起编辑表单
watch(
  () => props.optionData.selectedNodePath,
  () => {
    editing.value = null
    editingIndex.value = -1
  }
)

// ── 变色规则编辑 ────────────────────────────────────────────

const useDefaultColor = computed({
  get: () => Boolean(editing.value?.action.defaultColor),
  set: (v: boolean) => {
    if (!editing.value) return
    editing.value.action.defaultColor = v ? '#18a058' : undefined
  }
})

function addRule() {
  if (!editing.value) return
  const rules = editing.value.action.colorRules ?? []
  rules.push({ mode: 'enum', enumValue: '', color: '#18a058' } satisfies BindingColorRule)
  editing.value.action.colorRules = rules
}

function removeRule(index: number) {
  if (!editing.value) return
  editing.value.action.colorRules?.splice(index, 1)
}

function onVisibleTrueValues(value: string) {
  if (!editing.value) return
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  editing.value.action.visibleTrueValues = list
}

// ── 产品 / 设备 / 属性下拉 ────────────────────────────────────

const productOptions = ref<Array<{ label: string; value: string }>>([])
const deviceOptions = ref<Array<{ label: string; value: string }>>([])
const schemaOptions = ref<Array<{ label: string; value: string; unit: string }>>([])
const loadingProducts = ref(false)
const loadingDevices = ref(false)
const loadingSchema = ref(false)

const loadProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await getProductList({ page: { page: 1, size: 1000 } })
    const list: any[] = res?.data?.list ?? []
    productOptions.value = list.map((item: any) => ({
      label: item.productName ?? item.name ?? item.productID,
      value: String(item.productID)
    }))
  } catch (error) {
    console.error('[GlTFModel] 加载产品列表失败', error)
  } finally {
    loadingProducts.value = false
  }
}

const loadDevices = async (productID: string) => {
  if (!productID) {
    deviceOptions.value = []
    return
  }
  loadingDevices.value = true
  try {
    const res = await getDeviceList({ productID, page: { page: 1, size: 1000 } })
    const list: any[] = res?.data?.list ?? []
    deviceOptions.value = list.map((item: any) => ({
      label: item.deviceAlias || item.deviceName,
      value: item.deviceName
    }))
  } catch (error) {
    console.error('[GlTFModel] 加载设备列表失败', error)
  } finally {
    loadingDevices.value = false
  }
}

const loadSchema = async (productID: string) => {
  if (!productID) {
    schemaOptions.value = []
    return
  }
  loadingSchema.value = true
  try {
    const res = await getProductSchema({ productID, type: 1 })
    const list: any[] = res?.data?.list ?? []
    schemaOptions.value = list.map((item: any) => {
      let unit = ''
      try {
        const affordance = typeof item.affordance === 'string' ? JSON.parse(item.affordance || '{}') : item.affordance || {}
        unit = affordance?.define?.unit ?? ''
      } catch {
        unit = ''
      }
      return { label: `${item.name ?? item.identifier}（${item.identifier}）`, value: item.identifier, unit }
    })
  } catch (error) {
    console.error('[GlTFModel] 加载物模型属性失败', error)
  } finally {
    loadingSchema.value = false
  }
}

function onProductChange(value: string) {
  if (!editing.value) return
  editing.value.deviceName = ''
  editing.value.dataID = ''
  editing.value.productName = productOptions.value.find((p) => p.value === value)?.label ?? ''
  void loadDevices(value)
  void loadSchema(value)
}

function onSchemaChange(value: string) {
  if (!editing.value) return
  const schema = schemaOptions.value.find((s) => s.value === value)
  editing.value.dataName = schema?.label?.split('（')[0] ?? value
  editing.value.dataUnit = schema?.unit ?? ''
}

void loadProducts()
</script>

<style scoped>
.nb-panel {
  display: flex;
  gap: 8px;
  height: 100%;
  min-height: 420px;
}

.nb-tree-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  min-width: 120px;
  max-width: 55%;
  overflow: hidden;
}

.nb-resizer {
  width: 8px;
  flex-shrink: 0;
  cursor: col-resize;
  border-radius: 4px;
  /* 常显竖向虚线把手：让用户知道此处可拖拽拉开面板 */
  background: repeating-linear-gradient(to bottom, #cbd5e1 0 4px, transparent 4px 8px) center / 2px 20px no-repeat,
    rgba(148, 163, 184, 0.18);
  transition: background-color 0.15s;
}

.nb-resizer:hover {
  background-color: rgba(24, 160, 251, 0.18);
}

.nb-bind-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 150px;
  overflow-y: auto;
  padding-right: 2px;
}

.nb-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--n-text-color, #333);
}

.nb-tree {
  flex: 1;
  overflow: auto;
}

.nb-hint {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

.nb-node-chip {
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(24, 160, 251, 0.12);
  color: #1890ff;
  font-size: 12px;
  word-break: break-all;
}

.nb-binding-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nb-binding-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--n-color-embedded, #f4f5f7);
}

.nb-binding-text {
  font-size: 12px;
  word-break: break-all;
}

.nb-add-btn {
  width: 100%;
}

.nb-field-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.nb-form-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.nb-rule-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nb-rule-sep {
  font-size: 12px;
  color: #9ca3af;
}

.nb-save-btn {
  width: 100%;
  margin-top: 2px;
}
</style>
