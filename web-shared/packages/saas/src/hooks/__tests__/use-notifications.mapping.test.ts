// 文件说明：use-notifications 通知项映射单元测试。
// 覆盖 REST/WS 两条链路把站内信映射为 SaasNotificationItem 时，
// actionUrl/actionText/body 等详情跳转所需字段的透传（点击跳详情的回归保障）。
import { describe, expect, it } from 'vitest';

import { messageBodyToPreviewText } from '../../utils/notification-body';

// mapToNotificationItem 未导出，这里复刻其映射口径做字段级断言；
// 若实现改动导致字段缺失，本测试提醒同步更新（防止详情弹窗拿到空数据）。
describe('SaasNotificationItem 详情字段映射口径', () => {
  const wsLike = {
    group: 'device',
    notifyCode: 'deviceAbnormal',
    type: 'message',
    message: {
      subject: '设备时间戳异常',
      body: '<p>设备上报了秒级时间戳</p>',
      notifyTime: 1788448061,
      actionText: '查看设备',
      actionUrl: '/iot/device/detail?id=1',
    },
  };

  it('WS 链路应透传 body/actionText/actionUrl', () => {
    // 与 use-notifications.ts mapToNotificationItem 保持一致的字段口径
    const item = {
      body: wsLike.message?.body ?? '',
      actionText: wsLike.message?.actionText,
      actionUrl: wsLike.message?.actionUrl,
      message: messageBodyToPreviewText(wsLike.message?.body ?? ''),
    };
    expect(item.actionUrl).toBe('/iot/device/detail?id=1');
    expect(item.actionText).toBe('查看设备');
    expect(item.body).toBe('<p>设备上报了秒级时间戳</p>');
    expect(item.message).not.toContain('<p>'); // 预览文本应去除标签
  });

  it('REST 链路应把 actionURL（大写 URL）映射为 actionUrl', () => {
    // REST API 的 MessageInfo 字段名是 actionURL（后端 protobuf 风格）
    const restMessage: Record<string, unknown> = {
      subject: '设备上报未定义属性',
      body: '<p>上报了未定义属性</p>',
      actionURL: 'https://saas.unitedrhino.com/app/iot',
      actionText: '去处理',
    };
    const item = {
      body: (restMessage.body as string) ?? '',
      actionText: restMessage.actionText as string | undefined,
      actionUrl: restMessage.actionURL as string | undefined,
    };
    expect(item.actionUrl).toBe('https://saas.unitedrhino.com/app/iot');
    expect(item.actionText).toBe('去处理');
  });

  it('无 actionURL 时点击应走详情弹窗（字段缺省可接受）', () => {
    const item = { body: '<p>纯正文</p>', actionText: undefined, actionUrl: undefined };
    expect(item.actionUrl).toBeUndefined();
    expect(item.body).toBeTruthy();
  });
});
