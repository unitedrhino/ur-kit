// 本文件提供主协议与子协议配置的纯值选择规则，供不同版本的 protobuf 调用方复用。
package configselect

// Select 根据当前协议代码和产品的子协议代码，返回对应的配置映射。
// protocolCode 是当前协议代码，subProtocolCode 为 nil 表示产品未配置子协议；返回值沿用传入映射，不复制配置。
func Select(protocolCode string, subProtocolCode *string, main, sub map[string]string) map[string]string {
	if subProtocolCode != nil && *subProtocolCode == protocolCode {
		return sub
	}
	return main
}
