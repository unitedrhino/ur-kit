package schema

import (
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/spf13/cast"
)

// InferDefineFromValue analyzes a value and returns a Define structure
func InferDefineFromValue(identifier string, value interface{}) (*Define, error) {
	if value == nil {
		return &Define{Type: DataTypeString}, nil
	}

	dataType := InferDataType(value)
	define := &Define{Type: dataType}

	switch dataType {
	case DataTypeInt, DataTypeFloat:
		min, max, step, unit := InferNumericRange(value, dataType)
		define.Min = min
		define.Max = max
		define.Step = step
		define.Unit = unit
	case DataTypeString:
		// Set a reasonable max length for strings
		define.Max = "255"
	case DataTypeTimestamp:
		// Timestamp type - no additional constraints needed
		// Timestamps are typically milliseconds since epoch
		define.Unit = "ms"
	case DataTypeStruct:
		// Handle struct type - recursively infer specs
		if m, ok := value.(map[string]interface{}); ok {
			specs := make(Specs, 0, len(m))
			for k, v := range m {
				subDefine, err := InferDefineFromValue(k, v)
				if err != nil {
					return nil, err
				}
				specs = append(specs, Spec{
					Identifier: k,
					Name:       k,
					DataType:   *subDefine,
				})
			}
			define.Specs = specs
		}
	case DataTypeArray:
		// Handle array type - infer element type from first element
		if arr, ok := value.([]interface{}); ok && len(arr) > 0 {
			elemDefine, err := InferDefineFromValue(identifier+"_elem", arr[0])
			if err != nil {
				return nil, err
			}
			define.ArrayInfo = elemDefine
			define.Max = fmt.Sprintf("%d", len(arr))
		}
	case DataTypeMatrix:
		// Handle matrix type - infer element type from first element of first row
		if matrix, ok := value.([]interface{}); ok && len(matrix) > 0 {
			if firstRow, ok := matrix[0].([]interface{}); ok && len(firstRow) > 0 {
				elemDefine, err := InferDefineFromValue(identifier+"_elem", firstRow[0])
				if err != nil {
					return nil, err
				}
				define.ArrayInfo = elemDefine
				// Set max as "rows,cols" format
				define.Max = fmt.Sprintf("%d,%d", len(matrix), len(firstRow))
			}
		}
	case DataTypeBool:
		// Set mapping for bool type
		define.Mapping = map[string]string{
			"0": "false",
			"1": "true",
		}
	}

	return define, nil
}

// InferDataType determines the DataType from a value
func InferDataType(value interface{}) DataType {
	if value == nil {
		return DataTypeString
	}

	switch v := value.(type) {
	case bool:
		return DataTypeBool
	case float64:
		// JSON unmarshals all numbers as float64
		if v == float64(int64(v)) {
			// It's an integer
			if v > 1000000000000 {
				// Likely a timestamp (milliseconds since epoch)
				return DataTypeTimestamp
			}
			return DataTypeInt
		}
		return DataTypeFloat
	case int, int32, int64:
		intVal := cast.ToInt64(v)
		if intVal > 1000000000000 {
			return DataTypeTimestamp
		}
		return DataTypeInt
	case string:
		// Check if it's a timestamp string (ISO 8601)
		if isTimestampString(v) {
			return DataTypeTimestamp
		}
		return DataTypeString
	case map[string]interface{}:
		return DataTypeStruct
	case []interface{}:
		// Check if it's a matrix (array of arrays)
		if len(v) > 0 {
			isMatrix := true
			for _, elem := range v {
				if _, ok := elem.([]interface{}); !ok {
					isMatrix = false
					break
				}
			}
			if isMatrix {
				return DataTypeMatrix
			}
		}
		return DataTypeArray
	default:
		return DataTypeString // fallback
	}
}

// InferNumericRange generates min/max/step for numeric types
func InferNumericRange(value interface{}, dataType DataType) (min, max, step, unit string) {
	switch dataType {
	case DataTypeInt:
		intVal := cast.ToInt64(value)
		if intVal >= 0 && intVal <= 100 {
			// Likely a percentage or small range value
			return "0", "100", "1", ""
		} else if intVal > 100 && intVal <= 1000 {
			// Medium range value
			return "0", "1000", "1", ""
		} else {
			// Use value-based range
			maxVal := intVal * 2
			if maxVal < 100 {
				maxVal = 100
			}
			return "0", fmt.Sprintf("%d", maxVal), "1", ""
		}
	case DataTypeFloat:
		floatVal := cast.ToFloat64(value)
		// Infer precision from value
		precision := inferPrecision(floatVal)
		stepVal := math.Pow(10, -float64(precision))

		// Generate range (0 to value * 2)
		minVal := 0.0
		maxVal := floatVal * 2
		if maxVal < 100 {
			maxVal = 100
		}

		return fmt.Sprintf("%.2f", minVal),
			fmt.Sprintf("%.2f", maxVal),
			fmt.Sprintf("%."+fmt.Sprintf("%d", precision)+"f", stepVal),
			""
	}
	return "", "", "", ""
}

// inferPrecision determines the decimal precision of a float value
func inferPrecision(value float64) int {
	// Convert to string and count decimal places
	str := fmt.Sprintf("%f", value)
	str = strings.TrimRight(str, "0")
	parts := strings.Split(str, ".")
	if len(parts) == 2 {
		precision := len(parts[1])
		if precision > 6 {
			precision = 6 // Cap at 6 decimal places
		}
		if precision < 1 {
			precision = 1
		}
		return precision
	}
	return 1 // Default to 1 decimal place
}

// isTimestampString checks if a string is a timestamp (ISO 8601 format)
func isTimestampString(value string) bool {
	// Try parsing common timestamp formats
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}

	for _, format := range formats {
		if _, err := time.Parse(format, value); err == nil {
			return true
		}
	}
	return false
}
