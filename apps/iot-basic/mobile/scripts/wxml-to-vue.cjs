#!/usr/bin/env node
/**
 * wxml → Vue template + index.ts → <script setup> 转换器
 *
 * 用法: node scripts/wxml-to-vue.cjs <input-dir> <output-dir>
 * 例如: node scripts/wxml-to-vue.cjs ../../wechat/miniprogram/pages ../src/pages
 *
 * 转换规则:
 *  - bind:tap / bindtap / catchtap / bind:longpress 等 → @event(.stop)
 *  - bind:custom-event → @custom-event
 *  - wx:if/elif/else → v-if/v-else-if/v-else
 *  - wx:for[-item|-index|-key] → v-for + :key
 *  - <block> → <template>
 *  - 属性 attr="{{ expr }}" → :attr="expr"
 *  - 文本 {{ }} 保持不变
 *  - .wxss → <style lang="scss" scoped> + 变量 rpx/CSS variables 保留
 *  - Page({...}) / Component({...}) → <script setup lang="ts"> 雏形（需要人工细化）
 */

const fs = require('fs');
const path = require('path');

function convertWxmlToTemplate(wxml) {
  let s = wxml;

  // <block ...> → <template ...>，但需要保留 wx:if/wx:for 在 template 上（后面会再转）
  s = s.replace(/<block(\s|>)/g, '<template$1');
  s = s.replace(/<\/block>/g, '</template>');

  // 事件: bind:tap/bindtap/catch:tap/catchtap/capture-bind:tap/capture-catch:tap
  // 简单做法: bind:foo / bindfoo → @foo;  catch:foo / catchfoo → @foo.stop
  s = s.replace(/\bcatch:([a-zA-Z0-9-]+)=/g, '@$1.stop=');
  s = s.replace(/\bcatch([a-zA-Z][a-zA-Z0-9-]*)=/g, '@$1.stop=');
  s = s.replace(/\bbind:([a-zA-Z0-9-]+)=/g, '@$1=');
  s = s.replace(/\bbind([a-zA-Z][a-zA-Z0-9-]*)=/g, '@$1=');

  // wx:if / wx:elif / wx:else
  s = s.replace(/\bwx:if="\{\{\s*([^}]*?)\s*\}\}"/g, 'v-if="$1"');
  s = s.replace(/\bwx:if="([^"]*?)"/g, 'v-if="$1"');
  s = s.replace(/\bwx:elif="\{\{\s*([^}]*?)\s*\}\}"/g, 'v-else-if="$1"');
  s = s.replace(/\bwx:elif="([^"]*?)"/g, 'v-else-if="$1"');
  s = s.replace(/\bwx:else\b/g, 'v-else');

  // wx:for + wx:for-item + wx:for-index + wx:key
  // 找到完整的 wx:for=...（可能配合 -item/-index/-key）
  s = s.replace(
    /\bwx:for="\{\{\s*([^}]*?)\s*\}\}"((?:\s+wx:(?:for-item|for-index|key)="[^"]*")*)/g,
    (m, list, tail) => {
      let item = 'item';
      let index = 'index';
      let key = '';
      const reItem = /wx:for-item="([^"]+)"/.exec(tail);
      const reIndex = /wx:for-index="([^"]+)"/.exec(tail);
      const reKey = /wx:key="([^"]+)"/.exec(tail);
      if (reItem) item = reItem[1];
      if (reIndex) index = reIndex[1];
      if (reKey) key = reKey[1];
      let attrs = `v-for="(${item}, ${index}) in ${list}"`;
      if (key) {
        if (key === '*this') attrs += ` :key="${item}"`;
        else attrs += ` :key="${item}.${key}"`;
      } else {
        attrs += ` :key="${index}"`;
      }
      return attrs;
    },
  );

  // 属性中 {{ expr }} 完整占位 → :attr="expr"（包括布尔/数字/对象表达式）
  s = s.replace(/(\s)([a-zA-Z][a-zA-Z0-9-]*)="\{\{\s*([^}]*?)\s*\}\}"/g, (m, sp, name, expr) => {
    if (name.startsWith('@') || name.startsWith(':') || name.startsWith('v-')) return m;
    return `${sp}:${name}="${expr}"`;
  });

  // 属性中含混合: attr="prefix{{expr}}suffix" → :attr="`prefix${expr}suffix`"
  s = s.replace(/(\s)([a-zA-Z][a-zA-Z0-9-]*)="([^"]*?\{\{[^"]+\}\}[^"]*?)"/g, (m, sp, name, content) => {
    if (name.startsWith('@') || name.startsWith(':') || name.startsWith('v-')) return m;
    // 转换内容为模板字面量
    const expr = content.replace(/\{\{\s*([^}]+?)\s*\}\}/g, '${$1}');
    return `${sp}:${name}="\`${expr}\`"`;
  });

  // 保留文本内的 {{ }}（Vue 也支持）
  return s;
}

function convertWxssToScss(wxss) {
  // 大多数 wxss 已经兼容 scss；rpx 保留；CSS 变量保留
  // 只是去除 import 微信特有路径不变
  return wxss;
}

/**
 * 把 Page({...}) 或 Component({...}) 风格的 ts 转成 <script setup lang="ts"> 雏形。
 * 简化策略：保留原文件作为参考，生成最小骨架。具体页面由人工细化。
 */
function convertScriptStub(tsContent, pageName) {
  return `<script setup lang="ts">\n// 由 wxml→vue 自动转换器生成的骨架\n// 原 Page/Component 逻辑请参考 wechat/miniprogram 同名 .ts 文件，并迁移到此处\n${tsContent.replace(/^/gm, '// ')}\n</script>\n`;
}

function convert(inputDir, outputDir) {
  const stat = fs.statSync(inputDir);
  if (!stat.isDirectory()) throw new Error(`${inputDir} 不是目录`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });

  // 收集同名 page/component 四件套: index.wxml/.wxss/.ts/.json
  const groups = new Map();
  for (const e of entries) {
    if (e.isDirectory()) {
      // 递归
      convert(path.join(inputDir, e.name), path.join(outputDir, e.name));
      continue;
    }
    const m = /^(.+)\.(wxml|wxss|ts|json)$/.exec(e.name);
    if (!m) continue;
    const base = m[1];
    if (!groups.has(base)) groups.set(base, {});
    groups.get(base)[m[2]] = e.name;
  }

  for (const [base, files] of groups.entries()) {
    if (!files.wxml) continue;
    const wxml = fs.readFileSync(path.join(inputDir, files.wxml), 'utf8');
    const wxss = files.wxss ? fs.readFileSync(path.join(inputDir, files.wxss), 'utf8') : '';
    const ts = files.ts ? fs.readFileSync(path.join(inputDir, files.ts), 'utf8') : '';

    const tpl = convertWxmlToTemplate(wxml);
    const scss = convertWxssToScss(wxss);

    const vue = `<template>\n${tpl}\n</template>\n\n${convertScriptStub(ts, base)}\n<style lang="scss" scoped>\n${scss}\n</style>\n`;
    const out = path.join(outputDir, `${base}.vue`);
    fs.writeFileSync(out, vue);
  }
}

const [, , inDir, outDir] = process.argv;
if (!inDir || !outDir) {
  console.error('用法: node wxml-to-vue.cjs <input-dir> <output-dir>');
  process.exit(1);
}
convert(path.resolve(inDir), path.resolve(outDir));
console.log(`✓ converted ${inDir} → ${outDir}`);
