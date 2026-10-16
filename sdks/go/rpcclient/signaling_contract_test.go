// 本文件验证固定公开音频/设备投递合同的新增字段、oneof与旧零值线缆兼容；不授予业务权限。
package rpcclient

import (
	"testing"

	ai "github.com/unitedrhino/ur-kit/sdks/go/pb/core/service/aisvr/pb/ai"
	im "github.com/unitedrhino/ur-kit/sdks/go/pb/core/service/imsvr/pb/im"
	"google.golang.org/protobuf/proto"
)

// TestSignalingAdditiveWire 保证私有保持与原实例信息在标准protobuf往返中不丢失，且不会改变旧消息默认值。
func TestSignalingAdditiveWire(t *testing.T) {
	for _, message := range []proto.Message{
		&ai.AgentAudioSignaling{RetentionDeadline: 9007199254740993, ParentMediaTools: &ai.AgentParentMediaTools{LiveBroadcastAvailable: false}},
		&ai.AgentAudioUp{Body: &ai.AgentAudioUp_SessionRetention{SessionRetention: &ai.AgentSessionRetention{RequestId: "fixture", ExpiresAt: 9007199254740993, Resume: false}}},
		&ai.AgentAudioDown{Body: &ai.AgentAudioDown_RetentionAck{RetentionAck: &ai.AgentSessionRetentionAck{RequestId: "fixture", Resume: true}}},
		&ai.AgentAudioNegotiated{SessionRetention: true},
		&im.IPCPreflightRequest{RequireCurrentInstance: true, ExpectedConnectionEpoch: 9007199254740993, ExpectedConnectionInstance: "fixture"},
		&im.IPCPreflightResponse{ConnectionInstance: "fixture"},
		&im.FocusPreflightRequest{ConnectionInstance: "fixture"},
		&im.FocusPreflightResponse{ConnectionInstance: "fixture"},
	} {
		data, err := proto.Marshal(message)
		if err != nil {
			t.Fatal(err)
		}
		decoded := message.ProtoReflect().Type().New().Interface()
		if err = proto.Unmarshal(data, decoded); err != nil || !proto.Equal(message, decoded) {
			t.Fatalf("新增合同字段往返失败: %T %v", message, err)
		}
	}
	var old ai.AgentAudioSignaling
	if err := proto.Unmarshal(nil, &old); err != nil {
		t.Fatal(err)
	}
	if old.GetRetentionDeadline() != 0 || old.GetParentMediaTools() != nil || (&ai.AgentAudioNegotiated{}).GetSessionRetention() {
		t.Fatal("旧空字段不能被推断为支持新能力")
	}
	known := &ai.AgentAudioSignaling{ParentMediaTools: &ai.AgentParentMediaTools{}}
	data, err := proto.Marshal(known)
	if err != nil {
		t.Fatal(err)
	}
	var decoded ai.AgentAudioSignaling
	if err := proto.Unmarshal(data, &decoded); err != nil || decoded.GetParentMediaTools() == nil {
		t.Fatal("明确不可用scope不能退化为旧nil语义")
	}
	if (&im.IPCPreflightRequest{}).GetRequireCurrentInstance() || (&im.FocusPreflightResponse{}).GetConnectionInstance() != "" {
		t.Fatal("旧空实例预检默认值变化")
	}
}
