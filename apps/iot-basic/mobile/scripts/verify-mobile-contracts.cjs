/** 文件说明：校验移动端独立 HTTP 合同来源与内容，防止构建使用损坏的快照。 */
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../contracts');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (!/^[0-9a-f]{40}$/.test(manifest.saasCommit || '')) throw new Error('移动端合同缺少完整来源提交');
for (const name of ['core-api.json', 'things-api.json']) {
  const bytes = fs.readFileSync(path.join(root, name));
  if (createHash('sha256').update(bytes).digest('hex') !== manifest.files?.[name]) throw new Error(`移动端合同摘要不匹配: ${name}`);
}
