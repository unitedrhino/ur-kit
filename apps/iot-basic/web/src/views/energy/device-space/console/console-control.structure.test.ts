import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd(), '../..');

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('org-iot-client console control surface', () => {
  it('replaces the permanent side control panel with a centered control dialog', () => {
    const consoleFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/index.vue');

    expect(consoleFile).toContain('DeviceControlDialog');
    expect(consoleFile).toContain('controlRows');
    expect(consoleFile).toContain('openControlForRows');
    expect(consoleFile).not.toContain('ControlPanel');
    expect(consoleFile).not.toContain('panelCollapsed');
    expect(consoleFile).not.toContain('NDataTable');
    expect(consoleFile).not.toContain('收起面板');
  });

  it('keeps table control entries for single-device and selected-device control', () => {
    const consoleFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/index.vue');

    expect(consoleFile).toContain('@vben/saas');
    expect(consoleFile).toContain('useVueTable');
    expect(consoleFile).toContain('@unitedrhino/saas-ui');
    expect(consoleFile).not.toContain('@vben-core/shadcn-ui');
    expect(consoleFile).not.toContain('VbenIcon');
    expect(consoleFile).toContain('openControlForRows([row.original])');
    expect(consoleFile).toContain("$t('orgIotClient.console.selectedCount'");
    expect(consoleFile).toContain('openControlForRows(chooseRows)');
    expect(consoleFile).toContain('rows.length > 1 ? [...deviceList.value] : [...rows]');
    expect(consoleFile).toContain(':selected-keys="checkedRowKeys"');
    expect(consoleFile).toContain('@update:selected-keys="syncControlSelectedKeys"');
    expect(consoleFile).toContain('checkedRowKeys.value = [...keys]');
    expect(consoleFile).toContain("'onUpdate:modelValue': (checked: CheckedState) => toggleCurrentPageSelection(checked === true)");
    expect(consoleFile).toContain("'onUpdate:modelValue': (checked: CheckedState) => toggleRowSelection(row.original, checked === true)");
    expect(consoleFile).not.toContain("'onUpdate:checked': (checked: CheckedState) => toggleCurrentPageSelection");
    expect(consoleFile).toContain("$t('orgIotClient.console.transferArea')");
  });

  it('adds mobile-first console controls without duplicating business state', () => {
    const consoleFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/index.vue');

    expect(consoleFile).toContain('mobileAreaDialogOpen');
    expect(consoleFile).toContain('data-testid="device-console-mobile-area-trigger"');
    expect(consoleFile).toContain('data-testid="device-console-mobile-card-list"');
    expect(consoleFile).toContain('data-testid="device-console-desktop-table"');
    expect(consoleFile).toContain('lg:hidden');
    expect(consoleFile).toContain('hidden lg:block');
    expect(consoleFile).toContain('chooseRows');
    expect(consoleFile).toContain('toggleRowSelection(row, !checkedRowKeys.includes(getDeviceRowKey(row)))');
  });

  it('builds custom visible columns from device properties', () => {
    const consoleFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/index.vue');

    expect(consoleFile).toContain('DropdownMenuCheckboxItem');
    expect(consoleFile).toContain("$t('orgIotClient.console.columnDisplay')");
    expect(consoleFile).toContain('BASE_DISPLAY_COLUMNS');
    expect(consoleFile).toContain('DISPLAY_COLUMN_STORAGE_KEY');
    expect(consoleFile).toContain('DEFAULT_DISPLAY_COLUMN_KEYS');
    expect(consoleFile).toContain('readStoredDisplayColumnPreference');
    expect(consoleFile).toContain('saveDisplayColumnPreference');
    expect(consoleFile).toContain('DisplayColumnPreference');
    expect(consoleFile).toContain('propertyDisplayColumns');
    expect(consoleFile).toContain('visibleDisplayColumnKeys');
    expect(consoleFile).toContain('displayColumnOrderKeys');
    expect(consoleFile).toContain('orderedDisplayColumnOptions');
    expect(consoleFile).toContain('discoveredPropertyColumnKeys');
    expect(consoleFile).toContain('row.withProperties || {}');
    expect(consoleFile).toContain('getPropertyDisplayValue');
    expect(consoleFile).toContain('新出现的属性列默认隐藏');
    expect(consoleFile).toContain('moveDisplayColumn');
    expect(consoleFile).toContain('onDisplayColumnDragStart');
    expect(consoleFile).toContain('onDisplayColumnDrop');
    expect(consoleFile).toContain(':data-testid="`device-console-column-option-${column.key}`"');
    expect(consoleFile).toContain('draggable="true"');
    expect(consoleFile).toContain(':model-value="isDisplayColumnVisible(column.key)"');
    expect(consoleFile).toContain('@update:model-value="(checked: CheckedState) => toggleDisplayColumn(column.key, checked)"');
    expect(consoleFile).toContain("message.warning($t('orgIotClient.console.keepOneColumn'))");
  });

  it('keeps the new dialog shadcn-first without direct naive imports', () => {
    const dialogFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/modules/DeviceControlDialog.vue');

    expect(dialogFile).toContain('@unitedrhino/saas-ui');
    expect(dialogFile).not.toContain('@vben-core/shadcn-ui');
    expect(dialogFile).toContain('DialogContent');
    // 内容区滚动已改为原生 overflow-y-auto（弹窗固定高 + 内部滚动），不再用 ScrollArea 组件
    expect(dialogFile).toContain('overflow-y-auto');
    expect(dialogFile).toContain('Switch');
    expect(dialogFile).toContain('Slider');
    expect(dialogFile).toContain('ToggleGroup');
    expect(dialogFile).not.toContain('overlay-blur');
    expect(dialogFile).toContain('targetRows');
    expect(dialogFile).toContain('onTargetDeviceCheckedChange');
    expect(dialogFile).toContain('selectedKeys?: string[]');
    expect(dialogFile).toContain("'update:selectedKeys': [keys: string[]]");
    expect(dialogFile).toContain("emit('update:selectedKeys', targetDeviceKeys.value)");
    expect(dialogFile).toContain('DropdownMenuCheckboxItem');
    expect(dialogFile).toContain('selectedDeviceLabel');
    expect(dialogFile).toContain('loadControls(targetRows.value)');
    expect(dialogFile).toContain('failedControlMap[item.identifier]');
    expect(dialogFile).toContain('retryControlItem(item)');
    expect(dialogFile).toContain("$t('iotApp.cardDetail.retry')");
    expect(dialogFile).toContain('postApiV1ThingsSchemaCommonGetList');
    expect(dialogFile).toContain('postApiV1ThingsDeviceInteractPropertyControlBatchSend');
    expect(dialogFile).not.toContain('failureRows.length > 0');
    expect(dialogFile).not.toContain('type="number"');
    expect(dialogFile).not.toContain("from 'naive-ui'");
    expect(dialogFile).toContain(':model-value="[Number(getDisplayValue(item))]"');
    expect(dialogFile).toContain('onNumberSliderChange');
  });

  it('keeps dialog actions in the header and uses a select-like multi device picker', () => {
    const dialogFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/modules/DeviceControlDialog.vue');

    expect(dialogFile).toContain('class="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:pr-12"');
    expect(dialogFile).toContain('DropdownMenu v-if="canPickDevices"');
    expect(dialogFile).toContain('role="combobox"');
    expect(dialogFile).toContain('w-[180px]');
    expect(dialogFile).toContain('DropdownMenuCheckboxItem');
    expect(dialogFile).toContain(':model-value="targetDeviceKeys.includes(buildDeviceKey(row))"');
    expect(dialogFile).toContain('@update:model-value="(checked: CheckedState) => onTargetDeviceCheckedChange(row, checked)"');
    expect(dialogFile).not.toContain(':checked="targetDeviceKeys.includes(buildDeviceKey(row))"');
    expect(dialogFile).not.toContain('@update:checked="(checked: CheckedState) => onTargetDeviceCheckedChange(row, checked)"');
    expect(dialogFile).toContain('function onTargetDeviceCheckedChange');
    expect(dialogFile).not.toContain('@select.prevent="toggleTargetDevice(row)"');
    expect(dialogFile).not.toContain('function toggleTargetDevice');
    expect(dialogFile).toContain("message.warning($t('orgIotClient.console.keepOneControlDevice'))");
    expect(dialogFile).not.toContain(' Checkbox,');
    expect(dialogFile).not.toContain("from 'lucide-vue-next'");
    expect(dialogFile).toContain("const headerBadgeClass = 'h-10 px-3 text-sm font-medium'");
    expect(dialogFile).toContain('<Badge :class="headerBadgeClass"');
    expect(dialogFile).not.toContain('ChevronDown');
    expect(dialogFile).not.toContain('已选 {{ targetRows.length }} 台');
    expect(dialogFile).not.toContain('text-[10px]">选择');
    expect(dialogFile).not.toContain('DialogFooter');
  });

  it('hides the stale failed count while a single control item is retrying', () => {
    const dialogFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/modules/DeviceControlDialog.vue');

    expect(dialogFile).toContain('const retryResults = failedControlMap.value[item.identifier]?.results');
    expect(dialogFile).toContain('setControlFailure(item.identifier, undefined)');
    expect(dialogFile).toContain('failedControlMap[item.identifier] || retryingIdentifiers[item.identifier]');
    expect(dialogFile).toContain('failedControlMap[item.identifier] && !retryingIdentifiers[item.identifier]');
  });

  it('keeps retry UX accessible and prevents conflicting footer actions', () => {
    const dialogFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/modules/DeviceControlDialog.vue');

    expect(dialogFile).toContain('const anyRetrying = computed');
    expect(dialogFile).toContain(':disabled="sending || anyRetrying"');
    expect(dialogFile).toContain('role="alert"');
    expect(dialogFile).toContain('aria-live="polite"');
    expect(dialogFile).toContain(':aria-busy="retryingIdentifiers[item.identifier] ? \'true\' : undefined"');
    expect(dialogFile).toContain('class="h-7 px-2 text-xs"');
  });

  it('uses a controlled shadcn transfer dialog and shared tree selector', () => {
    const transferFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/modules/DeviceTransfer.vue');

    expect(transferFile).toContain('@unitedrhino/saas-ui');
    expect(transferFile).toContain('EnergyTreeSelector');
    expect(transferFile).toContain('open: boolean');
    expect(transferFile).toContain("'update:open': [open: boolean]");
    expect(transferFile).toContain("emit('success')");
    expect(transferFile).not.toContain('useVbenModal');
    expect(transferFile).not.toContain('NTreeSelect');
    expect(transferFile).not.toContain("from 'naive-ui'");
  });

  it('uses a split transfer button and passes backend scope fields for all-device transfer', () => {
    const consoleFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/index.vue');
    const transferFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/modules/DeviceTransfer.vue');

    expect(consoleFile).toContain('DropdownMenuItem');
    expect(consoleFile).toContain('icon-[lucide--more-horizontal]');
    expect(consoleFile).toContain('buildTransferScope');
    expect(consoleFile).toContain('onTransferSelectedDevices');
    expect(consoleFile).toContain('onTransferAllDevices');
    expect(consoleFile).toContain("$t('orgIotClient.console.transferAllToArea')");
    expect(consoleFile).toContain(':mode="transferMode"');
    expect(consoleFile).toContain(':scope="transferScope"');
    expect(transferFile).toContain("mode?: 'scope' | 'selected'");
    expect(transferFile).toContain('scope?: DeviceTransferScope');
    expect(transferFile).toContain('props.mode === \'scope\'');
    expect(transferFile).toContain('...(props.scope || {})');
    expect(transferFile).toContain('devices: props.rows.map');
  });

  it('migrates the shared energy tree selector away from Naive UI', () => {
    const treeFile = readRepoFile('apps/web/apps/org-iot-client/src/components/energy/EnergyTreeSelector.vue');

    expect(treeFile).toContain('@unitedrhino/saas-ui');
    expect(treeFile).toContain('expandedKeys');
    expect(treeFile).toContain('toggleNode');
    expect(treeFile).toContain('applyCascadeSelection');
    expect(treeFile).toContain('collectAllKeys');
    expect(treeFile).not.toContain("from 'naive-ui'");
    expect(treeFile).not.toContain('NTree');
    expect(treeFile).not.toContain('NInput');
    expect(treeFile).not.toContain('NSelect');
  });
});
