// 文件说明：从 SaaS 固定提交移植 repo.go 的物模型语义。
// Package schema 这个文件定义和模板相关的接口及dto定义
package schema

import (
	"context"
	"github.com/unitedrhino/ur-kit/things/sdk/schema/compat/devices"
	"time"
)

type (
	// Info 保存产品物模型模板的持久化元数据。
	Info struct {
		ProductID   string // 产品id
		Schema      string // 数据模板
		CreatedTime time.Time
	}
	// Repo 定义物模型模板的读取、导入和删除能力。
	Repo interface {
		ReadRepo
		TslImport(ctx context.Context, productID string, template *Model) error
		//Update(ctx context.Context, productID string, template *Model) error
		//TslRead(ctx context.Context, productID string) (*Model, error)
		Delete(ctx context.Context, productID string) error
	}
	// ReadRepo 定义物模型读取与缓存失效能力。
	ReadRepo interface {
		GetSchemaModel(ctx context.Context, productID string) (*Model, error)
		//GetReadInfo(ctx context.Context, productID string) (*Info, error)
		ClearCache(ctx context.Context, productID string) error
	}
	// GetSchemaModel 按公开设备标识读取完整物模型。
	GetSchemaModel func(ctx context.Context, productID devices.Core) (*Model, error)
)
