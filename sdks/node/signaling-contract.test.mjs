// 本文件验证同源新增信令合同的Node动态编码，保留64位整数与message存在性，不引入业务授权。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import protoLoader from '@grpc/proto-loader';

test('音频保持字段与known false范围在固定合同中往返，旧字段缺省不升级能力', () => {
  const definition=protoLoader.loadSync(fileURLToPath(new URL('../../contracts/source/backend/core/service/aisvr/proto/agentaudio.proto',import.meta.url)),{longs:String,defaults:false,oneofs:true});
  const type=definition['ai.AgentAudioSignaling'];
  const result=type.deserialize(type.serialize({retentionDeadline:'9007199254740993',parentMediaTools:{liveBroadcastAvailable:false}}));
  assert.equal(result.retentionDeadline,'9007199254740993');assert.deepEqual(result.parentMediaTools,{liveBroadcastAvailable:false});
  assert.deepEqual(type.deserialize(type.serialize({})),{});
  const up=definition['ai.AgentAudioUp'],decoded=up.deserialize(up.serialize({sessionRetention:{requestId:'fixture',expiresAt:'9007199254740993',resume:false}}));
  assert.equal(decoded.body,'sessionRetention');assert.equal(decoded.sessionRetention.expiresAt,'9007199254740993');
  const down=definition['ai.AgentAudioDown'],ack=down.deserialize(down.serialize({retentionAck:{requestId:'fixture',expiresAt:'0',resume:true}}));
  assert.equal(ack.body,'retentionAck');assert.equal(ack.retentionAck.resume,true);
});

test('原实例IPC与Focus新增字段不丢失，旧空请求不被补造实例', () => {
  const definition=protoLoader.loadSync(fileURLToPath(new URL('../../contracts/source/backend/core/service/imsvr/proto/device_delivery.proto',import.meta.url)),{longs:String,defaults:false});
  for(const [name,fields] of [['IPCPreflightRequest',{requireCurrentInstance:true,expectedConnectionEpoch:'9007199254740993',expectedConnectionInstance:'fixture'}],['IPCPreflightResponse',{connectionInstance:'fixture'}],['FocusPreflightRequest',{connectionInstance:'fixture'}],['FocusPreflightResponse',{connectionInstance:'fixture'}]]){
    const type=definition['im.'+name];assert.deepEqual(type.deserialize(type.serialize(fields)),fields);assert.deepEqual(type.deserialize(type.serialize({})),{});
  }
});
