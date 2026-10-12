<template>
  <view class="scene-create-shell">
    <template v-if="viewMode === 'main'">
      <app-navigation-bar custom-back fallback-url="/pages/scene/index" background="var(--page-bg)" @back="handleGuardedBack" />

      <scroll-view class="scene-form-page" scroll-y type="list" :show-scrollbar="false" enable-flex>
        <text class="scene-page-title">{{pageTitle}}</text>

        <view v-if="type === 'manual'" class="name-card">
          <view class="name-card__icon"><app-icon name="tabler:arrow-down-left" :size="24" /></view>
          <view class="name-card__divider" />
          <input
            class="name-card__input"
            :value="nameInput"
            maxlength="30"
            placeholder="请输入手动控制名称"
            @blur="handleNameInputBlur"
          />
        </view>

        <view v-if="type === 'auto'" class="scene-section">
          <text class="scene-section__title">当以下情况发生</text>
          <view v-if="triggers.length === 0" class="add-card" hover-class="add-card--hover" @tap="openTriggerSheet">
            <view class="add-card__icon"><app-icon name="tabler:plus" :size="24" /></view>
            <text class="add-card__text">添加触发条件</text>
          </view>
          <view
            v-for="(item, index) in triggers"
            :key="`trigger-${index}`"
            class="summary-card"
            hover-class="summary-card--hover"
            @tap="editTrigger(index)"
          >
            <view class="summary-card__body">
              <text class="summary-card__title">{{triggerTitle(item)}}</text>
              <text class="summary-card__desc">{{formatTrigger(item)}}</text>
            </view>
            <view class="summary-card__delete" @tap.stop="removeTrigger(index)"><text>删除</text></view>
          </view>
        </view>

        <view class="scene-section">
          <text class="scene-section__title">{{type === 'auto' ? '将设备调整到' : '将设备调整到'}}</text>
          <view v-if="actions.length === 0" class="add-card" hover-class="add-card--hover" @tap="openActionSheet">
            <view class="add-card__icon"><app-icon name="tabler:plus" :size="24" /></view>
            <text class="add-card__text">添加执行动作</text>
          </view>
          <view
            v-for="(item, index) in actions"
            :key="`action-${index}`"
            class="summary-card"
            hover-class="summary-card--hover"
            @tap="editAction(index)"
          >
            <view class="summary-card__body">
              <text class="summary-card__title">{{actionTitle(item)}}</text>
              <text class="summary-card__desc">{{formatAction(item)}}</text>
            </view>
            <view class="summary-card__delete" @tap.stop="removeAction(index)"><text>删除</text></view>
          </view>
        </view>

        <view class="scene-form-bottom-space" />
      </scroll-view>

      <view class="fixed-create-bar">
        <button class="create-button" :class="{ 'create-button--disabled': !canSave }" :disabled="saving" @tap="handleSave">
          {{saving ? '创建中' : buttonText}}
        </button>
      </view>
    </template>

    <template v-else-if="viewMode === 'timer'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:x" :size="22" /></view>
          <view class="edit-nav__action" @tap="commitDraftTrigger"><app-icon name="tabler:check" :size="22" /></view>
        </view>
        <text class="scene-page-title">定时</text>

        <view class="timer-card" @tap="selectTimerType('at')">
          <view class="timer-card__row">
            <text :class="`timer-card__title ${draftTimerExecType === 'at' ? 'timer-card__title--active' : ''}`">指定时间点</text>
            <view :class="`radio-dot ${draftTimerExecType === 'at' ? 'radio-dot--active' : ''}`" />
          </view>
          <view v-if="draftTimerExecType === 'at'" class="timer-card__row timer-card__row--inner">
            <text class="timer-card__label">时间</text>
            <picker mode="time" :value="secToHm(draftTrigger?.timer?.execAt)" @change="handleDraftTimerAtChange">
              <text class="timer-card__value">{{secToHm(draftTrigger?.timer?.execAt)}}</text>
            </picker>
          </view>
        </view>

        <view class="timer-card" @tap="selectTimerType('sunRises')">
          <view class="timer-card__row">
            <text :class="`timer-card__title ${draftTimerExecType === 'sunRises' ? 'timer-card__title--active' : ''}`">日出</text>
            <view :class="`radio-dot ${draftTimerExecType === 'sunRises' ? 'radio-dot--active' : ''}`" />
          </view>
          <view v-if="draftTimerExecType === 'sunRises'" class="timer-card__row timer-card__row--inner">
            <text class="timer-card__label">偏移</text>
            <input class="timer-card__input" type="number" :value="draftTimerOffsetMinutes" @blur="handleDraftTimerOffsetMinutesBlur" />
          </view>
        </view>

        <view class="timer-card" @tap="selectTimerType('sunSet')">
          <view class="timer-card__row">
            <text :class="`timer-card__title ${draftTimerExecType === 'sunSet' ? 'timer-card__title--active' : ''}`">日落</text>
            <view :class="`radio-dot ${draftTimerExecType === 'sunSet' ? 'radio-dot--active' : ''}`" />
          </view>
          <view v-if="draftTimerExecType === 'sunSet'" class="timer-card__row timer-card__row--inner">
            <text class="timer-card__label">偏移</text>
            <input class="timer-card__input" type="number" :value="draftTimerOffsetMinutes" @blur="handleDraftTimerOffsetMinutesBlur" />
          </view>
        </view>

        <view class="timer-repeat-card" @tap="openRepeatSheet">
          <text class="timer-repeat-card__label">重复</text>
          <view class="timer-repeat-card__value">
            <text>{{repeatText}}</text>
            <app-icon class="chevron" name="tabler:chevron-right" :size="18" />
          </view>
        </view>
      </view>
    </template>

    <template v-else-if="viewMode === 'deviceTrigger'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
          <view class="edit-nav__action" @tap="commitDraftTrigger"><app-icon name="tabler:check" :size="22" /></view>
        </view>
        <text class="scene-page-title">设备发生变化时</text>
        <view class="toolbar-row">
          <text class="toolbar-row__label">选择设备</text>
          <view class="toolbar-row__pill" @tap="openProductPicker('trigger')"><text>筛选</text></view>
        </view>
        <view class="form-card">
          <view class="form-row" @tap="openProductPicker('trigger')">
            <text class="form-row__label">产品</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.productName || draftTrigger?.device?.productID || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row" @tap="openDevicePicker('trigger')">
            <text class="form-row__label">设备</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.deviceAlias || draftTrigger?.device?.deviceName || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row" @tap="openSchemaPicker('trigger')">
            <text class="form-row__label">条件</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.dataName || draftTrigger?.device?.dataID || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row">
            <text class="form-row__label">比较</text>
            <view class="chip-group">
              <view :class="chipClass(draftTrigger?.device?.termType === 'eq')" @tap="patchDraftTriggerDevice({ termType: 'eq' })"><text>等于</text></view>
              <view :class="chipClass(draftTrigger?.device?.termType === 'gt')" @tap="patchDraftTriggerDevice({ termType: 'gt' })"><text>大于</text></view>
              <view :class="chipClass(draftTrigger?.device?.termType === 'lt')" @tap="patchDraftTriggerDevice({ termType: 'lt' })"><text>小于</text></view>
            </view>
          </view>
          <view class="form-row">
            <text class="form-row__label">值</text>
            <input class="form-row__input" :value="draftTriggerValue" placeholder="例如 1" @blur="handleDraftTriggerValueBlur" />
          </view>
        </view>
      </view>
    </template>

    <template v-else-if="viewMode === 'duration'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
          <view class="edit-nav__action" @tap="commitDraftTrigger"><app-icon name="tabler:check" :size="22" /></view>
        </view>
        <text class="scene-page-title">持续一段时间后</text>
        <view class="form-card">
          <view class="form-row" @tap="openProductPicker('trigger')">
            <text class="form-row__label">产品</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.productName || draftTrigger?.device?.productID || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row" @tap="openDevicePicker('trigger')">
            <text class="form-row__label">设备</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.deviceAlias || draftTrigger?.device?.deviceName || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row" @tap="openSchemaPicker('trigger')">
            <text class="form-row__label">状态</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.dataName || draftTrigger?.device?.dataID || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row">
            <text class="form-row__label">持续</text>
            <view class="form-row__right">
              <input class="form-row__number" type="number" :value="draftDurationValue" @blur="handleDraftDurationValueBlur" />
              <text class="form-row__unit">秒</text>
            </view>
          </view>
        </view>
      </view>
    </template>

    <template v-else-if="viewMode === 'deviceAction'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
          <view class="edit-nav__action" @tap="commitDraftAction"><app-icon name="tabler:check" :size="22" /></view>
        </view>
        <text class="scene-page-title">选择要控制的设备</text>
        <view class="toolbar-row">
          <text class="toolbar-row__label">选择设备</text>
          <view class="toolbar-row__pill" @tap="openProductPicker('action')"><text>筛选</text></view>
        </view>
        <view class="form-card">
          <view class="form-row" @tap="openProductPicker('action')">
            <text class="form-row__label">产品</text>
            <view class="form-row__value"><text>{{draftAction?.device?.productName || draftAction?.device?.productID || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row" @tap="openDevicePicker('action')">
            <text class="form-row__label">设备</text>
            <view class="form-row__value"><text>{{draftAction?.device?.deviceAlias || draftAction?.device?.deviceName || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row" @tap="openSchemaPicker('action')">
            <text class="form-row__label">功能</text>
            <view class="form-row__value"><text>{{draftAction?.device?.dataName || draftAction?.device?.dataID || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row">
            <text class="form-row__label">值</text>
            <input class="form-row__input" :value="draftActionValue" placeholder="例如 1" @blur="handleDraftActionValueBlur" />
          </view>
        </view>
        <view class="bottom-link-card" @tap="fillBatchSwitchAction">
          <view>
            <text class="bottom-link-card__title">打开/关闭设备</text>
            <text class="bottom-link-card__desc">如：打开客厅灯</text>
          </view>
          <app-icon class="chevron" name="tabler:chevron-right" :size="18" />
        </view>
      </view>
    </template>

    <template v-else-if="viewMode === 'delay'">
      <view class="scene-edit-page scene-edit-page--dim">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
          <view class="edit-nav__action" @tap="commitDraftAction"><app-icon name="tabler:check" :size="22" /></view>
        </view>
        <text class="scene-page-title">延时执行</text>
        <view class="picker-panel">
          <text class="picker-panel__title">延时</text>
          <text class="picker-panel__value">{{delayMinuteText}}:{{delaySecondText}}</text>
          <view class="delay-fields">
            <view class="delay-field">
              <input type="number" class="delay-field__input" :value="delayMinutes" @blur="handleDelayMinutesBlur" />
              <text class="delay-field__unit">分</text>
            </view>
            <view class="delay-field">
              <input type="number" class="delay-field__input" :value="delaySeconds" @blur="handleDelaySecondsBlur" />
              <text class="delay-field__unit">秒</text>
            </view>
          </view>
          <view class="sheet-actions">
            <button class="sheet-button sheet-button--cancel" @tap="returnToMain">取消</button>
            <button class="sheet-button sheet-button--primary" @tap="commitDraftAction">确定</button>
          </view>
        </view>
      </view>
    </template>
  </view>

  <view v-if="activeSheet" class="overlay" @tap="closeSheet" />
  <view :class="`mi-bottom-sheet ${activeSheet ? 'mi-bottom-sheet--visible' : ''}`">
    <template v-if="activeSheet === 'trigger'">
      <text class="mi-bottom-sheet__title">添加触发条件</text>
      <view class="sheet-group">
        <view class="sheet-option" @tap="startDeviceTrigger"><app-icon class="sheet-option__icon" name="tabler:home" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">家居设备</text><text class="sheet-option__desc">如：打开门锁时</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
        <view class="sheet-option sheet-option--disabled"><app-icon class="sheet-option__icon" name="tabler:device-mobile" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">个人设备</text><text class="sheet-option__desc">如：手机打开静音模式时</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
        <view class="sheet-option sheet-option--disabled"><app-icon class="sheet-option__icon" name="tabler:car" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">汽车</text><text class="sheet-option__desc">如：车到达某地时</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
      </view>
      <view class="sheet-group">
        <view class="sheet-option" @tap="startTimerTrigger"><app-icon class="sheet-option__icon" name="tabler:clock" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">特定时间</text><text class="sheet-option__desc">如：早上 8:00 时</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
        <view class="sheet-option" @tap="startDurationTrigger"><app-icon class="sheet-option__icon" name="tabler:hourglass" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">持续一段时间后</text><text class="sheet-option__desc">如：电视开着 20 分钟后</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
      </view>
      <view class="sheet-group">
        <view class="sheet-option sheet-option--disabled"><app-icon class="sheet-option__icon" name="tabler:user" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">个人状态变化</text><text class="sheet-option__desc">如：当我回到家中时</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
        <view class="sheet-option" @tap="addWeatherTrigger"><app-icon class="sheet-option__icon" name="tabler:cloud" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">空间环境变化</text><text class="sheet-option__desc">如：温度升高到 24℃时</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
      </view>
      <button class="cancel-sheet-button" @tap="closeSheet">取消</button>
    </template>

    <template v-else-if="activeSheet === 'action'">
      <text class="mi-bottom-sheet__title">添加执行动作</text>
      <view class="sheet-group">
        <view class="sheet-option" @tap="startDeviceAction"><app-icon class="sheet-option__icon" name="tabler:home" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">家居设备</text><text class="sheet-option__desc">如：打开吸顶灯</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
      </view>
      <view class="sheet-group">
        <view class="sheet-option" @tap="startDelayAction"><app-icon class="sheet-option__icon" name="tabler:hourglass" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">延时</text><text class="sheet-option__desc">如：延时 5 分钟后执行</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
      </view>
      <view class="sheet-group">
        <view class="sheet-option" @tap="addNotifyAction"><app-icon class="sheet-option__icon" name="tabler:bell" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">通知</text><text class="sheet-option__desc">如：向手机发送某个通知</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
      </view>
      <view class="sheet-group">
        <view class="sheet-option" @tap="addSceneAction"><app-icon class="sheet-option__icon" name="tabler:automation" :size="22" /><view class="sheet-option__body"><text class="sheet-option__title">已创建的自动化</text><text class="sheet-option__desc">如：某条自动化或手动控制</text></view><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
      </view>
      <button class="cancel-sheet-button" @tap="closeSheet">取消</button>
    </template>

    <template v-else-if="activeSheet === 'repeat'">
      <text class="mi-bottom-sheet__title">重复</text>
      <view class="repeat-option" @tap="setRepeat('once')"><text>只执行一次</text><app-icon v-if="draftTrigger?.timer?.repeatType === 'once'" name="tabler:check" :size="18" /></view>
      <view class="repeat-option repeat-option--active" @tap="setRepeat('allDay')"><text>每天</text><app-icon v-if="draftTrigger?.timer?.repeatType === 'allDay'" name="tabler:check" :size="18" /></view>
      <view class="repeat-option" @tap="setWorkdayRepeat"><text>法定工作日</text><app-icon v-if="draftTrigger?.timer?.execRepeat === '1111100'" name="tabler:check" :size="18" /></view>
      <view class="repeat-option" @tap="setWeekendRepeat"><text>法定节假日</text><app-icon v-if="draftTrigger?.timer?.execRepeat === '0000011'" name="tabler:check" :size="18" /></view>
      <view class="repeat-option" @tap="setRepeat('week')"><text>自定义</text><app-icon v-if="draftTrigger?.timer?.repeatType === 'week'" name="tabler:check" :size="18" /></view>
      <view v-if="draftTrigger?.timer?.repeatType === 'week'" class="week-picker">
        <view v-for="(item, index) in weekLabels" :key="item" :class="`week-chip ${weekFlag(draftTrigger?.timer?.execRepeat, index) ? 'week-chip--active' : ''}`" @tap="toggleWeek(index)">
          <text>{{item}}</text>
        </view>
      </view>
      <view class="sheet-actions">
        <button class="sheet-button sheet-button--cancel" @tap="closeSheet">取消</button>
        <button class="sheet-button sheet-button--primary" @tap="closeSheet">确定</button>
      </view>
    </template>
  </view>

  <product-picker :visible="productPickerVisible" :selected-id="pickerProductID" :devices="sceneDevices" :loading="deviceListLoading" @select="handleProductSelected" @close="productPickerVisible = false" />
  <device-picker :visible="devicePickerVisible" :product-id="pickerProductID" :selected-name="pickerDeviceName" :devices="sceneDevices" :loading="deviceListLoading" @select="handleDeviceSelected" @close="devicePickerVisible = false" />
  <schema-picker :visible="schemaPickerVisible" :product-id="pickerProductID" :schema-type="pickerSchemaType" :selected-id="pickerSchemaID" @select="handleSchemaSelected" @close="schemaPickerVisible = false" />
</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { computed, ref, watch } from 'vue';
import { onBackPress, onLoad, onUnload } from '@dcloudio/uni-app';
import { sceneEditProvider, type SceneEditState } from '../../../providers/scene-edit.provider';
import { deviceListProvider, type DeviceListState } from '../../../providers/device-list.provider';
import type { CmpType, ExecType, RepeatType, SceneTrigger } from '../../../domain/models/scene-trigger.model';
import type { ActionType, NotifyType, SceneAction } from '../../../domain/models/scene-action.model';
import type { SceneCondition } from '../../../domain/models/scene-condition.model';
import type { DeviceEntity } from '../../../domain/entities/device.entity';
import { createEmptyCondition } from '../../../domain/models/scene-condition.model';
import ProductPicker from '../../components/product-picker/product-picker.vue';
import DevicePicker from '../../components/device-picker/device-picker.vue';
import SchemaPicker from '../../components/schema-picker/schema-picker.vue';
import { safeNavigateBack } from '../../../utils/navigation';
import { ensurePageReady } from '../../../utils/page-guard';
import { getSystemInfo } from '../../../utils/platform';

type ViewMode = 'main' | 'timer' | 'deviceTrigger' | 'duration' | 'deviceAction' | 'delay';
type SheetName = '' | 'trigger' | 'action' | 'repeat';
type PickerTarget = '' | 'trigger' | 'action';
type SchemaKind = 'property-write' | 'property-read' | 'property-all' | 'event' | 'action';

const id = ref('');
const mode = ref<'create' | 'edit'>('create');
const name = ref('');
const type = ref<'manual' | 'auto'>('manual');
const triggers = ref<SceneTrigger[]>([]);
const conditions = ref<SceneCondition>(createEmptyCondition());
const actions = ref<SceneAction[]>([]);
const saving = ref(false);
const isDirty = ref(false);
const validationErrors = ref<string[]>([]);

/** 场景名输入框的可写代理：v-model 经 provider 写回场景基本信息 */
const nameInput = computed({
  get: () => name.value,
  set: (value) => sceneEditProvider.updateBasicInfo({ name: String(value ?? '') }),
});

/**
 * 输入框统一采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示
 * （微信小程序 iOS + 第三方输入法下，聚焦时回写会导致粘贴内容不显示）。blur 先于页面内按钮 tap，
 * 提交、确认等读取处拿到的均为最新值；给可写 computed 赋值即触发对应 setter 写回。
 */
function handleNameInputBlur(e: any) { nameInput.value = e.detail.value }
function handleDraftTimerOffsetMinutesBlur(e: any) { draftTimerOffsetMinutes.value = e.detail.value }
function handleDraftTriggerValueBlur(e: any) { draftTriggerValue.value = e.detail.value }
function handleDraftDurationValueBlur(e: any) { draftDurationValue.value = e.detail.value }
function handleDraftActionValueBlur(e: any) { draftActionValue.value = e.detail.value }
function handleDelayMinutesBlur(e: any) { delayMinutes.value = e.detail.value }
function handleDelaySecondsBlur(e: any) { delaySeconds.value = e.detail.value }

const viewMode = ref<ViewMode>('main');
const activeSheet = ref<SheetName>('');
const editingTriggerIndex = ref(-1);
const editingActionIndex = ref(-1);
const draftTrigger = ref<SceneTrigger | null>(null);
const draftAction = ref<SceneAction | null>(null);
const pickerTarget = ref<PickerTarget>('');
const productPickerVisible = ref(false);
const devicePickerVisible = ref(false);
const schemaPickerVisible = ref(false);
const delayMinutes = ref('0');
const delaySeconds = ref('30');
/** 日出/日落偏移分钟数的可写代理：v-model 展示分钟，写回草稿时换算为秒 */
const draftTimerOffsetMinutes = computed<string | number>({
  get: () => secondsToMinutes(draftTrigger.value?.timer?.execAdd),
  set: (value) => patchDraftTimer({ execAdd: Number(value || 0) * 60 }),
});
/** 设备触发条件值的可写代理：v-model 写回草稿 values 数组首项 */
const draftTriggerValue = computed<string>({
  get: () => firstValue(draftTrigger.value?.device?.values),
  set: (value) => patchDraftTriggerDevice({ values: [String(value ?? '')] }),
});
/** 持续时长秒数的可写代理：v-model 写回草稿 stateKeep */
const draftDurationValue = computed<string | number>({
  get: () => draftTrigger.value?.device?.stateKeep?.value || 300,
  set: (value) => {
    const duration = Math.max(0, Number(value || 0));
    patchDraftTriggerDevice({ stateKeep: { type: 'duration', value: duration } });
  },
});
/** 设备动作值的可写代理：v-model 写回草稿 value 与 values */
const draftActionValue = computed<string>({
  get: () => draftAction.value?.device?.value || '',
  set: (value) => {
    if (!draftAction.value?.device) return;
    const next = String(value ?? '');
    const device = draftAction.value.device;
    draftAction.value = {
      ...draftAction.value,
      device: {
        ...device,
        value: next,
        values: device.dataID ? [{ dataID: device.dataID, dataName: device.dataName, value: next }] : [],
      },
    };
  },
});
const sceneDevices = ref<DeviceEntity[]>([]);
const deviceListLoading = ref(false);
const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
// sys 保存当前窗口与微信胶囊位置信息，供自定义编辑导航避让系统区域。
const sys = getSystemInfo();
// editNavHeight 表示状态栏与导航内容区的总高度。
const editNavHeight = (sys.statusBarHeight || 0) + (sys.navBarHeight || 44);
// editNavRightInset 让右侧确认按钮停在微信胶囊左侧。
const editNavRightInset = sys.menuButtonRect ? Math.max(15, sys.screenWidth - sys.menuButtonRect.left + 8) : 15;
// editNavStyle 统一应用到创建场景的所有子编辑页导航。
const editNavStyle = [
  `height: ${editNavHeight}px`,
  `padding-top: ${sys.statusBarHeight || 0}px`,
  `padding-right: ${editNavRightInset}px`,
].join('; ');

let unsubscribe: (() => void) | undefined;
let unsubscribeDeviceList: (() => void) | undefined;
let cleaned = false;
let leaving = false;
let lastBackHandledAt = 0;

function syncState(state: SceneEditState) {
  id.value = state.id;
  mode.value = state.mode;
  name.value = state.name;
  type.value = state.type;
  triggers.value = state.triggers;
  conditions.value = state.conditions || createEmptyCondition();
  actions.value = state.actions;
  saving.value = state.saving;
  isDirty.value = state.isDirty;
  validationErrors.value = state.validationErrors || [];
}

// syncDeviceListState 同步场景选择器可用的统一设备列表。
function syncDeviceListState(state: DeviceListState): void {
  sceneDevices.value = state.list;
  deviceListLoading.value = state.pageState.loading;
}

onLoad(async (query) => {
  const ready = await ensurePageReady('/packageScene/pages/create/index', (query || {}) as Record<string, string>);
  if (!ready) return;
  unsubscribe = sceneEditProvider.subscribe(syncState);
  unsubscribeDeviceList = deviceListProvider.subscribe(syncDeviceListState);
  syncDeviceListState(deviceListProvider.getState());
  const sceneID = typeof query?.id === 'string' ? query.id : '';
  const createType = query?.type === 'auto' ? 'auto' : 'manual';
  if (sceneID) {
    sceneEditProvider.initEdit(sceneID).catch((err) => {
      uni.showToast({ title: (err as Error).message || '加载场景失败', icon: 'none' });
    });
  } else {
    sceneEditProvider.initCreate();
    sceneEditProvider.updateBasicInfo({
      type: createType,
      name: createType === 'auto' ? '自动化场景' : '',
    });
  }
});

onBackPress(() => handleAndroidBack());
onUnload(() => cleanup());

const pageTitle = computed(() => {
  if (mode.value === 'edit') return type.value === 'auto' ? '编辑自动化' : '编辑手动控制';
  return type.value === 'auto' ? '创建自动化' : '创建手动控制';
});
const buttonText = computed(() => (mode.value === 'edit' ? '保存' : '创建'));
const canSave = computed(() => {
  if (saving.value) return false;
  if (type.value === 'manual' && !name.value.trim()) return false;
  if (type.value === 'auto' && triggers.value.length === 0) return false;
  if (actions.value.length === 0) return false;
  return validationErrors.value.length === 0;
});
const draftTimerExecType = computed(() => draftTrigger.value?.timer?.execType || 'at');
const repeatText = computed(() => repeatLabel(draftTrigger.value?.timer?.repeatType, draftTrigger.value?.timer?.execRepeat));
const pickerProductID = computed(() => {
  if (pickerTarget.value === 'trigger') return draftTrigger.value?.device?.productID || '';
  if (pickerTarget.value === 'action') return draftAction.value?.device?.productID || '';
  return '';
});
const pickerDeviceName = computed(() => {
  if (pickerTarget.value === 'trigger') return draftTrigger.value?.device?.deviceName || '';
  if (pickerTarget.value === 'action') return draftAction.value?.device?.deviceName || '';
  return '';
});
const pickerSchemaID = computed(() => {
  if (pickerTarget.value === 'trigger') return draftTrigger.value?.device?.dataID || '';
  if (pickerTarget.value === 'action') return draftAction.value?.device?.dataID || '';
  return '';
});
const pickerSchemaType = computed<SchemaKind>(() => (pickerTarget.value === 'action' ? 'property-write' : 'property-read'));
const delayMinuteText = computed(() => delayMinutes.value.padStart(2, '0'));
const delaySecondText = computed(() => delaySeconds.value.padStart(2, '0'));

function cleanup() {
  if (cleaned) return;
  cleaned = true;
  unsubscribe?.();
  unsubscribeDeviceList?.();
  sceneEditProvider.reset();
}

function openTriggerSheet() {
  activeSheet.value = 'trigger';
}

function openActionSheet() {
  activeSheet.value = 'action';
}

function closeSheet() {
  activeSheet.value = '';
}

function returnToMain() {
  activeSheet.value = '';
  viewMode.value = 'main';
  editingTriggerIndex.value = -1;
  editingActionIndex.value = -1;
  draftTrigger.value = null;
  draftAction.value = null;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function startTimerTrigger() {
  closeSheet();
  editingTriggerIndex.value = -1;
  draftTrigger.value = {
    type: 'timer',
    order: triggers.value.length,
    timer: { execType: 'at', execAt: hmToSec(currentHm()), repeatType: 'allDay' },
  };
  viewMode.value = 'timer';
}

function startDeviceTrigger() {
  closeSheet();
  editingTriggerIndex.value = -1;
  draftTrigger.value = createDeviceTrigger(false);
  viewMode.value = 'deviceTrigger';
}

function startDurationTrigger() {
  closeSheet();
  editingTriggerIndex.value = -1;
  draftTrigger.value = createDeviceTrigger(true);
  viewMode.value = 'duration';
}

function addWeatherTrigger() {
  closeSheet();
  sceneEditProvider.addTrigger({
    type: 'weather',
    order: triggers.value.length,
    weather: { type: 'temp', termType: 'gt', values: ['24'] },
  });
}

function createDeviceTrigger(withDuration: boolean): SceneTrigger {
  return {
    type: 'device',
    order: triggers.value.length,
    device: {
      productID: '',
      selectType: 'fixed',
      type: 'propertyReport',
      dataID: '',
      termType: 'eq',
      values: [],
      stateKeep: withDuration ? { type: 'duration', value: 300 } : undefined,
    },
  };
}

function startDeviceAction() {
  closeSheet();
  editingActionIndex.value = -1;
  draftAction.value = createDeviceAction();
  viewMode.value = 'deviceAction';
}

function startDelayAction() {
  closeSheet();
  editingActionIndex.value = -1;
  delayMinutes.value = '0';
  delaySeconds.value = '30';
  draftAction.value = { type: 'delay', order: actions.value.length, delay: 30 };
  viewMode.value = 'delay';
}

function addNotifyAction() {
  closeSheet();
  sceneEditProvider.addAction({
    type: 'notify',
    order: actions.value.length,
    notify: { type: 'wxMini', notifyCode: 'ruleScene', userType: 'account', accounts: [] },
  });
}

function addSceneAction() {
  closeSheet();
  sceneEditProvider.addAction({ type: 'scene', order: actions.value.length, scene: { sceneID: '', status: 1 } });
}

function createDeviceAction(): SceneAction {
  return {
    type: 'device',
    order: actions.value.length,
    device: {
      productID: '',
      selectType: 'fixed',
      type: 'propertyControl',
      dataID: '',
      value: '',
      values: [],
    },
  };
}

function editTrigger(index: number) {
  const trigger = triggers.value[index];
  editingTriggerIndex.value = index;
  draftTrigger.value = clone(trigger);
  if (trigger.type === 'timer') viewMode.value = 'timer';
  else if (trigger.type === 'device' && trigger.device?.stateKeep?.type === 'duration') viewMode.value = 'duration';
  else if (trigger.type === 'device') viewMode.value = 'deviceTrigger';
}

function editAction(index: number) {
  const action = actions.value[index];
  editingActionIndex.value = index;
  draftAction.value = clone(action);
  if (action.type === 'device') viewMode.value = 'deviceAction';
  else if (action.type === 'delay') {
    const delay = action.delay || 0;
    delayMinutes.value = String(Math.floor(delay / 60));
    delaySeconds.value = String(delay % 60);
    viewMode.value = 'delay';
  }
}

function commitDraftTrigger() {
  if (!draftTrigger.value) {
    returnToMain();
    return;
  }
  const next = clone(draftTrigger.value!);
  if (editingTriggerIndex.value >= 0) sceneEditProvider.updateTrigger(editingTriggerIndex.value, next);
  else sceneEditProvider.addTrigger(next);
  returnToMain();
}

function commitDraftAction() {
  if (!draftAction.value) {
    returnToMain();
    return;
  }
  if (draftAction.value.type === 'delay') {
    draftAction.value.delay = Number(delayMinutes.value || 0) * 60 + Number(delaySeconds.value || 0);
  }
  const next = clone(draftAction.value);
  if (editingActionIndex.value >= 0) sceneEditProvider.updateAction(editingActionIndex.value, next);
  else sceneEditProvider.addAction(next);
  returnToMain();
}

function removeTrigger(index: number) {
  sceneEditProvider.removeTrigger(index);
}

function removeAction(index: number) {
  sceneEditProvider.removeAction(index);
}

function selectTimerType(execType: ExecType) {
  if (!draftTrigger.value?.timer) return;
  draftTrigger.value = {
    ...draftTrigger.value,
    timer: {
      ...draftTrigger.value.timer,
      execType,
      execAt: execType === 'at' ? draftTrigger.value.timer.execAt || hmToSec(currentHm()) : draftTrigger.value.timer.execAt,
      execAdd: execType === 'sunRises' || execType === 'sunSet' ? draftTrigger.value.timer.execAdd || 0 : draftTrigger.value.timer.execAdd,
    },
  };
}

function handleDraftTimerAtChange(e: any) {
  patchDraftTimer({ execAt: hmToSec(String(e.detail?.value || '00:00')) });
}

function patchDraftTimer(patch: Partial<NonNullable<SceneTrigger['timer']>>) {
  if (!draftTrigger.value?.timer) return;
  draftTrigger.value = { ...draftTrigger.value, timer: { ...draftTrigger.value.timer, ...patch } };
}

function openRepeatSheet() {
  activeSheet.value = 'repeat';
}

function setRepeat(repeatType: RepeatType) {
  patchDraftTimer({ repeatType, execRepeat: repeatType === 'week' ? draftTrigger.value?.timer?.execRepeat || '1111100' : undefined });
}

function setWorkdayRepeat() {
  patchDraftTimer({ repeatType: 'week', execRepeat: '1111100' });
}

function setWeekendRepeat() {
  patchDraftTimer({ repeatType: 'week', execRepeat: '0000011' });
}

function toggleWeek(index: number) {
  const raw = (draftTrigger.value?.timer?.execRepeat || '0000000').padEnd(7, '0').slice(0, 7).split('');
  raw[index] = raw[index] === '1' ? '0' : '1';
  patchDraftTimer({ repeatType: 'week', execRepeat: raw.join('') });
}

function patchDraftTriggerDevice(patch: Partial<NonNullable<SceneTrigger['device']>>) {
  if (!draftTrigger.value?.device) return;
  draftTrigger.value = { ...draftTrigger.value, device: { ...draftTrigger.value.device, ...patch } };
}

/** 延时分钟输入时同步做范围钳制（不小于 0） */
watch(delayMinutes, (next) => {
  const clamped = String(Math.max(0, Number(next || 0)));
  if (clamped !== next) delayMinutes.value = clamped;
});

/** 延时秒输入时同步做范围钳制（0-59） */
watch(delaySeconds, (next) => {
  const clamped = String(Math.min(59, Math.max(0, Number(next || 0))));
  if (clamped !== next) delaySeconds.value = clamped;
});

function fillBatchSwitchAction() {
  if (!draftAction.value?.device) return;
  draftAction.value = {
    ...draftAction.value,
    device: {
      ...draftAction.value.device,
      dataID: draftAction.value.device.dataID || 'PowerSwitch',
      dataName: draftAction.value.device.dataName || '开关',
      value: draftAction.value.device.value || '1',
      values: [{ dataID: draftAction.value.device.dataID || 'PowerSwitch', dataName: draftAction.value.device.dataName || '开关', value: draftAction.value.device.value || '1' }],
    },
  };
}

function openProductPicker(target: PickerTarget) {
  pickerTarget.value = target;
  productPickerVisible.value = true;
}

function openDevicePicker(target: PickerTarget) {
  pickerTarget.value = target;
  if (!pickerProductID.value) {
    uni.showToast({ title: '请先选择产品', icon: 'none' });
    return;
  }
  devicePickerVisible.value = true;
}

function openSchemaPicker(target: PickerTarget) {
  pickerTarget.value = target;
  if (!pickerProductID.value) {
    uni.showToast({ title: '请先选择产品', icon: 'none' });
    return;
  }
  schemaPickerVisible.value = true;
}

function handleProductSelected(payload: { productID: string; productName: string }) {
  if (pickerTarget.value === 'trigger') {
    patchDraftTriggerDevice({ productID: payload.productID, productName: payload.productName, deviceName: '', deviceAlias: '', dataID: '', dataName: '', values: [] });
  } else if (draftAction.value?.device) {
    draftAction.value = { ...draftAction.value, device: { ...draftAction.value.device, productID: payload.productID, productName: payload.productName, deviceName: '', deviceAlias: '', dataID: '', dataName: '', value: '', values: [] } };
  }
  productPickerVisible.value = false;
  setTimeout(() => {
    devicePickerVisible.value = true;
  }, 0);
}

function handleDeviceSelected(payload: { productID: string; deviceName: string; deviceAlias: string; productName: string }) {
  if (pickerTarget.value === 'trigger') {
    patchDraftTriggerDevice({ productID: payload.productID, productName: payload.productName, deviceName: payload.deviceName, deviceAlias: payload.deviceAlias });
  } else if (draftAction.value?.device) {
    draftAction.value = { ...draftAction.value, device: { ...draftAction.value.device, productID: payload.productID, productName: payload.productName, deviceName: payload.deviceName, deviceAlias: payload.deviceAlias } };
  }
  devicePickerVisible.value = false;
}

function handleSchemaSelected(payload: { dataID: string; dataName: string; kind: string }) {
  if (pickerTarget.value === 'trigger') {
    patchDraftTriggerDevice({ dataID: payload.dataID, dataName: payload.dataName, values: firstValue(draftTrigger.value?.device?.values) ? draftTrigger.value?.device?.values : [] });
  } else if (draftAction.value?.device) {
    const value = draftAction.value.device.value || '';
    draftAction.value = {
      ...draftAction.value,
      device: {
        ...draftAction.value.device,
        dataID: payload.dataID,
        dataName: payload.dataName,
        value,
        values: value ? [{ dataID: payload.dataID, dataName: payload.dataName, value }] : [],
      },
    };
  }
  schemaPickerVisible.value = false;
}

async function handleSave() {
  if (!canSave.value) {
    uni.showToast({ title: validationErrors.value[0] || '请先补全场景', icon: 'none' });
    return;
  }
  try {
    if (type.value === 'auto' && !name.value.trim()) sceneEditProvider.updateBasicInfo({ name: '自动化场景' });
    await sceneEditProvider.save();
    uni.showToast({ title: mode.value === 'edit' ? '已保存' : '已创建', icon: 'success' });
    leaving = true;
    setTimeout(() => navigateBack(), 400);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '保存失败', icon: 'none' });
  }
}

function handleGuardedBack() {
  if (leaving || !sceneEditProvider.isDirty()) {
    navigateBack();
    return;
  }
  uni.showModal({
    title: '退出后修改将丢失',
    content: '当前内容还没有保存，确认退出吗？',
    confirmText: '退出',
    cancelText: '继续编辑',
    success: (res) => {
      if (res.confirm) {
        leaving = true;
        navigateBack();
      }
    },
  });
}

function handleAndroidBack(): boolean {
  const now = Date.now();
  if (now - lastBackHandledAt < 250) return true;
  lastBackHandledAt = now;

  if (closeTransientLayer()) return true;
  if (viewMode.value !== 'main') {
    returnToMain();
    return true;
  }
  if (leaving || !sceneEditProvider.isDirty()) return false;
  handleGuardedBack();
  return true;
}

function closeTransientLayer(): boolean {
  if (activeSheet.value) {
    closeSheet();
    return true;
  }
  if (productPickerVisible.value) {
    productPickerVisible.value = false;
    return true;
  }
  if (devicePickerVisible.value) {
    devicePickerVisible.value = false;
    return true;
  }
  if (schemaPickerVisible.value) {
    schemaPickerVisible.value = false;
    return true;
  }
  return false;
}

function navigateBack() {
  safeNavigateBack({ fallbackUrl: '/pages/scene/index' });
}

function triggerTitle(trigger: SceneTrigger): string {
  if (trigger.type === 'timer') return '定时';
  if (trigger.type === 'weather') return '空间环境变化';
  if (trigger.type === 'device') return trigger.device?.stateKeep?.type === 'duration' ? '持续一段时间后' : '家居设备';
  return '触发条件';
}

function actionTitle(action: SceneAction): string {
  const map: Record<ActionType, string> = { device: '家居设备', delay: '延时', notify: '通知', alarm: '告警', scene: '已创建的自动化' };
  return map[action.type] || '执行动作';
}

function formatTrigger(trigger: SceneTrigger): string {
  if (trigger.type === 'timer' && trigger.timer) {
    if (trigger.timer.execType === 'sunRises') return `日出${offsetText(trigger.timer.execAdd)}，${repeatLabel(trigger.timer.repeatType, trigger.timer.execRepeat)}`;
    if (trigger.timer.execType === 'sunSet') return `日落${offsetText(trigger.timer.execAdd)}，${repeatLabel(trigger.timer.repeatType, trigger.timer.execRepeat)}`;
    return `${secToHm(trigger.timer.execAt)}，${repeatLabel(trigger.timer.repeatType, trigger.timer.execRepeat)}`;
  }
  if (trigger.type === 'weather' && trigger.weather) return `${trigger.weather.type === 'humidity' ? '湿度' : '温度'} ${compareText(trigger.weather.termType)} ${firstValue(trigger.weather.values) || '24'}`;
  if (trigger.type === 'device' && trigger.device) {
    const keep = trigger.device.stateKeep?.type === 'duration' ? `，持续 ${trigger.device.stateKeep.value} 秒` : '';
    return `${trigger.device.deviceAlias || trigger.device.deviceName || trigger.device.productName || '请选择设备'} ${trigger.device.dataName || trigger.device.dataID || ''}${keep}`;
  }
  return '待补全';
}

function formatAction(action: SceneAction): string {
  if (action.type === 'device' && action.device) return `${action.device.deviceAlias || action.device.deviceName || action.device.productName || '请选择设备'} ${action.device.dataName || action.device.dataID || ''}`;
  if (action.type === 'delay') return `延时 ${action.delay || 0} 秒后执行`;
  if (action.type === 'notify') return notifyText(action.notify?.type);
  if (action.type === 'alarm') return action.alarm?.mode === 'relieve' ? '解除告警' : '触发告警';
  if (action.type === 'scene') return action.scene?.sceneName || '选择已有场景';
  return '待补全';
}

function chipClass(active: boolean): string {
  return `chip ${active ? 'chip--active' : ''}`;
}

function firstValue(values?: string[]): string {
  return values && values.length ? values[0] : '';
}

function secToHm(value?: number): string {
  const seconds = Math.max(0, Number(value) || 0);
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function hmToSec(value: string): number {
  const [h, m] = value.split(':').map((item) => Number(item) || 0);
  return h * 3600 + m * 60;
}

function currentHm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function secondsToMinutes(value?: number): number {
  return Math.round((Number(value) || 0) / 60);
}

function weekFlag(raw: string | undefined, index: number): boolean {
  return (raw || '').charAt(index) === '1';
}

function repeatLabel(repeatType?: RepeatType, repeat?: string): string {
  if (repeatType === 'once') return '只执行一次';
  if (repeatType === 'week') {
    const selected = weekLabels.filter((_, index) => weekFlag(repeat, index)).join('、');
    return selected || '自定义';
  }
  return '每天';
}

function compareText(value?: CmpType): string {
  const map: Partial<Record<CmpType, string>> = { eq: '等于', gt: '高于', lt: '低于', gte: '不低于', lte: '不高于', not: '不等于' };
  return value ? map[value] || value : '等于';
}

function offsetText(value?: number): string {
  if (!value) return '';
  return value > 0 ? `后 ${secondsToMinutes(value)} 分钟` : `前 ${Math.abs(secondsToMinutes(value))} 分钟`;
}

function notifyText(value?: NotifyType): string {
  const map: Partial<Record<NotifyType, string>> = { wxMini: '发送小程序通知', message: '发送站内信', sms: '发送短信' };
  return value ? map[value] || '发送通知' : '发送通知';
}
</script>

<style lang="scss" scoped>
.scene-create-shell,
.scene-form-page,
.scene-edit-page {
  min-height: 100vh;
  background: var(--page-bg);
}

.page-back,
.edit-nav__action {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 56rpx;
  line-height: 1;
}

.page-back--hover {
  opacity: 0.55;
}

.scene-form-page {
  box-sizing: border-box;
  padding: 36rpx 24rpx 0;
}

.scene-page-title {
  display: block;
  margin: 0 24rpx 44rpx;
  color: var(--text-primary);
  font-size: 52rpx;
  font-weight: 800;
  line-height: 1.18;
}

.name-card,
.add-card,
.summary-card,
.timer-card,
.timer-repeat-card,
.form-card,
.bottom-link-card {
  border-radius: 20rpx;
  background: var(--card-bg);
}

.name-card {
  height: 138rpx;
  margin-bottom: 76rpx;
  padding: 0 34rpx;
  display: flex;
  align-items: center;
}

.name-card__icon {
  width: 84rpx;
  height: 84rpx;
  border: 8rpx solid var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 42rpx;
  font-weight: 700;
}

.name-card__divider {
  width: 1rpx;
  height: 42rpx;
  margin: 0 32rpx;
  background: var(--border-color);
}

.name-card__input {
  flex: 1;
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 650;
}

.scene-section {
  margin: 0 0 72rpx;
}

.scene-section__title {
  display: block;
  margin: 0 24rpx 20rpx;
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 800;
}

.add-card {
  height: 136rpx;
  padding: 0 44rpx;
  display: flex;
  align-items: center;
}

.add-card--hover,
.summary-card--hover {
  opacity: 0.72;
}

.add-card__icon {
  width: 56rpx;
  height: 56rpx;
  margin-right: 28rpx;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 700;
}

.add-card__text {
  color: var(--color-primary);
  font-size: 30rpx;
  font-weight: 800;
}

.summary-card {
  min-height: 116rpx;
  margin-bottom: 18rpx;
  padding: 26rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.summary-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.summary-card__title {
  color: var(--text-primary);
  font-size: 31rpx;
  font-weight: 800;
}

.summary-card__desc {
  margin-top: 8rpx;
  color: var(--text-secondary);
  font-size: 25rpx;
  line-height: 1.4;
}

.summary-card__delete {
  color: var(--text-secondary);
  font-size: 24rpx;
}

.scene-form-bottom-space {
  height: 190rpx;
}

.fixed-create-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 48rpx calc(24rpx + env(safe-area-inset-bottom));
  background: var(--page-bg);
}

.create-button {
  height: 92rpx;
  border-radius: 22rpx;
  color: var(--color-on-primary);
  background: var(--color-primary);
  font-size: 32rpx;
  font-weight: 800;
  line-height: 92rpx;
}

.create-button--disabled {
  opacity: 0.35;
}

.edit-nav {
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.timer-card {
  margin: 0 24rpx 18rpx;
  padding: 0 36rpx;
}

.timer-card__row,
.timer-repeat-card,
.form-row {
  min-height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timer-card__row--inner {
  border-top: 1rpx solid var(--border-color);
}

.timer-card__title,
.timer-card__label,
.timer-repeat-card__label,
.form-row__label {
  color: var(--text-primary);
  font-size: 29rpx;
  font-weight: 800;
}

.timer-card__title--active {
  color: var(--color-primary);
}

.timer-card__value,
.timer-repeat-card__value,
.form-row__value {
  color: var(--text-secondary);
  font-size: 27rpx;
}

.timer-card__input,
.form-row__input,
.form-row__number {
  width: 180rpx;
  color: var(--text-primary);
  font-size: 28rpx;
  text-align: right;
}

.radio-dot {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: var(--border-color);
}

.radio-dot--active {
  box-sizing: border-box;
  border: 9rpx solid var(--color-primary);
  background: var(--card-bg);
}

.timer-repeat-card {
  margin: 62rpx 24rpx 0;
  padding: 0 36rpx;
}

.timer-repeat-card__value,
.form-row__right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.chevron {
  color: var(--text-placeholder);
  font-size: 42rpx;
}

.toolbar-row {
  margin: 0 48rpx 36rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-row__label {
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 800;
}

.toolbar-row__pill {
  min-width: 122rpx;
  height: 68rpx;
  padding: 0 30rpx;
  border-radius: 34rpx;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 26rpx;
  font-weight: 700;
}

.form-card {
  margin: 0 24rpx;
  padding: 0 30rpx;
}

.form-row {
  border-bottom: 1rpx solid var(--border-color);
}

.form-row:last-child {
  border-bottom: 0;
}

.form-row__unit {
  color: var(--text-secondary);
  font-size: 26rpx;
}

.chip-group {
  display: flex;
  gap: 12rpx;
}

.chip {
  height: 56rpx;
  min-width: 86rpx;
  padding: 0 18rpx;
  border-radius: 28rpx;
  background: var(--page-bg);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.chip--active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.bottom-link-card {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  min-height: 132rpx;
  padding: 30rpx 36rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bottom-link-card__title {
  display: block;
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 800;
}

.bottom-link-card__desc {
  display: block;
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 26rpx;
}

.scene-edit-page--dim {
  background: var(--color-mask);
}

.picker-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 42rpx 48rpx calc(28rpx + env(safe-area-inset-bottom));
  border-radius: 0;
  background: var(--card-bg);
}

.picker-panel__title,
.picker-panel__value {
  display: block;
  text-align: center;
}

.picker-panel__title {
  color: var(--text-primary);
  font-size: 28rpx;
  font-weight: 800;
}

.picker-panel__value {
  margin-top: 24rpx;
  color: var(--text-secondary);
  font-size: 28rpx;
  font-weight: 700;
}

.delay-fields {
  margin: 42rpx 0;
  display: flex;
  justify-content: center;
  gap: 56rpx;
}

.delay-field {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.delay-field__input {
  width: 90rpx;
  height: 72rpx;
  color: var(--text-primary);
  font-size: 42rpx;
  font-weight: 800;
  text-align: center;
}

.delay-field__unit {
  color: var(--color-primary);
  font-size: 24rpx;
}

.overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 90;
  background: var(--color-mask);
}

.mi-bottom-sheet {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 24rpx;
  z-index: 91;
  box-sizing: border-box;
  max-height: 76vh;
  overflow-y: auto;
  padding: 42rpx 24rpx 24rpx;
  border-radius: 28rpx;
  background: var(--page-bg);
  transform: translateY(120%);
  transition: transform 0.24s ease;
}

.mi-bottom-sheet--visible {
  transform: translateY(0);
}

.mi-bottom-sheet__title {
  display: block;
  margin-bottom: 28rpx;
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 900;
  text-align: center;
}

.sheet-group {
  margin-bottom: 22rpx;
  border-radius: 18rpx;
  overflow: hidden;
  background: var(--card-bg);
}

.sheet-option {
  min-height: 132rpx;
  padding: 26rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.sheet-option--disabled {
  opacity: 0.35;
}

.sheet-option__icon {
  width: 76rpx;
  flex: 0 0 76rpx;
  text-align: center;
  font-size: 42rpx;
}

.sheet-option__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sheet-option__title {
  color: var(--text-primary);
  font-size: 32rpx;
  font-weight: 900;
}

.sheet-option__desc {
  margin-top: 8rpx;
  color: var(--text-secondary);
  font-size: 26rpx;
}

.cancel-sheet-button {
  height: 86rpx;
  border-radius: 22rpx;
  color: var(--text-primary);
  background: var(--border-color);
  font-size: 30rpx;
  font-weight: 800;
  line-height: 86rpx;
}

.repeat-option {
  height: 92rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-primary);
  font-size: 28rpx;
  font-weight: 800;
}

.repeat-option--active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.week-picker {
  padding: 8rpx 24rpx 28rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.week-chip {
  height: 58rpx;
  min-width: 80rpx;
  padding: 0 18rpx;
  border-radius: 29rpx;
  background: var(--page-bg);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.week-chip--active {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.sheet-actions {
  display: flex;
  gap: 28rpx;
  margin-top: 24rpx;
}

.sheet-button {
  flex: 1;
  height: 82rpx;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 82rpx;
}

.sheet-button--cancel {
  color: var(--text-primary);
  background: var(--border-color);
}

.sheet-button--primary {
  color: var(--color-on-primary);
  background: var(--color-primary);
}
</style>
