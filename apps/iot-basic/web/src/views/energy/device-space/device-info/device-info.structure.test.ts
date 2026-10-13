import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const appRoot = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(resolve(appRoot, path), 'utf8');
}

describe('org-iot-client device info dashboard surface', () => {
  it('wires the console dashboard action to the org-scoped device info route', () => {
    const consoleFile = readRepoFile('src/views/energy/device-space/console/index.vue');

    expect(consoleFile).toContain('openDeviceInfoDashboard');
    expect(consoleFile).toContain('/device-space/device-info/');
    expect(consoleFile).not.toContain('/iot/device/info/');
  });

  it('keeps the device info page focused on attrs dashboard context', () => {
    const pageFile = readRepoFile('src/views/energy/device-space/device-info/index.vue');
    const attrsFile = readRepoFile('src/views/energy/device-space/device-info/attrs/index.vue');

    expect(pageFile).toContain("provide('deviceInfo'");
    expect(pageFile).toContain("provide('deviceSchema'");
    expect(pageFile).toContain('AttrsDashboard');
    expect(pageFile).not.toContain('SchemaComponent');
    expect(pageFile).not.toContain('DebugComponent');
    expect(attrsFile).toContain('useDeviceInfo');
  });

  it('does not send an empty projectID to property aggregation requests', () => {
    const apiFile = readRepoFile('src/views/energy/device-space/device-info/index.api.ts');
    const modalFile = readRepoFile('src/views/energy/device-space/device-info/attrs/propertiesHistoryModal.vue');

    expect(apiFile).toContain('getPropertyAggList');
    expect(apiFile).toContain('...(params.projectID ? { projectID: params.projectID } : {})');
    expect(modalFile).not.toContain("projectID: deviceInfo?.value?.projectID || ''");
  });
});
