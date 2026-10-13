// 本文件提供物模型数组、范围及结构体字段的数据标识解析，不依赖平台数据库。
package schema

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/unitedrhino/ur-kit/things/sdk/schema/compat/errors"
)

// DataIDInfo 保存数据标识符的属性、数组位置、原始位置和结构体字段。
type DataIDInfo struct {
	ID     string
	Nums   []int64
	NumStr string
	Column string
}

// ParseDataID 解析属性、数组位置或范围及可选结构体字段。
func ParseDataID(identifier string) (*DataIDInfo, error) {
	parts := strings.Split(identifier, ".")
	switch len(parts) {
	case 1:
		return &DataIDInfo{ID: identifier}, nil
	case 2, 3:
		result := &DataIDInfo{ID: parts[0]}
		if len(parts) == 3 {
			result.Column = parts[2]
		}
		if number, err := strconv.ParseInt(parts[1], 10, 64); err == nil {
			result.Nums = []int64{number}
			result.NumStr = parts[1]
			return result, nil
		}
		if parts[1] == "*" {
			result.NumStr = parts[1]
			return result, nil
		}
		if numbers, err := parseNumberRange(parts[1]); err == nil {
			result.Nums = numbers
			result.NumStr = parts[1]
			return result, nil
		} else if len(parts) == 3 {
			return nil, err
		}
		result.Column = parts[1]
		return result, nil
	default:
		return &DataIDInfo{ID: identifier}, errors.Parameter.AddMsgf("get:%v,need:dataID or dataID.num or dataID.num.column", identifier)
	}
}

// NormalizeArrayDataID 去掉单个非负数组位置的前导零，并保留可选字段后缀。
func NormalizeArrayDataID(identifier string) string {
	info, err := ParseDataID(identifier)
	if err != nil || len(info.Nums) != 1 || info.NumStr == "" || info.Nums[0] < 0 {
		return identifier
	}
	parts := strings.Split(identifier, ".")
	parts[1] = strconv.FormatInt(info.Nums[0], 10)
	return strings.Join(parts, ".")
}

// GetDataName 将数据标识符转换为物模型中的中文功能名和数组位置。
func GetDataName(model *Model, identifier string) string {
	info, err := ParseDataID(identifier)
	if err != nil || model == nil {
		return identifier
	}
	property := model.Property[info.ID]
	if property == nil {
		return identifier
	}
	name := property.Name
	number := info.NumStr
	if number != "" {
		number = "." + number
	}
	definition := &property.Define
	if len(info.Nums) > 0 && property.Define.Type == DataTypeArray {
		definition = definition.ArrayInfo
		name += number
		number = ""
	}
	if info.Column != "" && definition != nil && definition.Type == DataTypeStruct {
		field := definition.Spec[info.Column]
		if field == nil {
			return name
		}
		return name + "." + field.Name + number
	}
	return name + number
}

// parseNumberRange 解析平台使用的方括号数字与闭区间列表。
func parseNumberRange(value string) ([]int64, error) {
	value = strings.TrimSpace(value)
	if !regexp.MustCompile(`^\[([\d,-]+)\]$`).MatchString(value) {
		return nil, errors.Parameter.WithMsg("invalid format, expected [num1,num2-num3,...]")
	}
	var result []int64
	for _, item := range strings.Split(value[1:len(value)-1], ",") {
		if strings.Contains(item, "-") {
			bounds := strings.Split(item, "-")
			if len(bounds) != 2 {
				return nil, fmt.Errorf("invalid range format: %s", item)
			}
			start, startErr := strconv.ParseInt(bounds[0], 10, 64)
			end, endErr := strconv.ParseInt(bounds[1], 10, 64)
			if startErr != nil || endErr != nil {
				return nil, fmt.Errorf("invalid number in range: %s", item)
			}
			if start > end {
				return nil, fmt.Errorf("start number greater than end in range: %s", item)
			}
			for index := start; index <= end; index++ {
				result = append(result, index)
			}
			continue
		}
		if item == "" {
			continue
		}
		number, err := strconv.ParseInt(item, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid number: %s", item)
		}
		result = append(result, number)
	}
	return result, nil
}
