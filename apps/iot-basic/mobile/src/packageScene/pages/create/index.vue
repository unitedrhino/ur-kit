<!-- 移动端页面与控件，使用统一主题、字号和圆角规范。 -->
<template>
  <view class="scene-create-shell">
    <template v-if="viewMode === 'main'">
      <app-navigation-bar custom-back fallback-url="/pages/scene/index" @back="handleGuardedBack" />

      <scroll-view class="scene-form-page" scroll-y type="list" :show-scrollbar="false" enable-flex>
        <text class="scene-page-title">{{pageTitle}}</text>

        <view class="name-card">
          <view class="name-card__icon"><app-icon name="tabler:arrow-down-left" :size="24" /></view>
          <view class="name-card__divider" />
          <input
            class="name-card__input"
            :value="nameInput"
            maxlength="30"
            :placeholder="type === 'auto' ? '请输入自动化名称' : '请输入手动控制名称'"
            @input="handleNameInput"
            @blur="handleNameInputBlur"
          />
        </view>

        <view v-if="type === 'auto'" class="scene-section">
          <text class="scene-section__title">当以下情况发生</text>

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
          <view class="add-card" hover-class="add-card--hover" @tap="openTriggerSheet">
            <view class="add-card__icon"><app-icon name="tabler:plus" :size="24" /></view>
            <text class="add-card__text">添加触发条件</text>
          </view>
        </view>

        <view v-if="type === 'auto'" class="scene-section scene-section--conditions">
          <text class="scene-section__title">生效条件</text>
          <view class="add-card" @tap="openConditions"><view class="add-card__icon"><app-icon name="tabler:clock" :size="24" /></view><text class="add-card__text">{{ conditionSummary }}</text></view>
        </view>

        <view class="scene-section">
          <text class="scene-section__title">执行以下动作</text>

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
            <view v-if="actions.length > 1" class="summary-card__order">
              <view v-if="index > 0" class="summary-card__order-button" @tap.stop="moveAction(index, 'up')"><text>上移</text></view>
              <view v-if="index < actions.length - 1" class="summary-card__order-button" @tap.stop="moveAction(index, 'down')"><text>下移</text></view>
            </view>
            <view class="summary-card__delete" @tap.stop="removeAction(index)"><text>删除</text></view>
          </view>
          <view class="add-card" hover-class="add-card--hover" @tap="openActionSheet">
            <view class="add-card__icon"><app-icon name="tabler:plus" :size="24" /></view>
            <text class="add-card__text">添加执行动作</text>
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

    <template v-else-if="viewMode === 'extraAction' && draftAction">
      <scene-action-editor :model-value="draftAction" :current-scene-id="id" @save="saveExtraAction" @cancel="returnToMain" />
    </template>

    <template v-else-if="viewMode === 'conditions'">
      <scene-conditions-editor :model-value="conditions" :devices="selectableDevices" :devices-loading="selectableDevicesLoading" :devices-error="selectableDevicesError" @reload-devices="loadSceneDevices" @save="saveConditions" @cancel="returnToMain" />
    </template>

    <template v-else-if="viewMode === 'weather'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle"><view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view></view>
        <text class="scene-page-title">天气变化时</text>
        <view class="form-card">
          <view class="form-row"><text class="form-row__label">监测指标</text><view class="chip-group"><view :class="chipClass(draftTrigger?.weather?.type === 'temp')" @tap="patchWeather({ type: 'temp' })"><text>温度</text></view><view :class="chipClass(draftTrigger?.weather?.type === 'humidity')" @tap="patchWeather({ type: 'humidity' })"><text>湿度</text></view></view></view>
          <view class="form-row"><text class="form-row__label">比较</text><view class="chip-group"><view :class="chipClass(draftTrigger?.weather?.termType === 'eq')" @tap="patchWeather({ termType: 'eq' })"><text>等于</text></view><view :class="chipClass(draftTrigger?.weather?.termType === 'gt')" @tap="patchWeather({ termType: 'gt' })"><text>大于</text></view><view :class="chipClass(draftTrigger?.weather?.termType === 'lt')" @tap="patchWeather({ termType: 'lt' })"><text>小于</text></view></view></view>
          <view class="form-row"><text class="form-row__label">数值</text><input class="form-row__input" type="digit" :value="draftTrigger?.weather?.values?.[0] || ''" placeholder="请输入数值" @input="setWeatherValue" /><text class="form-row__unit">{{ draftTrigger?.weather?.type === 'humidity' ? '%' : '℃' }}</text></view>
        </view>
        <view class="scene-confirm-bar"><button class="scene-confirm-button" @tap="commitDraftTrigger">确定</button></view>
      </view>
    </template>

    <template v-else-if="viewMode === 'timer'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:x" :size="22" /></view>
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
          <view v-if="draftTimerExecType === 'sunRises'" class="timer-offset" @tap.stop>
            <text class="timer-card__label">执行时间</text>
            <view class="timer-offset__choices">
              <view v-for="choice in offsetChoices" :key="choice.value" :class="['timer-offset__choice', { 'timer-offset__choice--active': timerOffsetDirection === choice.value }]" @tap.stop="setTimerOffsetDirection(choice.value)"><text>{{ choice.label }}</text></view>
            </view>
            <view v-if="timerOffsetDirection !== 'on'" class="timer-offset__minutes"><input class="timer-card__input" type="number" :value="timerOffsetMagnitude" @blur="handleTimerOffsetMagnitudeBlur" /><text>分钟</text></view>
            <text class="timer-offset__hint">{{ timerOffsetHint }}</text>
          </view>
        </view>

        <view class="timer-card" @tap="selectTimerType('sunSet')">
          <view class="timer-card__row">
            <text :class="`timer-card__title ${draftTimerExecType === 'sunSet' ? 'timer-card__title--active' : ''}`">日落</text>
            <view :class="`radio-dot ${draftTimerExecType === 'sunSet' ? 'radio-dot--active' : ''}`" />
          </view>
          <view v-if="draftTimerExecType === 'sunSet'" class="timer-offset" @tap.stop>
            <text class="timer-card__label">执行时间</text>
            <view class="timer-offset__choices">
              <view v-for="choice in offsetChoices" :key="choice.value" :class="['timer-offset__choice', { 'timer-offset__choice--active': timerOffsetDirection === choice.value }]" @tap.stop="setTimerOffsetDirection(choice.value)"><text>{{ choice.label }}</text></view>
            </view>
            <view v-if="timerOffsetDirection !== 'on'" class="timer-offset__minutes"><input class="timer-card__input" type="number" :value="timerOffsetMagnitude" @blur="handleTimerOffsetMagnitudeBlur" /><text>分钟</text></view>
            <text class="timer-offset__hint">{{ timerOffsetHint }}</text>
          </view>
        </view>

        <view class="timer-repeat-card" @tap="openRepeatSheet">
          <text class="timer-repeat-card__label">重复</text>
          <view class="timer-repeat-card__value">
            <text>{{repeatText}}</text>
            <app-icon class="chevron" name="tabler:chevron-right" :size="18" />
          </view>
        </view>
        <view class="scene-confirm-bar"><button class="scene-confirm-button" @tap="commitDraftTrigger">确定</button></view>
      </view>
    </template>

    <template v-else-if="viewMode === 'deviceTrigger'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
        </view>
        <text class="scene-page-title">设备发生变化时</text>
        <view class="toolbar-row">
          <text class="toolbar-row__label">选择设备</text>
        </view>
        <view class="form-card">
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
              <view v-if="!isDiscreteProperty" :class="chipClass(draftTrigger?.device?.termType === 'gt')" @tap="patchDraftTriggerDevice({ termType: 'gt' })"><text>大于</text></view>
              <view v-if="!isDiscreteProperty" :class="chipClass(draftTrigger?.device?.termType === 'lt')" @tap="patchDraftTriggerDevice({ termType: 'lt' })"><text>小于</text></view>
            </view>
          </view>
          <view class="form-row">
            <text class="form-row__label">值</text>
            <view v-if="isDiscreteProperty" class="value-options">
              <view v-for="option in propertyOptions" :key="option.value" :class="chipClass(String(draftTriggerValue) === option.value)" @tap="selectTriggerOption(option.value)"><text>{{ option.label }}</text></view>
              <text v-if="!propertyOptions.length" class="value-options__empty">物模型未配置可选值</text>
            </view>
            <input v-else class="form-row__input" :value="draftTriggerValue" placeholder="请输入值" @input="handleDraftTriggerValueInput" @blur="handleDraftTriggerValueBlur" />
          </view>
        </view>
        <view class="scene-confirm-bar"><button class="scene-confirm-button" @tap="commitDraftTrigger">确定</button></view>
      </view>
    </template>

    <template v-else-if="viewMode === 'duration'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
        </view>
        <text class="scene-page-title">持续一段时间后</text>
        <view class="form-card">
          <view class="form-row" @tap="openDevicePicker('trigger')">
            <text class="form-row__label">设备</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.deviceAlias || draftTrigger?.device?.deviceName || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row" @tap="openSchemaPicker('trigger')">
            <text class="form-row__label">状态</text>
            <view class="form-row__value"><text>{{draftTrigger?.device?.dataName || draftTrigger?.device?.dataID || '请选择'}}</text><app-icon class="chevron" name="tabler:chevron-right" :size="18" /></view>
          </view>
          <view class="form-row">
            <text class="form-row__label">比较</text>
            <view class="chip-group">
              <view :class="chipClass(draftTrigger?.device?.termType === 'eq')" @tap="patchDraftTriggerDevice({ termType: 'eq' })"><text>等于</text></view>
              <view v-if="!isDiscreteProperty" :class="chipClass(draftTrigger?.device?.termType === 'gt')" @tap="patchDraftTriggerDevice({ termType: 'gt' })"><text>大于</text></view>
              <view v-if="!isDiscreteProperty" :class="chipClass(draftTrigger?.device?.termType === 'lt')" @tap="patchDraftTriggerDevice({ termType: 'lt' })"><text>小于</text></view>
            </view>
          </view>
          <view class="form-row">
            <text class="form-row__label">值</text>
            <view v-if="isDiscreteProperty" class="value-options">
              <view v-for="option in propertyOptions" :key="option.value" :class="chipClass(String(draftTriggerValue) === option.value)" @tap="selectTriggerOption(option.value)"><text>{{ option.label }}</text></view>
              <text v-if="!propertyOptions.length" class="value-options__empty">物模型未配置可选值</text>
            </view>
            <input v-else class="form-row__input" :value="draftTriggerValue" placeholder="请输入值" @input="handleDraftTriggerValueInput" @blur="handleDraftTriggerValueBlur" />
          </view>
          <view class="form-row">
            <text class="form-row__label">持续</text>
            <view class="form-row__right">
              <input class="form-row__number" type="number" :value="draftDurationValue" @blur="handleDraftDurationValueBlur" />
              <text class="form-row__unit">秒</text>
            </view>
          </view>
        </view>
        <view class="scene-confirm-bar"><button class="scene-confirm-button" @tap="commitDraftTrigger">确定</button></view>
      </view>
    </template>

    <template v-else-if="viewMode === 'deviceAction'">
      <view class="scene-edit-page">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
        </view>
        <text class="scene-page-title">选择要控制的设备</text>
        <view class="toolbar-row">
          <text class="toolbar-row__label">选择设备</text>
        </view>
        <view class="form-card">
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
            <view v-if="isDiscreteProperty" class="value-options">
              <view v-for="option in propertyOptions" :key="option.value" :class="chipClass(String(draftActionValue) === option.value)" @tap="selectActionOption(option.value)"><text>{{ option.label }}</text></view>
              <text v-if="!propertyOptions.length" class="value-options__empty">物模型未配置可选值</text>
            </view>
            <input v-else class="form-row__input" :value="draftActionValue" placeholder="请输入值" @input="handleDraftActionValueInput" @blur="handleDraftActionValueBlur" />
          </view>
        </view>
        <view class="bottom-link-card" @tap="fillBatchSwitchAction">
          <view>
            <text class="bottom-link-card__title">打开/关闭设备</text>
            <text class="bottom-link-card__desc">如：打开客厅灯</text>
          </view>
          <app-icon class="chevron" name="tabler:chevron-right" :size="18" />
        </view>
        <view class="scene-confirm-bar"><button class="scene-confirm-button" @tap="commitDraftAction">确定</button></view>
      </view>
    </template>

    <template v-else-if="viewMode === 'delay'">
      <view class="scene-edit-page scene-edit-page--dim">
        <view class="edit-nav" :style="editNavStyle">
          <view class="edit-nav__action" @tap="returnToMain"><app-icon name="tabler:chevron-left" :size="22" /></view>
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
  <device-picker :visible="devicePickerVisible" :product-id="pickerProductID" :selected-name="pickerDeviceName" :devices="selectableDevices" :loading="selectableDevicesLoading" :error="selectableDevicesError" @retry="loadSceneDevices" @select="handleDeviceSelected" @close="devicePickerVisible = false" />
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
import SceneConditionsEditor from '../../components/scene-conditions-editor/scene-conditions-editor.vue';
import SceneActionEditor from '../../components/scene-action-editor/scene-action-editor.vue';
import { safeNavigateBack } from '../../../utils/navigation';
import { ensurePageReady } from '../../../utils/page-guard';
import { deviceService } from '../../../services/device.service';
import { deviceControlService } from '../../../services/device-control.service';
import type { ThingModelDefine } from '../../../domain/models/device-control.model';
import { areaService } from '../../../services/area.service';
import { authProvider } from '../../../providers/auth.provider';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import { getSystemInfo } from '../../../utils/platform';

