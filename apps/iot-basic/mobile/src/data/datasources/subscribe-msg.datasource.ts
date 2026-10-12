export class SubscribeMsgDataSource {
  async requestSubscribe(tmplIds: string[]): Promise<Record<string, string>> {
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      (wx as any).requestSubscribeMessage({
        tmplIds,
        success: (res: Record<string, string>) => {
          const result: Record<string, string> = {};
          tmplIds.forEach((id) => {
            result[id] = res[id] || 'reject';
          });
          resolve(result);
        },
        fail: (err: { errMsg: string }) => reject(new Error(err.errMsg)),
      });
    });
    // #endif
    // #ifndef MP-WEIXIN
    // 非微信小程序：订阅消息不可用，直接返回 reject 状态
    const result: Record<string, string> = {};
    tmplIds.forEach((id) => { result[id] = 'reject'; });
    return result;
    // #endif
  }
}

export const subscribeMsgDataSource = new SubscribeMsgDataSource();
