# 注册应用、菜单、路由与定时任务

本文使用公开合同与 SDK；管理操作需要平台授予的管理权限，服务自注册 RPC 需要真实的服务间认证。消费者无需读取 SaaS 私有代码，也不能伪造内部身份头取得注册权限。

## 1. 先区分这些注册对象

| 对象 | 注册位置 | 验收方式 |
| --- | --- | --- |
| 应用自己的 HTTP handler | 自己的 Go/Java/Node 后端 | 直接调用业务接口，核验认证、资源动作与业务范围 |
| 平台网关反向代理路由 | Core `RouteManage` 或平台批准的应用代理配置 | 网关路由列表和经过平台地址的实际请求 |
| Web 页面路由 | 应用 `src/router/routes/modules/*.ts` | 菜单进入、刷新直达及未授权 URL |
| 应用与菜单模板 | Core 应用管理及菜单管理 | 当前用户的应用与菜单列表 |
| 定时任务 | Core timed 的任务组和任务配置，另接真实事件消费者 | 实际触发到达处理器并产生业务结果 |

注册菜单不会自动生成页面或后端 handler；登记 API 权限资源也不会自动生成代理路由。部署容器、注册平台入口和为用户授权分别验收。

## 2. 注册平台应用与菜单

公开定义见 [应用 HTTP 合同](../../../../contracts/source/backend/core/service/apisvr/http/system/app/info.api)、[菜单 HTTP 合同](../../../../contracts/source/backend/core/service/apisvr/http/system/app/menu.api) 和 [应用 RPC 合同](../../../../contracts/source/backend/core/service/syssvr/proto/app.proto)。

