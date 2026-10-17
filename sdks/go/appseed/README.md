# 应用与菜单注册

`appseed.Register` 通过公开 HTTP 接口注册一个稳定 ID 的应用及其菜单，无需平台私有源码。客户端使用字符串 ID，保留超过 JavaScript 安全整数范围的标识。

平台需要提供 `POST /api/v1/system/app/info/batch-import`；旧版平台没有该入口时明确失败，不降级为逐条创建。请求携带平台核验的超级管理员登录令牌，不能发送伪造内部身份头。此管理令牌只用于服务端初始化，不能下发给 Web、mobile 或普通业务请求。

```go
// definition 是从应用自己维护的 JSON 清单读取的模板。
id, err := appseed.Register(ctx, httpclient.Client{
    BaseURL: platformURL,
    Token: bootstrapToken,
    TenantCode: "platform",
}, definition)
```

`Definition.App` 对应平台 AppInfo，`Menus` 对应 MenuInfo 的扁平列表：父菜单在前、根菜单 parentID 为字符串 `"1"`、appID 与应用 ID 相同，菜单 ID 和非空 path 在应用内唯一。无菜单的移动应用传空数组。字段、菜单示例及默认应用标识见 [基础客户端清单](../../../apps/iot-basic/backend/bootstrap/client.json)。

重复提交按应用 ID 与菜单自然键收敛；菜单 ID 冲突由平台映射实际 ID 和父子关系。模板负责默认名称、层级、路由等字段；平台保留企业自定义菜单展示、已软删除项和登录密钥配置。清单缺少的旧项不会被自动删除，移除功能需另做显式迁移。应用导入与企业菜单回填分两步，后一步失败可用相同模板重试。注册不创建企业、成员、项目，也不自动扩大角色权限。

[IoT 基础应用](../../../apps/iot-basic/README.md#启动时自动注册)内置四个客户端的启动注册，可直接作为自己的应用初始化起点。Java、Node 后端也可使用各自 HTTP 客户端 POST 同一 JSON 合同，检查 HTTP 状态和响应业务码、应用 ID，并在完成前保持未就绪。
