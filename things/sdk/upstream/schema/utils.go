// 本文件提供物模型数组标识解析及平台数据库查询适配。
package schema

import (
	"fmt"

	"gitee.com/unitedrhino/share/errors"
	"gitee.com/unitedrhino/share/stores"
	"gitee.com/unitedrhino/share/utils"
	kitSchema "github.com/unitedrhino/ur-kit/things/sdk/schema"
	sq "gitee.com/unitedrhino/squirrel"
	"gorm.io/gorm"

	"strings"
)

func GenArray(identifier string, num int) string {
	return fmt.Sprintf("%s.%d", identifier, num)
}

// WhereArray 将公开 SDK 的数组位置筛选应用于 GORM，保留单位置与范围查询语义。
func WhereArray(db *gorm.DB, identifier string, pos string) *gorm.DB {
    filter := kitSchema.ParseArrayPositionFilter(identifier)
    if len(filter.Values) == 0 {
        return db
    }
    if filter.IsRange {
        return db.Where(fmt.Sprintf("%s IN ?", pos), filter.Values)
    }
    return db.Where(fmt.Sprintf("%s = ?", pos), int(filter.Values[0]))
}

// WhereArray2 将公开 SDK 的数组位置筛选应用于 TDengine SQL 构造器。
func WhereArray2(db sq.SelectBuilder, identifier string, pos string) sq.SelectBuilder {
    filter := kitSchema.ParseArrayPositionFilter(identifier)
    if len(filter.Values) == 0 {
        return db
    }
    if filter.IsRange {
        return db.Where(fmt.Sprintf("%s IN (%s)", pos, stores.ArrayToSql(filter.Values)))
    }
    return db.Where(fmt.Sprintf("%s = ?", pos), int(filter.Values[0]))
}

func GetArray(identifier string) (ident string, num int, ok bool) {
	arrs := strings.Split(identifier, ".")
	if len(arrs) <= 1 {
		return identifier, 0, false
	}
	num, err := utils.ToIntE(arrs[1])
	if err != nil {
		return arrs[0], 0, false
	}
	return arrs[0], utils.ToInt(arrs[1]), true
}

type DataIDInfo struct {
	ID     string
	Nums   []int64
	NumStr string
	Column string
}

func ParseDataID(identifier string) (*DataIDInfo, error) {
	arrs := strings.Split(identifier, ".")
	switch len(arrs) {
	case 0, 1:
		return &DataIDInfo{
			ID: identifier,
		}, nil
	case 2:
		num, err := utils.ToInt64E(arrs[1])
		if err != nil {
			if arrs[1] == "*" {
				return &DataIDInfo{
					ID:     arrs[0],
					NumStr: arrs[1],
				}, nil
			}
			nums, err := utils.ParseNumberString(arrs[1])
			if err == nil {
				return &DataIDInfo{
					ID:     arrs[0],
					Nums:   nums,
					NumStr: arrs[1],
				}, nil
			}
			return &DataIDInfo{
				ID:     arrs[0],
				Column: arrs[1],
			}, nil
		}
		return &DataIDInfo{
			ID:     arrs[0],
			Nums:   []int64{num},
			NumStr: arrs[1],
		}, nil
	case 3:
		num, err := utils.ToInt64E(arrs[1])
		if err != nil {
			if arrs[1] == "*" {
				return &DataIDInfo{
					ID:     arrs[0],
					Column: arrs[2],
					NumStr: arrs[1],
				}, nil
			}
			nums, err := utils.ParseNumberString(arrs[1])
			if err != nil {
				return nil, err
			}
			return &DataIDInfo{
				ID:     arrs[0],
				Nums:   nums,
				NumStr: arrs[1],
				Column: arrs[2],
			}, nil
		}
		return &DataIDInfo{
			ID:     arrs[0],
			Nums:   []int64{num},
			NumStr: arrs[1],
			Column: arrs[2],
		}, nil
	}
	return &DataIDInfo{ID: identifier}, errors.Parameter.AddMsgf("get:%v,need:dataID or dataID.num or dataID.num.column", identifier)
}

// NormalizeArrayDataID 将物模型数组位置转换为无前导零的规范形式，并保留数组结构体字段。
func NormalizeArrayDataID(identifier string) string {
	info, err := ParseDataID(identifier)
	if err != nil || len(info.Nums) != 1 || info.NumStr == "" || info.Nums[0] < 0 {
		return identifier
	}
	parts := strings.Split(identifier, ".")
	parts[1] = fmt.Sprintf("%d", info.Nums[0])
	return strings.Join(parts, ".")
}

func GetDataName(m *Model, dataID string) string {
	d, err := ParseDataID(dataID)
	if err != nil {
		return dataID
	}
	p := m.Property[d.ID]
	if p == nil {
		return dataID
	}
	ret := p.Name
	num := d.NumStr
	if num != "" {
		num = "." + num
	}
	def := &p.Define
	if len(d.Nums) > 0 && p.Define.Type == DataTypeArray {
		def = def.ArrayInfo
		ret = ret + num
		num = ""
	}
	if d.Column != "" {
		if def.Type == DataTypeStruct {
			pp := def.Spec[d.Column]
			if pp == nil {
				return ret
			}
			return ret + "." + pp.Name + num
		}
	}
	return ret + num
}