type ViewMode = 'main' | 'conditions' | 'extraAction' | 'weather' | 'timer' | 'deviceTrigger' | 'duration' | 'deviceAction' | 'delay';
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
 * （微信小程序 iOS + 第三方输入法下，聚焦时回写会导致粘贴内容不显示）。名称同时保留输入草稿，
 * 保存入口主动同步，不假定 H5 的 blur 与 tap 顺序；computed setter 负责写回业务模型。
 */
/** pendingName 保存正在输入的名称，提交时主动同步，避免 H5 按钮先于 blur 触发。 */
let pendingName: string | undefined;
/** handleNameInput 不回写聚焦中的原生输入控件，兼容微信输入法。 */
function handleNameInput(e: unknown): void {
  const value = (e as { detail?: { value?: string } }).detail?.value;
  if (typeof value === 'string') pendingName = value;
}
/** flushPendingName 在表单切换和保存前同步名称，避免子页面重新挂载时丢失。 */
function flushPendingName(): void {
  if (pendingName !== undefined) nameInput.value = pendingName;
  pendingName = undefined;
}
/** handleNameInputBlur 在失焦时提交名称草稿。 */
function handleNameInputBlur(e: unknown): void {
  handleNameInput(e);
  if (pendingName !== undefined) nameInput.value = pendingName;
  pendingName = undefined;
}
let pendingTriggerValue: string | undefined;
let pendingActionValue: string | undefined;
/** 输入只暂存草稿，确认时同步，兼容原生输入法和 H5 自动失焦。 */
function handleDraftTriggerValueInput(e: any) { pendingTriggerValue = String(e.detail.value ?? ''); }
function handleDraftActionValueInput(e: any) { pendingActionValue = String(e.detail.value ?? ''); }
function handleDraftTriggerValueBlur(e: any) { pendingTriggerValue = undefined; draftTriggerValue.value = e.detail.value }
function handleDraftDurationValueBlur(e: any) { draftDurationValue.value = e.detail.value }
function handleDraftActionValueBlur(e: any) { pendingActionValue = undefined; draftActionValue.value = e.detail.value }
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
/** 当前设备属性定义：进入编辑页或切换设备、属性时重新读取。 */
const selectedPropertyDefine = ref<ThingModelDefine | null>(null);
const propertyDefineLoading = ref(false);
const propertyDefineError = ref('');
let propertyDefineRevision = 0;
const currentPropertyIdentity = computed(() => {
  const device = viewMode.value === 'deviceAction' ? draftAction.value?.device :
    (viewMode.value === 'deviceTrigger' || viewMode.value === 'duration') ? draftTrigger.value?.device : null;
  return { productID: device?.productID || '', dataID: device?.dataID || '' };
});
watch(() => [currentPropertyIdentity.value.productID, currentPropertyIdentity.value.dataID, viewMode.value], async () => {
  const revision = ++propertyDefineRevision;
  const { productID, dataID } = currentPropertyIdentity.value;
  selectedPropertyDefine.value = null;
  propertyDefineError.value = '';
  propertyDefineLoading.value = !!(productID && dataID);
  if (!productID || !dataID) return;
  try {
    const schema = await deviceControlService.getThingModel(productID);
    if (revision !== propertyDefineRevision) return;
    const property = schema.properties.find(item => item.identifier === dataID);
    if (!property) throw new Error('设备属性不存在，请重新选择');
    selectedPropertyDefine.value = property.define;
  } catch (error) {
    if (revision === propertyDefineRevision) propertyDefineError.value = (error as Error).message || '物模型加载失败';
  } finally { if (revision === propertyDefineRevision) propertyDefineLoading.value = false; }
}, { immediate: true });
const isDiscreteProperty = computed(() => ['bool', 'enum'].includes(selectedPropertyDefine.value?.type || ''));
/** 属性 mapping 的键是实际写入值，文本仅用于展示。 */
const propertyOptions = computed(() => {
  const define = selectedPropertyDefine.value;
  if (!define || !isDiscreteProperty.value) return [];
  const mapping = define.type === 'bool' && !Object.keys(define.mapping || {}).length ? { '0': '关', '1': '开' } : (define.mapping || {});
  return Object.entries(mapping).map(([value, label]) => ({ value, label: String(label) }));
});
/** 选择离散值时保留物模型原始键，并使用等于比较。 */
function selectTriggerOption(value: string): void { pendingTriggerValue = undefined; draftTriggerValue.value = value; patchDraftTriggerDevice({ termType: 'eq' }); }
function selectActionOption(value: string): void { pendingActionValue = undefined; draftActionValue.value = value; }
/** preventInvalidProperty 阻止模型未加载或所选离散值失效时提交。 */
function preventInvalidProperty(value: string): boolean {
  if (!currentPropertyIdentity.value.dataID) return false;
  if (propertyDefineLoading.value || propertyDefineError.value || !selectedPropertyDefine.value) {
    uni.showToast({ title: propertyDefineError.value || '物模型加载中，请稍后重试', icon: 'none' }); return true;
  }
  if (isDiscreteProperty.value && !propertyOptions.value.some(option => option.value === value)) {
    uni.showToast({ title: '请选择有效的属性值', icon: 'none' }); return true;
  }
  if (isDiscreteProperty.value && viewMode.value !== 'deviceAction' && draftTrigger.value?.device?.termType && draftTrigger.value.device.termType !== 'eq') {
    uni.showToast({ title: '请重新选择属性值', icon: 'none' }); return true;
  }
  return false;
}

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
    if (query?.source === 'deviceSelection' && createType === 'auto' && typeof query.productID === 'string' && typeof query.deviceName === 'string') {
      await prepareSelectedDeviceTrigger(query.productID, query.deviceName);
    }
  }
});

