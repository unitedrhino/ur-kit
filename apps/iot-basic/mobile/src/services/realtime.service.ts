// 实时通道 Service：封装 WebSocket 基础设施（连接 / 订阅 / 退订）。
// 归属 Services 层，向 Provider 暴露与具体传输无关的实时能力，
// 使依赖方向保持 Provider -> Service -> Datasource。
import { wsDataSource } from '../data/datasources/websocket.datasource';

export class RealtimeService {
  /** 建立实时连接。 */
  connect(token: string): void {
    wsDataSource.connect(token);
  }

  /** 断开实时连接。 */
  disconnect(): void {
    wsDataSource.disconnect();
  }

  /** 订阅指定频道。 */
  subscribe(channel: string): void {
    wsDataSource.subscribe(channel);
  }

  /** 退订指定频道。 */
  unsubscribe(channel: string): void {
    wsDataSource.unsubscribe(channel);
  }
}

export const realtimeService = new RealtimeService();
