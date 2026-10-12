import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const packageRoot = join(process.cwd(), 'packages/saas-ui');

function readPackageFile(path: string) {
  return readFileSync(join(packageRoot, path), 'utf8');
}

describe('@unitedrhino/saas-ui package structure', () => {
  it('declares a private workspace package with stable public exports', () => {
    const pkg = JSON.parse(readPackageFile('package.json'));

    expect(pkg.name).toBe('@unitedrhino/saas-ui');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.sideEffects).toContain('**/*.css');
    expect(Object.keys(pkg.exports)).toEqual(expect.arrayContaining(['.', './components', './components/*', './lib/utils', './styles', './ui', './ui/*']));
  });

  it('uses the new shadcn-vue aliases for package-local source', () => {
    const config = JSON.parse(readPackageFile('components.json'));

    expect(config.aliases).toMatchObject({
      components: '@unitedrhino/saas-ui/components',
      composables: '@unitedrhino/saas-ui/composables',
      lib: '@unitedrhino/saas-ui/lib',
      ui: '@unitedrhino/saas-ui/ui',
      utils: '@unitedrhino/saas-ui/lib/utils',
    });
  });

  it('keeps the new UI package isolated from legacy vben shadcn and radix-vue', () => {
    const files = ['src/index.ts', 'src/ui/index.ts', 'src/ui/select/Select.vue', 'src/ui/select/index.ts', 'src/lib/utils.ts'];

    for (const file of files) {
      expect(existsSync(join(packageRoot, file)), `${file} should exist`).toBe(true);
      const source = readPackageFile(file);
      expect(source).not.toContain('@vben-core/shadcn-ui');
      expect(source).not.toContain('radix-vue');
    }
  });

  it('ships a Reka-based Select that supports multiple values', () => {
    const selectFile = readPackageFile('src/ui/select/Select.vue');
    const rekaSelectRoot = readPackageFile('node_modules/reka-ui/dist/Select/SelectRoot.js');

    expect(selectFile).toContain('SelectRoot');
    expect(selectFile).toContain('reka-ui');
    expect(selectFile).toContain('defineProps<SelectRootProps>()');
    expect(rekaSelectRoot).toContain('multiple:');
  });
});
