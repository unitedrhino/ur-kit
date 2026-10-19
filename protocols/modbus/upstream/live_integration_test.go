// 本文件连接实际 Things 平台及独立 Modbus 进程，用公开 SDK 模拟器验证采集、控制和断线恢复。
package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	"gitee.com/unitedrhino/share/ctxs"
	"github.com/stretchr/testify/require"
	sdkmodbus "github.com/unitedrhino/ur-kit/protocols/modbus"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

// TestModbusLivePlatform 只在显式启用的隔离平台执行，保留合成测试数据，不清空数据库。
func TestModbusLivePlatform(t *testing.T) {
	if os.Getenv("UR_PROTOCOL_LIVE") != "1" {
		t.Skip("设置 UR_PROTOCOL_LIVE=1 并提供隔离平台及实际 Modbus 二进制")
	}
	dmAddress, binary := os.Getenv("UR_PROTOCOL_DM"), os.Getenv("UR_PROTOCOL_BINARY")
	require.NotEmpty(t, dmAddress)
	require.NotEmpty(t, binary)
	connection, err := grpc.NewClient(dmAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	t.Cleanup(func() { _ = connection.Close() })
	identity, err := json.Marshal(ctxs.GetUserCtx(ctxs.WithRoot(context.Background())))
	require.NoError(t, err)
	ctx := metadata.AppendToOutgoingContext(context.Background(), ctxs.UserInfoKey, base64.StdEncoding.EncodeToString(identity))
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	address := listener.Addr().String()
	simulatorCtx, stopSimulator := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- sdkmodbus.NewSimulator([]uint16{21}).Serve(simulatorCtx, listener) }()
	t.Cleanup(stopSimulator)
	products, devices := dm.NewProductManageClient(connection), dm.NewDeviceManageClient(connection)
	product, err := products.ProductInfoCreate(ctx, &dm.ProductInfo{ProductName: "Modbus纯RPC本地验收", TenantCode: "common", ProtocolCode: "modbus", DeviceType: 1, Status: 1,
		ProtocolConf: map[string]string{"points": `[{"identifier":"temperature","address":0,"registerType":"HOLDING_REGISTER","valueType":"uint16"}]`}})
	require.NoError(t, err)
	productID := product.ProductID
	t.Logf("合成产品 %s；数据保留在专用隔离库供复核", productID)
	_, err = products.ProductSchemaTslImport(ctx, &dm.ProductSchemaTslImportReq{ProductID: productID, Tsl: `{"properties":[{"identifier":"temperature","name":"温度","mode":"rw","define":{"type":"int","min":"0","max":"1000","step":"1"}}]}`})
	require.NoError(t, err)
	_, err = devices.DeviceInfoCreate(ctx, &dm.DeviceInfo{ProductID: productID, DeviceName: "meter", TenantCode: "common", ProtocolConf: map[string]string{"address": address, "mode": "tcp", "timeout": "500", "duration": "200"}})
	require.NoError(t, err)
	directory := t.TempDir()
	require.NoError(t, os.Mkdir(filepath.Join(directory, "etc"), 0700))
	body, err := json.Marshal(map[string]any{"Name": "modbus.rpc", "ListenOn": "127.0.0.1:19356", "Log": map[string]any{"Level": "error"}, "DmRpc": map[string]any{"Enable": true, "Mode": "grpc", "Conf": map[string]any{"Endpoints": []string{dmAddress}, "Timeout": 10000}}})
	require.NoError(t, err)
	require.NoError(t, os.WriteFile(filepath.Join(directory, "etc", "modbus.yaml"), body, 0600))
	logFile, err := os.Create(filepath.Join(directory, "gateway.log"))
	require.NoError(t, err)
	t.Cleanup(func() { _ = logFile.Close() })
	command := exec.Command(binary)
	command.Dir, command.Stdout, command.Stderr = directory, logFile, logFile
	require.NoError(t, command.Start())
	t.Cleanup(func() {
		_ = command.Process.Signal(os.Interrupt)
		finished := make(chan error, 1)
		go func() { finished <- command.Wait() }()
		select {
		case <-finished:
		case <-time.After(5 * time.Second):
			_ = command.Process.Kill()
			<-finished
		}
		if t.Failed() {
			content, _ := os.ReadFile(logFile.Name())
			t.Log(string(content))
		}
	})
	waitState := func(online int64) {
		require.Eventually(t, func() bool {
			info, queryErr := devices.DeviceInfoGetOne(ctx, &dm.DeviceInfoGetOneReq{ProductID: productID, DeviceName: "meter"})
			return queryErr == nil && info.IsOnline == online
		}, 20*time.Second, 300*time.Millisecond, "平台在线状态未收敛为 %d", online)
	}
	waitValue := func(value string) {
		require.Eventually(t, func() bool {
			latest, queryErr := dm.NewDeviceMsgClient(connection).PropertyLatestGetList(ctx, &dm.PropertyLatestGetListReq{ProductID: productID, DeviceName: "meter", DataIDs: []string{"temperature"}})
			if queryErr != nil {
				return false
			}
			for _, point := range latest.List {
				if point.GetValue() == value {
					return true
				}
			}
			return false
		}, 20*time.Second, 300*time.Millisecond, "真实寄存器采样未写回平台: %s", value)
	}
	waitState(1)
	waitValue("21")
	t.Log("PASS Modbus 实际进程 → ur-kit TCP 驱动 → 模拟寄存器 → NATS → 平台属性存储，上线状态正常")
	control, err := dm.NewDeviceInteractClient(connection).PropertyControlSend(ctx, &dm.PropertyControlSendReq{ProductID: productID, DeviceName: "meter", Data: `{"temperature":37}`, ShadowControl: 1, SyncTimeout: 10})
	require.NoError(t, err)
	require.Equal(t, int64(200), control.Code)
	values, err := (sdkmodbus.Client{Address: address}).ReadHoldingRegisters(ctx, 0, 1)
	require.NoError(t, err)
	require.Equal(t, []uint16{37}, values)
	waitValue("37")
	t.Log("PASS 平台属性控制实际写入模拟寄存器，应答和后续采样一致")
	stopSimulator()
	require.NoError(t, <-done)
	waitState(2)
	t.Log("PASS 设备 TCP 断开后平台记录离线")
	restoredListener, err := net.Listen("tcp", address)
	require.NoError(t, err)
	restoredCtx, stopRestored := context.WithCancel(context.Background())
	t.Cleanup(stopRestored)
	go func() { _ = sdkmodbus.NewSimulator([]uint16{58}).Serve(restoredCtx, restoredListener) }()
	waitState(1)
	waitValue("58")
	t.Log("PASS 同地址设备恢复后自动重连、重新上线并继续采集")
}
