// 本文件验证公开协议核心与 SaaS go-zero RPC 服务共用的注册和退出路径。
package platformcore

import (
	"context"
	"net"
	"os"
	"os/exec"
	"testing"
	"time"

	"gitee.com/unitedrhino/share/eventBus"
	"github.com/stretchr/testify/require"
	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"
	"gitee.com/unitedrhino/things/share/rpcs/protocolSync/pb/protocolSync"
	publiccore "gitee.com/unitedrhino/things/sdk/protocol/core"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
)

// unavailableSyncServer 只用于确认主动同步服务与其他处理器共用监听地址。
type unavailableSyncServer struct {
	protocolSync.UnimplementedProtocolSyncServer
}

// TestProtocolRPCRegistration 验证设备 RPC 与主动同步 RPC 在隔离进程内共用监听地址。
func TestProtocolRPCRegistration(t *testing.T) {
	if os.Getenv("UR_KIT_RPC_TEST_CHILD") != "1" {
		command := exec.Command(os.Args[0], "-test.run=^TestProtocolRPCRegistration$", "-test.count=1")
		command.Env = append(os.Environ(), "UR_KIT_RPC_TEST_CHILD=1")
		output, err := command.CombinedOutput()
		require.NoError(t, err, string(output))
		return
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	address := listener.Addr().String()
	require.NoError(t, listener.Close())
	core, err := publiccore.NewProtocol(publiccore.Options{
		Info:     &dm.ProtocolInfo{Code: "rpc-test", Name: "RPC 回环协议"},
		Registry: &recordingRegistry{}, Bus: &recordingBus{}, RegisterIP: "127.0.0.1",
	})
	require.NoError(t, err)
	protocol := &CoreProtocol{core: core, fastEvent: eventBus.NewNoopFastEvent("rpc-test")}
	serverConfig := zrpc.RpcServerConf{ListenOn: address}
	healthServer := health.NewServer()
	healthServer.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)
	protocol.RegisterRpcServer(serverConfig, func(server *grpc.Server) {
		healthpb.RegisterHealthServer(server, healthServer)
	})
	protocol.RegisterSync(serverConfig, &unavailableSyncServer{})
	require.NoError(t, protocol.Start())
	t.Cleanup(protocol.Stop)
	connection, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	t.Cleanup(func() { _ = connection.Close() })
	require.Eventually(t, func() bool {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		result, err := healthpb.NewHealthClient(connection).Check(ctx, &healthpb.HealthCheckRequest{})
		return err == nil && result.Status == healthpb.HealthCheckResponse_SERVING
	}, 3*time.Second, 20*time.Millisecond)
	_, err = protocolSync.NewProtocolSyncClient(connection).SyncProduct(context.Background(), &protocolSync.Empty{})
	require.Equal(t, codes.Unimplemented, status.Code(err))
}
