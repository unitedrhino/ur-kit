import {
  HEAD_DEVICE_TO_APP,
  Reassembler,
  TYPE_ACK,
  arrayBufferToBytes,
  buildAck,
  parseFrame,
} from '../utils/ble-protocol';

export interface BleProtocolMessage {
  type: number;
  value?: unknown;
  ack?: number;
  ackFrames: Uint8Array[];
}

export class BleProtocolService {
  private reassembler = new Reassembler();

  reset(): void {
    this.reassembler.reset();
  }

  pushNotifyChunk(chunk: ArrayBuffer | Uint8Array | number[]): BleProtocolMessage[] {
    const frame = parseFrame(chunk);
    if (!frame || frame.head !== HEAD_DEVICE_TO_APP) {
      return [];
    }

    const { message } = this.reassembler.feed(frame);
    if (!message) {
      return [];
    }

    const type = Number(message.type ?? frame.typeId);
    const ack = typeof message.ack === 'number' ? message.ack : undefined;
    const ackFrames = type === TYPE_ACK ? [] : buildAck(type, []);

    return [{ type, value: message.value, ack, ackFrames }];
  }

  toBytes(value: ArrayBuffer): number[] {
    return arrayBufferToBytes(value);
  }
}

export const bleProtocolService = new BleProtocolService();
