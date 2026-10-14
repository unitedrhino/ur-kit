// 本文件保留协议运行配置原入口，纯值合并实现位于不依赖 protobuf 的 configmerge 包。
package runtimeconfig

import "github.com/unitedrhino/ur-kit/things/sdk/protocol/configmerge"

// MergeConfigJSON 将 JSON 覆写合并到调用方类型；缺失字段保留原值，显式零值生效。
func MergeConfigJSON[T any](base T, overrideJSON string) (T, error) {
	return configmerge.MergeConfigJSON(base, overrideJSON)
}