1. 取得分配给自己应用的固定数字 ID，确定 `name`、`useBy`（客户端或管理端）、`type`（Web/移动端类型）、入口 `url`、状态和菜单策略。不要沿用基础应用示例 ID，也不要在每次启动时重新分配 ID。
2. 基础客户端直接使用[后端内嵌清单和启动注册](../../../../apps/iot-basic/README.md#启动时自动注册)，默认注册四端应用与 23 个 Web 菜单。自己的应用维护自己的稳定 ID、入口和完整菜单清单，不依赖平台 Things 的种子。
3. 平台管理 HTTP 入口为 `/api/v1/system/app/info/create|get-one|update|get-list`，菜单入口为 `/api/v1/system/app/menu/create|get-list|update`。这些入口用于有权管理员的日常维护；应用初始化使用下一项的完整模板批量导入，不以逐条 create 替代幂等注册。
4. 支持启动注册的平台提供 `POST /api/v1/system/app/info/batch-import`，需要真实平台超级管理员身份；Go 用 [appseed.Register](../../../../sdks/go/appseed/README.md)，Java/Node 使用各自 HTTP 客户端发送 `{app, menus}` 并核验业务码与响应 ID。旧平台返回缺少入口时先升级平台，禁止退回逐条 create 来伪装幂等注册。具备平台批准的服务身份时，也可用 `sys.NewAppManageClient(connection).AppMenuBatchImport` 传入 `sys.AppMenuBatchImportReq{App: ..., Menus: ...}`，以固定应用 ID 幂等导入应用与菜单。RPC 与新增 HTTP 入口复用同一幂等导入逻辑；HTTP 随后回填已开通企业缺少的菜单，不自动授予成员权限。`things/sdk/seed` 的 Ensure 方法面向产品等 Things 数据，不能替代 Core 应用和菜单注册。
5. 菜单记录包含 `appID`、`parentID`、`path`、`component`、`defaultName`、`defaultIcon`、`defaultSort`、类型和角色范围。父项先建立，子项使用实际父 ID；`component` 必须匹配当前宿主的页面映射，`path` 必须与 Web 路由一致。隐藏详情页仍归属于有权菜单，不能通过隐藏选项绕过权限。
6. 按应用的 `useBy` 及平台策略开通企业应用、角色与菜单权限。管理端应用绑定可用 [企业应用合同](../../../../contracts/source/backend/core/service/apisvr/http/system/tenant/app.api) 的 `/api/v1/system/tenant/app/create|update`，不要假定客户端与管理端的开通策略相同。
7. 用实际成员调用 `/api/v1/system/user/self/app/get-list`、`/api/v1/system/user/self/menu/get-list` 验收可见范围。平台应用列表可见不能代替当前成员已经有权访问。

前端构建的 `VITE_GLOB_APPID`、后端请求的应用上下文、菜单所属应用 ID 必须一致。移动端以对应端的应用配置接入；AppID 与小程序厂商 AppID 是不同标识。

## 3. 注册平台 API 路由

应用后端先提供自己的业务前缀并接入公开认证/授权中间件。平台转发到该服务时，目标地址必须从平台所在网络可达；容器名只在对应容器网络有效。

服务自注册使用公开 [RouteManage RPC](../../../../contracts/source/backend/core/service/syssvr/proto/route.proto)：

```go
package registration

import (
    "context"
    "encoding/json"

    "github.com/unitedrhino/ur-kit/sdks/go/pb/core/service/syssvr/pb/sys"
    "google.golang.org/grpc"
)

// RegisterRoutes 声明本服务的完整代理路由；连接与上下文由服务认证层提供。
func RegisterRoutes(ctx context.Context, connection grpc.ClientConnInterface, upstream string) error {
    config, err := json.Marshal(map[string]string{
        "code": "my-app-api", "location": "/api/v1/my-app/:suffix", "proxyPass": upstream,
    })
    if err != nil { return err }
    _, err = sys.NewRouteManageClient(connection).RouteInfoBatchUpsert(ctx, &sys.RouteInfoBatchUpsertReq{
        ServiceCode: "my-app",
        List: []*sys.RouteInfo{{Name: "my-app-api", Location: "/api/v1/my-app/:suffix", Proxy: string(config)}},
    })
    return err
}
```

`RouteInfoBatchUpsert` 是按 `serviceCode` 上报**本服务的完整清单**，会清理该服务本次未上报的旧路由；不能复用 Core/Things 或其他应用的服务标识，也不能把只修改的一条当作全量清单。持久停用与删除规则按平台路由合同处理。

HTTP `/api/v1/system/route/get-list` 用于检查动态、配置和应用代理三类来源；`/update` 只管理数据库路由的状态、描述、排序，不能用它修改转发地址，当前没有开放的 HTTP `create`。没有自注册 RPC 权限时，由平台管理员配置受支持的代理来源。

反向代理不替代应用后端鉴权。网关影响到旧端时，核对 `apilegacy` 的路径、ID、认证、错误和上传/WebSocket 语义；部署顺序为后端可用 → 注册代理 → 注册/开通应用菜单 → 前端入口验收。

## 4. 注册 Web 页面路由

在基础应用的 `apps/iot-basic/web/src/views/<业务>/` 增加页面，在 `src/router/routes/modules/<业务>.ts` 默认导出 `RouteRecordRaw[]`；[路由入口](../../../../apps/iot-basic/web/src/router/routes/index.ts) 会收集模块，目录中只放生产路由。

每条路由设置唯一 `name`、稳定 `path`、懒加载 `component` 和标题/图标等 `meta`。详情页可设置 `hideInMenu` 与已授权父入口，但必须同时校验路由访问权；菜单记录的路径和组件映射与这里保持一致。组织前缀由 [org-scope](../../../../apps/iot-basic/web/src/router/org-scope.ts) 统一处理，不在各页面手工拼接。

检查当前 [access.ts](../../../../apps/iot-basic/web/src/router/access.ts) 的权限模式和菜单处理：菜单显示控制不能代替真实路由注册裁剪，更不能代替后端授权。验证菜单请求失败、空授权、无权成员直接输入 URL、页面刷新和企业/项目切换。平台入口 `url`、SPA 路由模式、静态资源基路径及代理前缀须一起核对。

## 5. 注册任务组、定时任务与处理器

定义见 [任务 HTTP 合同](../../../../contracts/source/backend/core/service/apisvr/http/system/job.api) 和 [timed RPC](../../../../contracts/source/backend/core/service/timedsvr/proto/timed.proto)。固定周期业务使用平台 timed 调度，事件总线与服务身份由部署环境提供。

1. 确定自己拥有的 `groupCode` 与稳定任务 `code`。通过 `timed.NewTaskGroupManageClient(connection).TaskGroupCreate` 注册组，再用 `timed.NewTaskInfoManageClient(connection).TaskInfoCreate` 注册任务；HTTP 管理入口为 `/api/v1/system/job/task/group/create` 和 `/info/create`。普通用户不具备平台任务管理权限时，由管理流程注册。
2. 任务组使用 `code/name/status`；Cron 任务使用 `groupCode/code/type=1/cronExpr/params/status`。例如 `cronExpr="@every 10m"`，`params` 为 JSON **字符串**。延时任务 `type=2` 使用毫秒 `executeAt`。ID 为无损整数，时间与状态枚举以所锁合同为准。
3. 先登记可消费的业务处理器，再创建/启用任务。平台事件主题为 `server.timed.<groupCode>.<taskCode>`；触发信封包含 `messageId/taskGroup/taskCode/triggerType/triggerTime/retryCount/params`。`params.topic` 只是业务参数，不会替代实际调度主题；仅创建数据库任务没有消费者不会执行自己的业务代码。
4. 协议周期同步可直接组合公开 [core.Timer](../../../../things/sdk/protocol/core/timer.go) 与 [GRPCTimerScheduler](../../../../things/sdk/protocol/core/timed_grpc.go)，它会注册组和任务，并订阅真实调度主题；调用方提供授权的 RPC 客户端、消息总线、处理器及退出清理。普通应用可直接使用 timed pb 和自己的业务消费者，不必套协议命名。
5. 初始化可重复执行，任务身份保持稳定；代码声明的任务配置与用户可编辑任务分别管理，不能在每次启动时无条件覆盖用户定制 Cron。多实例按既定队列组与业务幂等键消费，触发重投不应重复写业务结果。消费端重新核验并绑定业务记录的企业/项目范围。
6. 停止进程时撤销自己的订阅并等待在途处理；持久任务需要暂停/删除时显式调用 `/info/stop`、`/info/delete` 或对应 RPC。关闭连接不等于平台任务已删除。普通 NATS 不提供持久重投，需要可靠消费时按平台实际开放能力注入持久总线。

验收至少包括重复注册、真实触发、处理失败、重复消息、重启恢复、停用后不再执行、越权拒绝。业务成功以处理结果为准，不以任务创建成功代替。
