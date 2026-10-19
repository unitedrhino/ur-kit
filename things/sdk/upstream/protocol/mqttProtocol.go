// 本文件实现 Things MQTT 传输，并将会话及活动记录委托公开协议 SDK。
package protocol

import (
	"context"
	"encoding/json"
	"fmt"

	"gitee.com/unitedrhino/share/caches"
	"gitee.com/unitedrhino/share/conf"
	"gitee.com/unitedrhino/share/ctxs"
	"gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/eventBus"
	"gitee.com/unitedrhino/share/events/topics"
	"gitee.com/unitedrhino/share/utils"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"gitee.com/unitedrhino/things/share/clients"
	"gitee.com/unitedrhino/things/share/devices"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking"
	trackinggozero "github.com/unitedrhino/ur-kit/things/sdk/protocol/tracking/gozero"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/timex"

	"strings"
	"time"
)

type DevHandle func(ctx context.Context, topic string, payload []byte) error

type ConnHandle func(ctx context.Context, info devices.DevConn) (devices.DevConn, error)

type MqttProtocol struct {
	*CoreProtocol
	MqttClient               *clients.MqttClient
	DevSubHandle             map[string]DevHandle
	ConnHandle               ConnHandle
	sharedSubscriptionPrefix string // EMQX 共享订阅前缀。
}

func NewMqttProtocol(pi *dm.ProtocolInfo, pc *CoreProtocolConf, mqttc conf.DevLinkConf) (*MqttProtocol, error) {
	pc.DevLink = mqttc
	lightProto, err := NewCoreProtocol(pi, pc)
	if err != nil {
		return nil, err
	}
	if lightProto.RuntimeConfig.DevLink.Mqtt == nil {
		return nil, errors.Parameter.AddMsg("DevLinkConf need")
	}
	mc, err := clients.NewMqttClient(lightProto.RuntimeConfig.DevLink.Mqtt)
	if err != nil {
		return nil, err
	}
	return &MqttProtocol{
		CoreProtocol:             lightProto,
		MqttClient:               mc,
		DevSubHandle:             make(map[string]DevHandle),
		sharedSubscriptionPrefix: lightProto.RuntimeConfig.DevLink.Mqtt.SharedSubscriptionPrefix(lightProto.ServerName),
	}, nil
}

//// RegisterRpc 如果不想自己维护proto,则实现方法注入即可
//func (m *MqttProtocol) RegisterRpc(c zrpc.RpcServerConf, handle dg.DeviceAuthServer) {
//	m.RegisterRpcServer(c, func(grpcServer *grpc.Server) {
//		dg.RegisterDeviceAuthServer(grpcServer, handle)
//	})
//}

func (m *MqttProtocol) SubscribeDevMsg(topic string, handle DevHandle) error {
	newTopic := m.subscriptionTopic(topic)
	m.DevSubHandle[newTopic] = handle
	return nil
}

// subscriptionTopic 返回协议服务实际提交给 EMQX 的共享订阅主题。
func (m *MqttProtocol) subscriptionTopic(topic string) string {
	return m.sharedSubscriptionPrefix + topic
}

func (m *MqttProtocol) PublishToDev(ctx context.Context, topic string, payload any) error {
	var p []byte
	switch payload.(type) {
	case string:
		p = []byte(payload.(string))
	case []byte:
		p = payload.([]byte)
	default:
		p, _ = json.Marshal(payload)
	}
	err := m.MqttClient.Publish(topic, 1, false, p)
	if err != nil {
		logx.WithContext(ctx).Errorf("PublishToDev failure err:%v topic:%v", err, topic)
	} else {
		logx.WithContext(ctx).Infof("PublishToDev  topic:%v payload:%v", topic, string(p))
	}
	return err
}

func (m *MqttProtocol) Start() error {
	err := m.subscribes(nil)
	if err != nil {
		return err
	}
	m.MqttClient.SetOnConnectHandler(func(cli mqtt.Client) {
		err := m.subscribes(cli)
		if err != nil {
			logx.Errorf("%s.mqttSetOnConnectHandler.subscribes err:%v", utils.FuncName(), err)
		}
	})
	err = m.CoreProtocol.Start()
	if err != nil {
		return err
	}
	return nil
}

func (m *MqttProtocol) subscribes(cli mqtt.Client) error {
	for topic, handle := range m.DevSubHandle {
		err := m.subscribeWithFunc(cli, topic, handle)
		if err != nil {
			return err
		}
	}
	return nil
}

type (
	//登录登出消息
	ConnectMsg struct {
		UserName string `json:"username"`
		Ts       int64  `json:"ts"`
		Address  string `json:"ipaddress"`
		ClientID string `json:"clientid"`
		Reason   string `json:"reason"`
	}
)

