/** org-iot-client 独立基础布局的源码契约测试。 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const currentDir = dirname(fileURLToPath(import.meta.url));
const appSrcDir = resolve(currentDir, '..');

function readAppSource(path: string) {
  return readFileSync(resolve(appSrcDir, path), 'utf8');
}

describe('org iot client local layout contract', () => {
  it('routes use the client BasicLayout entry', () => {
    const coreRoutes = readAppSource('router/routes/core.ts');
    const access = readAppSource('router/access.ts');

    expect(coreRoutes).toContain("import('#/layouts').then((module) => module.BasicLayout())");
    expect(access).toContain("import { BasicLayout, IFrameView } from '#/layouts'");
    expect(coreRoutes).not.toContain("import('@vben/saas/layouts').then((module) => module.BasicLayout())");
    expect(access).not.toContain("import { BasicLayout, IFrameView } from '@vben/saas/layouts'");
  });

  it('keeps the client header logo free of the console return action', () => {
    const headerLogo = readAppSource('components/header-logo-client.vue');
    const basicLayout = readAppSource('layouts/basic.vue');

    expect(headerLogo).not.toContain('返回工作台');
    expect(headerLogo).not.toContain('handleBackToConsole');
    expect(headerLogo).not.toContain('getBackToConsoleUrl');
    expect(headerLogo).not.toContain('VbenTooltip');
    expect(headerLogo).not.toContain('Popover');
    expect(headerLogo).not.toContain('app-menu');
    expect(headerLogo).not.toContain('header-app-menu-trigger');
    expect(headerLogo).toContain('pl-3');
    expect(basicLayout).not.toContain('HeaderUserAppList');
  });

  it('keeps the client user dropdown local and organization-free', () => {
    const userDropdown = readAppSource('components/user-dropdown-client.vue');

    expect(userDropdown).not.toContain('企业');
    expect(userDropdown).not.toContain('邀请成员');
    expect(userDropdown).not.toContain('加入企业');
    expect(userDropdown).not.toContain("getBackToConsoleUrl('/user/settings");
    expect(userDropdown).not.toContain('window.location.href');
    expect(userDropdown).not.toContain('个人设置表单占位');
    expect(userDropdown).not.toContain('title="个人设置"');
    expect(userDropdown).toContain('changePasswordOpen.value = true');
    expect(userDropdown).toContain(':title="$t(\'orgIotClient.layout.changePassword\')"');
    expect(userDropdown).toContain('<span>{{ $t(\'orgIotClient.layout.changePassword\') }}</span>');
    expect(userDropdown).toContain('LockKeyhole');
    expect(userDropdown).toContain('postApiV1SystemUserSelfChangePwd');
    expect(userDropdown).toContain('UserChangePwdReqTypeEnum.PWD');
    expect(userDropdown).toContain('sha256Hex(oldPassword.value)');
    expect(userDropdown).toContain('sha256Hex(newPassword.value)');
  });
});
