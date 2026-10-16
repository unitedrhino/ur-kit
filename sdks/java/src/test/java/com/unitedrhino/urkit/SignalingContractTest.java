// 本文件验证同源Java生成的音频保持/原实例合同及旧缺省语义，不替代业务准入校验。
package com.unitedrhino.urkit;

import ai.Agentaudio;
import im.DeviceDeliveryOuterClass;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SignalingContractTest {
  // audioWire核验新增message存在性、64位截止和原oneof往返；旧空字段不表示支持保持。
  @Test void audioWire() throws Exception {
    var source=Agentaudio.AgentAudioSignaling.newBuilder().setRetentionDeadline(9007199254740993L)
        .setParentMediaTools(Agentaudio.AgentParentMediaTools.newBuilder().setLiveBroadcastAvailable(false)).build();
    var decoded=Agentaudio.AgentAudioSignaling.parseFrom(source.toByteArray());
    assertEquals(source,decoded);assertTrue(decoded.hasParentMediaTools());
    assertFalse(Agentaudio.AgentAudioSignaling.getDefaultInstance().hasParentMediaTools());
    assertFalse(Agentaudio.AgentAudioNegotiated.getDefaultInstance().getSessionRetention());
    var up=Agentaudio.AgentAudioUp.newBuilder().setSessionRetention(Agentaudio.AgentSessionRetention.newBuilder().setRequestId("fixture").setExpiresAt(9007199254740993L)).build();
    assertEquals(up,Agentaudio.AgentAudioUp.parseFrom(up.toByteArray()));
    var down=Agentaudio.AgentAudioDown.newBuilder().setRetentionAck(Agentaudio.AgentSessionRetentionAck.newBuilder().setRequestId("fixture").setResume(true)).build();
    assertEquals(down,Agentaudio.AgentAudioDown.parseFrom(down.toByteArray()));
  }
  // instanceWire核验可选原实例字段不会在序列化中丢失，旧请求仍保留false/空默认值。
  @Test void instanceWire() throws Exception {
    var request=DeviceDeliveryOuterClass.IPCPreflightRequest.newBuilder().setRequireCurrentInstance(true)
        .setExpectedConnectionEpoch(9007199254740993L).setExpectedConnectionInstance("fixture").build();
    assertEquals(request,DeviceDeliveryOuterClass.IPCPreflightRequest.parseFrom(request.toByteArray()));
    var focus=DeviceDeliveryOuterClass.FocusPreflightResponse.newBuilder().setConnectionInstance("fixture").build();
    assertEquals(focus,DeviceDeliveryOuterClass.FocusPreflightResponse.parseFrom(focus.toByteArray()));
    assertFalse(DeviceDeliveryOuterClass.IPCPreflightRequest.getDefaultInstance().getRequireCurrentInstance());
    assertEquals("",DeviceDeliveryOuterClass.FocusPreflightResponse.getDefaultInstance().getConnectionInstance());
  }
}