const (
	DeviceMqttDevice          = "device:mqtt:device"
	DeviceMqttClientID        = "device:mqtt:clientID"
	DeviceLastActivity        = "device:lastActivity"
	ActivitySmallSetThreshold = 1000    // ZSET 小于此值直接全量查
	ActivityKeyTTL            = 2592000 // 30 天，单位秒
)

func GenDeviceTopicKey(dev devices.Core) string {
	return fmt.Sprintf("%v:%v", dev.ProductID, dev.DeviceName)
}

func genDeviceLastActivityKey(productID string) string {
	return fmt.Sprintf("%s:%s", DeviceLastActivity, productID)
}

// UpdateDeviceActivity 通过公开协议 SDK 更新单台设备最近活动时间。
func UpdateDeviceActivity(ctx context.Context, dev devices.Core) {
	tracker, err := trackinggozero.NewTracker(caches.GetStore())
	if err == nil {
		err = tracker.Touch(ctx, tracking.Device{ProductID: dev.ProductID, DeviceName: dev.DeviceName}, time.Now())
	}
	if err != nil {
		logx.WithContext(ctx).Info(err)
	}
}

// UpdatesDeviceActivity 通过公开协议 SDK 批量更新设备活动时间。
func UpdatesDeviceActivity(ctx context.Context, devs []devices.Core) {
	if len(devs) == 0 {
		return
	}
	tracker, err := trackinggozero.NewTracker(caches.GetStore())
	if err == nil {
		devicesToTouch := make([]tracking.Device, 0, len(devs))
		for _, dev := range devs {
			devicesToTouch = append(devicesToTouch, tracking.Device{ProductID: dev.ProductID, DeviceName: dev.DeviceName})
		}
		err = tracker.TouchMany(ctx, devicesToTouch, time.Now())
	}
	if err != nil {
		logx.WithContext(ctx).Info(err)
	}
}

// GetActivityDevices 汇总旧 MQTT 会话索引对应的近三十天活动设备。
// Deprecated: 使用 GetActivityDevicesByProduct 查询指定产品。
func GetActivityDevices(ctx context.Context) (map[devices.Core]struct{}, error) {
	tracker, err := trackinggozero.NewTracker(caches.GetStore())
	if err != nil {
		return nil, err
	}
	current, err := tracker.ActiveAll(ctx, time.Now())
	if err != nil {
		return nil, err
	}
	result := make(map[devices.Core]struct{}, len(current))
	for dev := range current {
		result[devices.Core{ProductID: dev.ProductID, DeviceName: dev.DeviceName}] = struct{}{}
	}
	return result, nil
}

// GetActivityDevicesByProduct 查询指定产品时间窗内有活动记录的设备。
func GetActivityDevicesByProduct(ctx context.Context, productID string, since time.Duration) (map[devices.Core]struct{}, error) {
	tracker, err := trackinggozero.NewTracker(caches.GetStore())
	if err != nil {
		return nil, err
	}
	current, err := tracker.ActiveByProduct(ctx, productID, since, time.Now())
	if err != nil {
		return nil, err
	}
	result := make(map[devices.Core]struct{}, len(current))
	for dev := range current {
		result[devices.Core{ProductID: dev.ProductID, DeviceName: dev.DeviceName}] = struct{}{}
	}
	return result, nil
}

// DeleteDeviceActivity 删除旧活动索引而不改变设备会话映射。
func DeleteDeviceActivity(ctx context.Context, dev devices.Core) {
	tracker, err := trackinggozero.NewTracker(caches.GetStore())
	if err == nil {
		err = tracker.DeleteActivity(ctx, tracking.Device{ProductID: dev.ProductID, DeviceName: dev.DeviceName})
	}
	if err != nil {
		logx.WithContext(ctx).Info(err)
	}
}

func (m *MqttProtocol) ReportDevConn(ctx context.Context, do devices.DevConn) error {
	return ReportDevMqttConn(ctx, m.FastEvent, do, true)
}

func ReportDevMqttConn(ctx context.Context, e *eventBus.FastEvent, do devices.DevConn, isMqttDevice bool) error {
	if isMqttDevice {
		if do.Action == devices.ActionDisconnected {
			if err := ClearDeviceMqttTrackingByClientID(ctx, do.ClientID); err != nil {
				logx.Error(err)
			}
		} else {
			if err := SyncDeviceMqttTracking(ctx, do); err != nil {
				logx.Error(err)
			}
		}
	}
	var err error
	do.ClientID = fmt.Sprintf("%s&%s", do.ProductID, do.DeviceName)
	switch do.Action {
	case devices.ActionConnected:
		err = e.Publish(ctx, topics.DeviceUpStatusConnected, do)
	case devices.ActionDisconnected:
		err = e.Publish(ctx, topics.DeviceUpStatusDisconnected, do)
	default:
		return errors.Permissions.AddMsg("not support conn type")
	}
	if err != nil {
		logx.Errorf("%s.publish  err:%v", utils.FuncName(), err)
		return err
	}
	return err
}