onBackPress(() => handleAndroidBack());
onUnload(() => cleanup());

const pageTitle = computed(() => {
  if (mode.value === 'edit') return type.value === 'auto' ? '编辑自动化' : '编辑手动控制';
  return type.value === 'auto' ? '创建自动化' : '创建手动控制';
});
const buttonText = computed(() => (mode.value === 'edit' ? '保存' : '创建'));
/** conditionSummary 让用户看到当前已设置的时间范围和附加条件数量。 */
const conditionSummary = computed(() => {
  const total = conditions.value.validRanges.length + conditions.value.invalidRanges.length + conditions.value.conditions.terms.length;
  return total ? `已设置 ${total} 项生效条件` : '设置生效时段与附加条件';
});
/** openConditions 编辑草稿，取消不改变原场景。 */
function openConditions(): void { flushPendingName(); viewMode.value = 'conditions'; }
/** saveConditions 只在确认后更新场景条件。 */
function saveConditions(value: SceneCondition): void { sceneEditProvider.updateConditions(value); returnToMain(); }

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
  flushPendingName();
  activeSheet.value = 'trigger';
}

function openActionSheet() {
  flushPendingName();
  activeSheet.value = 'action';
}

function closeSheet() {
  activeSheet.value = '';
}

function returnToMain() {
  pendingTriggerValue = undefined; pendingActionValue = undefined;
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

/** prepareSelectedDeviceTrigger 重新核对设备与管理资格后预填触发设备，条件仍由用户选择。 */
async function prepareSelectedDeviceTrigger(productID: string, deviceName: string): Promise<void> {
  const projectID = currentFamilyProvider.getState().projectID;
  const userID = authProvider.getState().user?.userID || '';
  try {
    const [device, allowed] = await Promise.all([deviceService.getDetail(productID, deviceName), areaService.canManage(projectID, userID)]);
    if (cleaned || projectID !== currentFamilyProvider.getState().projectID) return;
    if (!allowed || device.projectID !== projectID || device.isShared !== false) throw new Error('当前设备没有项目管理权限');
    startDeviceTrigger();
    patchDraftTriggerDevice({ productID: device.productID, productName: device.productName, deviceName: device.deviceName, deviceAlias: device.deviceAlias });
  } catch (error) { if (!cleaned) uni.showToast({ title: (error as Error).message || '设备加载失败', icon: 'none' }); }
}

function startDurationTrigger() {
  closeSheet();
  editingTriggerIndex.value = -1;
  draftTrigger.value = createDeviceTrigger(true);
  viewMode.value = 'duration';
}

/** addWeatherTrigger 编辑天气触发草稿，只有确认后才加入列表。 */
function addWeatherTrigger() {
  closeSheet(); editingTriggerIndex.value = -1;
  draftTrigger.value = { type: 'weather', order: triggers.value.length, weather: { type: 'temp', termType: 'gt', values: ['24'] } };
  viewMode.value = 'weather';
}
/** patchWeather 更新天气指标或比较方式。 */
function patchWeather(patch: Partial<NonNullable<SceneTrigger['weather']>>): void {
  if (!draftTrigger.value?.weather) return;
  draftTrigger.value = { ...draftTrigger.value, weather: { ...draftTrigger.value.weather, ...patch } };
}
/** setWeatherValue 保留当前输入，供确认时进行范围校验。 */
function setWeatherValue(event: any): void { patchWeather({ values: [String(event.detail?.value ?? '')] }); }

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

/** 新建通知和场景动作均先配置，取消不写入场景。 */
function addNotifyAction() {
  closeSheet(); editingActionIndex.value = -1;
  draftAction.value = { type: 'notify', order: actions.value.length, notify: { type: 'message', notifyCode: 'ruleScene', userType: 'account', accounts: [], params: {} } };
  viewMode.value = 'extraAction';
}
function addSceneAction() {
  closeSheet(); editingActionIndex.value = -1;
  draftAction.value = { type: 'scene', order: actions.value.length, scene: { sceneID: '', status: 0 } };
  viewMode.value = 'extraAction';
}
/** saveExtraAction 将完整的动作草稿追加或替换原动作。 */
function saveExtraAction(action: SceneAction): void {
  if (editingActionIndex.value >= 0) sceneEditProvider.updateAction(editingActionIndex.value, action);
  else sceneEditProvider.addAction(action);
  returnToMain();
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
  else if (trigger.type === 'weather') viewMode.value = 'weather';
  else if (trigger.type === 'device' && trigger.device?.stateKeep?.type === 'duration') viewMode.value = 'duration';
  else if (trigger.type === 'device') viewMode.value = 'deviceTrigger';
}

function editAction(index: number) {
  const action = actions.value[index];
  if (action.type === 'alarm') { uni.showToast({ title: '告警动作已停用，请删除该动作', icon: 'none' }); return; }
  editingActionIndex.value = index;
  draftAction.value = clone(action);
  if (action.type === 'device') viewMode.value = 'deviceAction';
  else if (action.type === 'scene' || action.type === 'notify') viewMode.value = 'extraAction';
  else if (action.type === 'delay') {
    const delay = action.delay || 0;
    delayMinutes.value = String(Math.floor(delay / 60));
    delaySeconds.value = String(delay % 60);
    viewMode.value = 'delay';
  }
}

function commitDraftTrigger() {
  if (pendingTriggerValue !== undefined) { draftTriggerValue.value = pendingTriggerValue; pendingTriggerValue = undefined; }
  if (!draftTrigger.value) {
    returnToMain();
    return;
  }
  if (viewMode.value === 'deviceTrigger' || viewMode.value === 'duration') {
    const device = draftTrigger.value.device;
    if (!device?.productID || !device.deviceName || !device.dataID) { uni.showToast({ title: '请选择设备和属性', icon: 'none' }); return; }
    if (!String(draftTriggerValue.value).trim()) { uni.showToast({ title: viewMode.value === 'duration' ? '请输入持续状态的比较值' : '请选择或输入属性值', icon: 'none' }); return; }
    if (preventInvalidProperty(draftTriggerValue.value)) return;
  }
  if (viewMode.value === 'weather') {
    const weather = draftTrigger.value.weather;
    const text = weather?.values?.[0] ?? '';
    const number = Number(text);
    if (!text.trim() || !Number.isFinite(number) || (weather?.type === 'humidity' && (number < 0 || number > 100))) { uni.showToast({ title: '请输入有效天气数值', icon: 'none' }); return; }
  }
  // 持续条件必须有比较值，空值会被后端拒绝且无法判断保持的状态。
  if (viewMode.value === 'duration' && !firstValue(draftTrigger.value?.device?.values).trim()) {
    uni.showToast({ title: '请输入持续状态的比较值', icon: 'none' });
    return;
  }
  const next = clone(draftTrigger.value!);
  if (editingTriggerIndex.value >= 0) sceneEditProvider.updateTrigger(editingTriggerIndex.value, next);
  else sceneEditProvider.addTrigger(next);
  returnToMain();
}

function commitDraftAction() {
  if (pendingActionValue !== undefined) { draftActionValue.value = pendingActionValue; pendingActionValue = undefined; }
  if (!draftAction.value) {
    returnToMain();
    return;
  }
  if (viewMode.value === 'deviceAction') {
    const device = draftAction.value.device;
    if (!device?.productID || !device.deviceName || !device.dataID) { uni.showToast({ title: '请选择设备和属性', icon: 'none' }); return; }
    if (!String(draftActionValue.value).trim()) { uni.showToast({ title: '请选择或输入属性值', icon: 'none' }); return; }
    if (preventInvalidProperty(draftActionValue.value)) return;
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

/** moveAction 按显示顺序调整动作，延时等动作按该顺序保存。 */
function moveAction(index: number, direction: 'up' | 'down'): void { sceneEditProvider.reorderAction(index, direction); }

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

/** 场景设备列表独立分页读取，避免首页筛选或分页遗漏设备。 */
const selectableDevices = ref<DeviceEntity[]>([]);
const selectableDevicesLoading = ref(false);
const selectableDevicesError = ref('');
let selectableRequest = 0;
async function loadSceneDevices(): Promise<void> {
  const revision = ++selectableRequest;
  const projectID = currentFamilyProvider.getState().projectID;
  const tenantCode = currentFamilyProvider.getState().currentTenantCode;
  selectableDevices.value = [];
  selectableDevicesError.value = '';
  selectableDevicesLoading.value = true;
  try {
    const list: DeviceEntity[] = [];
    for (let page = 1; ; page++) {
      if (page > 200) throw new Error('设备数量过多，请稍后重试');
      const result = await deviceService.getList({ page, size: 100, projectID: projectID || undefined, sharedOnly: !projectID });
      if (revision !== selectableRequest || currentFamilyProvider.getState().projectID !== projectID || currentFamilyProvider.getState().currentTenantCode !== tenantCode) return;
      list.push(...result.list);
      if (list.length >= result.total) break;
      if (!result.list.length) throw new Error('设备列表未完整加载');
    }
    selectableDevices.value = list;
  } catch (error) {
    if (revision === selectableRequest) selectableDevicesError.value = (error as Error).message || '设备加载失败';
  } finally { if (revision === selectableRequest) selectableDevicesLoading.value = false; }
}

function openDevicePicker(target: PickerTarget) {
  pickerTarget.value = target;
  devicePickerVisible.value = true;
  void loadSceneDevices();
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
  pendingTriggerValue = undefined; pendingActionValue = undefined;
  if (pickerTarget.value === 'trigger') {
    const changed = draftTrigger.value?.device?.productID !== payload.productID;
    patchDraftTriggerDevice({ productID: payload.productID, productName: payload.productName, deviceName: payload.deviceName, deviceAlias: payload.deviceAlias, ...(changed ? { dataID: '', dataName: '', values: [] } : {}) });
  } else if (draftAction.value?.device) {
    const changed = draftAction.value.device.productID !== payload.productID;
    draftAction.value = { ...draftAction.value, device: { ...draftAction.value.device, productID: payload.productID, productName: payload.productName, deviceName: payload.deviceName, deviceAlias: payload.deviceAlias, ...(changed ? { dataID: '', dataName: '', value: '', values: [] } : {}) } };
  }
  devicePickerVisible.value = false;
}

function handleSchemaSelected(payload: { dataID: string; dataName: string; kind: string }) {
  pendingTriggerValue = undefined; pendingActionValue = undefined;
  if (pickerTarget.value === 'trigger') {
    patchDraftTriggerDevice({ dataID: payload.dataID, dataName: payload.dataName, values: draftTrigger.value?.device?.dataID === payload.dataID ? draftTrigger.value?.device?.values : [], termType: 'eq' });
  } else if (draftAction.value?.device) {
    const value = draftAction.value.device.dataID === payload.dataID ? (draftAction.value.device.value || '') : '';
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
  flushPendingName();
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
  if (action.type === 'alarm') return '此动作已停用，请删除';
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

/** 日出日落偏移以秒存储；正数为延后，负数为提前。 */
const offsetChoices = [{ value: 'before', label: '提前' }, { value: 'on', label: '准时' }, { value: 'after', label: '延后' }] as const;
const timerOffsetDirection = computed(() => {
  const seconds = Number(draftTrigger.value?.timer?.execAdd || 0);
  return seconds < 0 ? 'before' : seconds > 0 ? 'after' : 'on';
});
const timerOffsetMagnitude = computed(() => Math.abs(secondsToMinutes(draftTrigger.value?.timer?.execAdd)));
const timerOffsetHint = computed(() => {
  const event = draftTimerExecType.value === 'sunRises' ? '日出' : '日落';
  if (timerOffsetDirection.value === 'on') return `${event}时执行`;
  return `${event}${timerOffsetDirection.value === 'before' ? '前' : '后'} ${timerOffsetMagnitude.value} 分钟执行`;
});
/** setTimerOffsetDirection 设置提前、准时或延后，默认偏移 5 分钟。 */
function setTimerOffsetDirection(direction: 'before' | 'on' | 'after'): void {
  const magnitude = timerOffsetMagnitude.value || 5;
  patchDraftTimer({ execAdd: direction === 'on' ? 0 : magnitude * 60 * (direction === 'before' ? -1 : 1) });
}
/** handleTimerOffsetMagnitudeBlur 将输入分钟转换为带方向的秒数。 */
function handleTimerOffsetMagnitudeBlur(e: any): void {
  const minutes = Math.abs(Number(e.detail?.value));
  if (!Number.isFinite(minutes)) return;
  patchDraftTimer({ execAdd: Math.round(minutes) * 60 * (timerOffsetDirection.value === 'before' ? -1 : 1) });
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
.value-options { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; max-width: 75%; }
.value-options__empty { color: var(--text-secondary); font-size: var(--font-caption); }
.scene-confirm-bar { padding: 20px 24px calc(20px + env(safe-area-inset-bottom)); }
.scene-confirm-button { min-height: 48px; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-on-primary); font-size: var(--font-body); }

/* 日出日落的时间偏移以方向和分钟呈现。 */
.timer-offset { padding: 12px 16px 16px; border-top: 1px solid var(--border-color); }
.timer-offset__choices { display: flex; gap: 8px; margin-top: 12px; }
.timer-offset__choice { flex: 1; padding: 9px 4px; text-align: center; border-radius: var(--radius-full); background: var(--color-bg-secondary); color: var(--text-secondary); font-size: var(--font-body); }
.timer-offset__choice--active { background: var(--color-primary-light); color: var(--color-primary); }
.timer-offset__minutes { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 12px; color: var(--text-primary); font-size: var(--font-body); }
.timer-offset__hint { display: block; margin-top: 10px; font-size: var(--font-caption); color: var(--text-secondary); }

.scene-create-shell,
.scene-form-page,
.scene-edit-page {
  min-height: 100vh;
  background: transparent;
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
  border-radius: var(--radius-lg);
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
  font-size: var(--font-section);
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
  font-size: var(--font-label);
  font-weight: 650;
}

.scene-section {
  margin: 0 0 72rpx;
}

.scene-section__title {
  display: block;
  margin: 0 24rpx 20rpx;
  color: var(--text-primary);
  font-size: var(--font-label);
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
  font-size: var(--font-label);
  font-weight: 700;
}

.add-card__text {
  color: var(--color-primary);
  font-size: var(--font-body);
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
  font-size: var(--font-body);
  font-weight: 800;
}

.summary-card__desc {
  margin-top: 8rpx;
  color: var(--text-secondary);
  font-size: var(--font-caption);
  line-height: 1.4;
}

.summary-card__order { display: flex; flex-wrap: wrap; color: var(--color-primary); font-size: var(--font-caption); }
.summary-card__order-button { min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; }

.summary-card__delete {
  color: var(--text-secondary);
  font-size: var(--font-caption);
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
  font-size: var(--font-body);
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
  font-size: var(--font-body);
  font-weight: 800;
}

.timer-card__title--active {
  color: var(--color-primary);
}

.timer-card__value,
.timer-repeat-card__value,
.form-row__value {
  color: var(--text-secondary);
  font-size: var(--font-body);
}

.timer-card__input,
.form-row__input,
.form-row__number {
  width: 180rpx;
  color: var(--text-primary);
  font-size: var(--font-body);
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
  font-size: var(--font-section);
}

.toolbar-row {
  margin: 0 48rpx 36rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-row__label {
  color: var(--text-primary);
  font-size: var(--font-label);
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
  font-size: var(--font-caption);
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
  font-size: var(--font-caption);
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
  font-size: var(--font-caption);
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
  font-size: var(--font-label);
  font-weight: 800;
}

.bottom-link-card__desc {
  display: block;
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: var(--font-caption);
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
  font-size: var(--font-body);
  font-weight: 800;
}

.picker-panel__value {
  margin-top: 24rpx;
  color: var(--text-secondary);
  font-size: var(--font-body);
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
  font-size: var(--font-section);
  font-weight: 800;
  text-align: center;
}

.delay-field__unit {
  color: var(--color-primary);
  font-size: var(--font-caption);
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
  border-radius: var(--radius-lg);
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
  font-size: var(--font-label);
  font-weight: 900;
  text-align: center;
}

.sheet-group {
  margin-bottom: 22rpx;
  border-radius: var(--radius-lg);
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
  font-size: var(--font-section);
}

.sheet-option__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sheet-option__title {
  color: var(--text-primary);
  font-size: var(--font-body);
  font-weight: 900;
}

.sheet-option__desc {
  margin-top: 8rpx;
  color: var(--text-secondary);
  font-size: var(--font-caption);
}

.cancel-sheet-button {
  height: 86rpx;
  border-radius: 22rpx;
  color: var(--text-primary);
  background: var(--border-color);
  font-size: var(--font-body);
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
  font-size: var(--font-body);
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
  font-size: var(--font-caption);
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
  font-size: var(--font-body);
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

.scene-create-shell { background: var(--page-gradient); height: 100vh; display: flex; flex-direction: column; }
.scene-form-page { flex: 1; min-height: 0; height: 0; }
.scene-page-title { font-size: var(--font-title); line-height: 1.3; margin: 16px 20px 24px; }
.scene-section { margin-left: 16px; margin-right: 16px; }
.scene-section__title { font-size: var(--font-section); }
.summary-card, .name-card, .add-card, .timer-card, .timer-repeat-card, .form-card { border-radius: var(--radius-lg); }
.fixed-create-bar { background: var(--card-bg); border-radius: var(--radius-lg) var(--radius-lg) 0 0; padding: 16px 20px calc(16px + env(safe-area-inset-bottom)); box-shadow: 0 -4px 20px var(--color-shadow); }
.create-button { border-radius: var(--radius-full); font-size: var(--font-label); }
.summary-card__delete, .edit-nav__action { min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; }
</style>
