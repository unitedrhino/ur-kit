// 文件说明：从 SaaS 固定提交移植 inference_test.go 的物模型语义。
package schema

import (
	"testing"
)

// TestInferDataType tests the InferDataType function
func TestInferDataType(t *testing.T) {
	tests := []struct {
		name     string
		value    interface{}
		expected DataType
	}{
		// Bool type
		{
			name:     "bool true",
			value:    true,
			expected: DataTypeBool,
		},
		{
			name:     "bool false",
			value:    false,
			expected: DataTypeBool,
		},
		// Int type
		{
			name:     "int small",
			value:    float64(25),
			expected: DataTypeInt,
		},
		{
			name:     "int large",
			value:    float64(1000),
			expected: DataTypeInt,
		},
		// Float type
		{
			name:     "float with decimal",
			value:    25.5,
			expected: DataTypeFloat,
		},
		{
			name:     "float small decimal",
			value:    0.123,
			expected: DataTypeFloat,
		},
		// Timestamp type
		{
			name:     "timestamp milliseconds",
			value:    float64(1609459200000), // 2021-01-01 00:00:00 in ms
			expected: DataTypeTimestamp,
		},
		{
			name:     "timestamp string ISO8601",
			value:    "2021-01-01T00:00:00Z",
			expected: DataTypeTimestamp,
		},
		{
			name:     "timestamp string date only",
			value:    "2021-01-01",
			expected: DataTypeTimestamp,
		},
		// String type
		{
			name:     "string normal",
			value:    "hello",
			expected: DataTypeString,
		},
		{
			name:     "string empty",
			value:    "",
			expected: DataTypeString,
		},
		// Struct type
		{
			name: "struct simple",
			value: map[string]interface{}{
				"key1": "value1",
				"key2": 123,
			},
			expected: DataTypeStruct,
		},
		// Array type
		{
			name:     "array of numbers",
			value:    []interface{}{1.0, 2.0, 3.0},
			expected: DataTypeArray,
		},
		{
			name:     "array of strings",
			value:    []interface{}{"a", "b", "c"},
			expected: DataTypeArray,
		},
		{
			name:     "array mixed types",
			value:    []interface{}{1.0, "a", true},
			expected: DataTypeArray,
		},
		// Matrix type
		{
			name: "matrix 2x3",
			value: []interface{}{
				[]interface{}{1.0, 2.0, 3.0},
				[]interface{}{4.0, 5.0, 6.0},
			},
			expected: DataTypeMatrix,
		},
		{
			name: "matrix 3x2",
			value: []interface{}{
				[]interface{}{1.0, 2.0},
				[]interface{}{3.0, 4.0},
				[]interface{}{5.0, 6.0},
			},
			expected: DataTypeMatrix,
		},
		// Nil value
		{
			name:     "nil value",
			value:    nil,
			expected: DataTypeString,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := InferDataType(tt.value)
			if result != tt.expected {
				t.Errorf("InferDataType(%v) = %v, want %v", tt.value, result, tt.expected)
			}
		})
	}
}

// TestInferDefineFromValue tests the InferDefineFromValue function
func TestInferDefineFromValue(t *testing.T) {
	tests := []struct {
		name       string
		identifier string
		value      interface{}
		checkType  DataType
		checkMax   string
		checkUnit  string
	}{
		{
			name:       "int value",
			identifier: "temperature",
			value:      float64(25),
			checkType:  DataTypeInt,
			checkMax:   "100",
		},
		{
			name:       "float value",
			identifier: "humidity",
			value:      25.5,
			checkType:  DataTypeFloat,
			checkMax:   "100.00",
		},
		{
			name:       "string value",
			identifier: "status",
			value:      "online",
			checkType:  DataTypeString,
			checkMax:   "255",
		},
		{
			name:       "bool value",
			identifier: "enabled",
			value:      true,
			checkType:  DataTypeBool,
		},
		{
			name:       "timestamp milliseconds",
			identifier: "createdAt",
			value:      float64(1609459200000),
			checkType:  DataTypeTimestamp,
			checkUnit:  "ms",
		},
		{
			name:       "timestamp string",
			identifier: "updatedAt",
			value:      "2021-01-01T00:00:00Z",
			checkType:  DataTypeTimestamp,
			checkUnit:  "ms",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := InferDefineFromValue(tt.identifier, tt.value)
			if err != nil {
				t.Errorf("InferDefineFromValue() error = %v", err)
				return
			}
			if result.Type != tt.checkType {
				t.Errorf("Type = %v, want %v", result.Type, tt.checkType)
			}
			if tt.checkMax != "" && result.Max != tt.checkMax {
				t.Errorf("Max = %v, want %v", result.Max, tt.checkMax)
			}
			if tt.checkUnit != "" && result.Unit != tt.checkUnit {
				t.Errorf("Unit = %v, want %v", result.Unit, tt.checkUnit)
			}
		})
	}
}