func (m *MqttProtocol) SubscribeDevConn(handle ConnHandle) error {
	m.ConnHandle = handle
	newTopic := m.subscriptionTopic("$SYS/brokers/+/clients/#")
	m.DevSubHandle[newTopic] = func(ctx context.Context, topic string, payload []byte) error {
		var (
			msg ConnectMsg
			err error
		)
		err = json.Unmarshal(payload, &msg)
		if err != nil {
			logx.Error(err)
			return err
		}
		do := devices.DevConn{
			UserName:  msg.UserName,
			Timestamp: msg.Ts, //毫秒时间戳
			Address:   msg.Address,
			ClientID:  msg.ClientID,
			Reason:    msg.Reason,
		}
		if strings.HasSuffix(topic, "/disconnected") {
			logx.WithContext(ctx).Infof("%s.disconnected topic:%v message:%v err:%v",
				utils.FuncName(), topic, string(payload), err)
			do.Action = devices.ActionDisconnected
		} else {
			do.Action = devices.ActionConnected
			logx.WithContext(ctx).Infof("%s.connected topic:%v message:%v err:%v",
				utils.FuncName(), topic, string(payload), err)
		}
		newDo, err := handle(ctx, do)
		if err != nil {
			return nil //不是该类型的设备
		}
		// 忽略下线后会导致设备正常上下线也会被忽略,这里先不处理
		//if do.Reason == "takeovered" || do.Reason == "takenover" || do.Reason == "discard" || do.Reason == "discarded" { //连接还在的时候被别人顶了,忽略这种下线
		//	logx.Errorf("忽略的下线状态:%v", utils.Fmt(do))
		//	return nil
		//}
		err = m.ReportDevConn(ctx, newDo)
		return err
	}
	return nil
}

func (m *MqttProtocol) PublishDevConn(ctx context.Context, newDo devices.DevConn) error {
	dev := devices.Core{
		ProductID:  newDo.ProductID,
		DeviceName: newDo.DeviceName,
	}
	err := caches.GetStore().Hset(DeviceMqttDevice, GenDeviceTopicKey(dev), utils.MarshalNoErr(newDo))
	if err != nil {
		logx.Error(err)
	}
	err = caches.GetStore().Hset(DeviceMqttClientID, newDo.ClientID, utils.MarshalNoErr(dev))
	if err != nil {
		logx.Error(err)
	}
	newDo.ClientID = fmt.Sprintf("%s&%s", newDo.ProductID, newDo.DeviceName)
	switch newDo.Action {
	case devices.ActionConnected:
		err = m.FastEvent.Publish(ctx, topics.DeviceUpStatusConnected, newDo)
	case devices.ActionDisconnected:
		err = m.FastEvent.Publish(ctx, topics.DeviceUpStatusDisconnected, newDo)
	default:
		panic("not support conn type")
	}
	if err != nil {
		logx.Errorf("%s.publish  err:%v", utils.FuncName(), err)
		return err
	}
	return err
}

func (m *MqttProtocol) subscribeWithFunc(cli mqtt.Client, topic string, handle func(ctx context.Context, topic string, payload []byte) error) error {
	return m.MqttClient.Subscribe(cli, topic,
		1, func(client mqtt.Client, message mqtt.Message) {
			ctx, cancel := context.WithTimeout(context.Background(), 50*time.Second)
			ctx, span := ctxs.StartSpan(ctx, message.Topic(), "")
			utils.Go(ctx, func() {
				defer cancel()
				//dgsvr 订阅到了设备端数据，此时调用StartSpan方法，将订阅到的主题推送给jaeger
				//此时的ctx已经包含当前节点的span信息，会随着 handle(ctx).Publish 传递到下个节点
				defer span.End()
				startTime := timex.Now()
				duration := timex.Since(startTime)
				ctx = ctxs.WithRoot(ctx)
				err := handle(ctx, message.Topic(), message.Payload())
				if err != nil {
					logx.WithContext(ctx).Errorf("%s.handle failure err:%v topic:%v payload:%v", utils.FuncName(), err, topic, string(message.Payload()))
				}
				logx.WithContext(ctx).WithDuration(duration).Infof(
					"SubscribeDevicePublish topic:%v message:%v err:%v",
					message.Topic(), string(message.Payload()), err)
			})
		})
}
