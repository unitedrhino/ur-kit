/**
 * 集抄明细报表 API 调试脚本
 *
 * 用途：验证 batch-get-list 在 partitionBy=deviceName 下是否正确返回 deviceName 字段
 *       对比 partitionBy=areaID 与 partitionBy=deviceName 的响应差异
 *
 * 使用方式：
 *   node energy-meter-debug.mjs
 *
 * 环境变量可覆盖：
 *   METER_HOST、METER_TOKEN、METER_APP_ID、METER_PROJECT_ID、METER_TENANT_CODE、METER_AREA_IDS 均为必填
 *   METER_AREA_IDS 使用逗号分隔的区域 ID
 */

// requireEnv 拒绝未配置的调试目标，避免把任何环境地址或凭据固化进仓库。
function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 必填`);
  return value;
}

const HOST = requireEnv('METER_HOST');
const TOKEN = requireEnv('METER_TOKEN');
const APP_ID = requireEnv('METER_APP_ID');
const PROJECT_ID = requireEnv('METER_PROJECT_ID');
const TENANT_CODE = requireEnv('METER_TENANT_CODE');
const AREA_IDS = requireEnv('METER_AREA_IDS').split(',');

// 使用 2026-04-13 时间范围（与原始 curl 一致，确保有数据）
const dayStart = '1776009600000';
const dayEnd = '1776095999999';

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json;charset=UTF-8',
  'app-id': APP_ID,
  'project-id': PROJECT_ID,
  'tenant-code': TENANT_CODE,
  'token': TOKEN,
};

async function callBatchGetList(partitionBy, argFunc) {
  const url = `${HOST}/api/v1/things/device/msg/property-log/batch-get-list`;
  const body = {
    reqs: AREA_IDS.map(areaID => ({
      productCategoryCode: 'dianbiao',
      dataID: 'TotalEnergy',
      argFunc,
      partitionBy,
      noFirstTs: true,
      timeStart: dayStart,
      timeEnd: dayEnd,
      areaIDs: [areaID],
    })),
    projectID: PROJECT_ID,
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[REQUEST] partitionBy=${partitionBy}, argFunc=${argFunc}`);
  console.log(`  URL: ${url}`);
  console.log(`  Body: ${JSON.stringify(body, null, 2)}`);

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await resp.json();
  console.log(`\n[RESPONSE] status=${resp.status}`);
  console.log(JSON.stringify(json, null, 2));

  // 分析返回的字段
  if (json?.data?.lists) {
    json.data.lists.forEach((list, i) => {
      if (!list || !Array.isArray(list)) {
        console.log(`\n  --- lists[${i}]: null/empty ---`);
        return;
      }
      console.log(`\n  --- lists[${i}] (${list.length} items) ---`);
      list.forEach((item, j) => {
        const keys = Object.keys(item);
        console.log(`    [${j}] keys: ${keys.join(', ')}`);
        console.log(`        deviceName: ${item.deviceName ?? 'N/A'}`);
        console.log(`        areaID: ${item.areaID ?? 'N/A'}`);
        console.log(`        value: ${item.value}`);
      });
    });
  }

  return json;
}

async function main() {
  console.log('集抄明细报表 API 调试');
  console.log(`时间范围: ${new Date(Number(dayStart)).toLocaleString()} ~ ${new Date(Number(dayEnd)).toLocaleString()}`);
  console.log(`区域 IDs: ${AREA_IDS.join(', ')}`);

  // 对比 1: partitionBy=areaID (当前有 bug 时的行为)
  console.log('\n\n' + '#'.repeat(60));
  console.log('# 对比 1: partitionBy=areaID (错误的分区方式)');
  console.log('#'.repeat(60));
  await callBatchGetList('areaID', 'first');
  await callBatchGetList('areaID', 'last');

  // 对比 2: partitionBy=deviceName (正确的，与老版本一致)
  console.log('\n\n' + '#'.repeat(60));
  console.log('# 对比 2: partitionBy=deviceName (正确的分区方式)');
  console.log('#'.repeat(60));
  await callBatchGetList('deviceName', 'first');
  await callBatchGetList('deviceName', 'last');
}

main().catch(console.error);
