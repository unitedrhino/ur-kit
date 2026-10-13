// 本文件保留物模型 JSON 中原有的整型布尔约定。
package def

// Bool 是物模型密码标志使用的整型布尔值。
type Bool = int64

const (
	// True 表示已显式启用。
	True Bool = 1
	// False 表示已显式关闭。
	False Bool = 2
)