// TestInferDefineFromValue_ComplexTypes tests complex types (array, matrix, struct)
func TestInferDefineFromValue_ComplexTypes(t *testing.T) {
	t.Run("array of numbers", func(t *testing.T) {
		value := []interface{}{1.0, 2.0, 3.0}
		result, err := InferDefineFromValue("numbers", value)
		if err != nil {
			t.Errorf("InferDefineFromValue() error = %v", err)
			return
		}
		if result.Type != DataTypeArray {
			t.Errorf("Type = %v, want %v", result.Type, DataTypeArray)
		}
		if result.Max != "3" {
			t.Errorf("Max = %v, want 3", result.Max)
		}
		if result.ArrayInfo == nil {
			t.Error("ArrayInfo should not be nil")
		} else if result.ArrayInfo.Type != DataTypeInt {
			t.Errorf("ArrayInfo.Type = %v, want %v", result.ArrayInfo.Type, DataTypeInt)
		}
	})

	t.Run("matrix 2x3", func(t *testing.T) {
		value := []interface{}{
			[]interface{}{1.0, 2.0, 3.0},
			[]interface{}{4.0, 5.0, 6.0},
		}
		result, err := InferDefineFromValue("matrix", value)
		if err != nil {
			t.Errorf("InferDefineFromValue() error = %v", err)
			return
		}
		if result.Type != DataTypeMatrix {
			t.Errorf("Type = %v, want %v", result.Type, DataTypeMatrix)
		}
		if result.Max != "2,3" {
			t.Errorf("Max = %v, want 2,3", result.Max)
		}
		if result.ArrayInfo == nil {
			t.Error("ArrayInfo should not be nil")
		} else if result.ArrayInfo.Type != DataTypeInt {
			t.Errorf("ArrayInfo.Type = %v, want %v", result.ArrayInfo.Type, DataTypeInt)
		}
	})

	t.Run("struct with nested fields", func(t *testing.T) {
		value := map[string]interface{}{
			"name":  "device1",
			"value": 25.5,
			"count": float64(10),
		}
		result, err := InferDefineFromValue("config", value)
		if err != nil {
			t.Errorf("InferDefineFromValue() error = %v", err)
			return
		}
		if result.Type != DataTypeStruct {
			t.Errorf("Type = %v, want %v", result.Type, DataTypeStruct)
		}
		if len(result.Specs) != 3 {
			t.Errorf("Specs length = %v, want 3", len(result.Specs))
		}
	})
}

// TestInferNumericRange tests the InferNumericRange function
func TestInferNumericRange(t *testing.T) {
	tests := []struct {
		name     string
		value    interface{}
		dataType DataType
		wantMin  string
		wantMax  string
		wantStep string
	}{
		{
			name:     "int small range (0-100)",
			value:    float64(60),
			dataType: DataTypeInt,
			wantMin:  "0",
			wantMax:  "100",
			wantStep: "1",
		},
		{
			name:     "int medium range (100-1000)",
			value:    float64(500),
			dataType: DataTypeInt,
			wantMin:  "0",
			wantMax:  "1000",
			wantStep: "1",
		},
		{
			name:     "int large range",
			value:    float64(2000),
			dataType: DataTypeInt,
			wantMin:  "0",
			wantMax:  "4000",
			wantStep: "1",
		},
		{
			name:     "float value",
			value:    25.5,
			dataType: DataTypeFloat,
			wantMin:  "0.00",
			wantMax:  "100.00",
			wantStep: "0.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			min, max, step, _ := InferNumericRange(tt.value, tt.dataType)
			if min != tt.wantMin {
				t.Errorf("min = %v, want %v", min, tt.wantMin)
			}
			if max != tt.wantMax {
				t.Errorf("max = %v, want %v", max, tt.wantMax)
			}
			if step != tt.wantStep {
				t.Errorf("step = %v, want %v", step, tt.wantStep)
			}
		})
	}
}
