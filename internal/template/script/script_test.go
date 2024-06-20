package script

import (
	"reflect"
	"testing"

	"github.com/dop251/goja"
	"github.com/yinxulai/openapi-codegen/internal/template/script/console"
)

func TestCreateTemplateCommandForScript(t *testing.T) {
	testJavascriptList := []struct {
		script       string
		result       any
		errorMessage string
	}{
		{
			script:       `registerTemplateCommand('test1', data => {return 1})`,
			errorMessage: "",
			result:       int64(1),
		},
		{
			script:       `registerTemplateCommand('test2', data => {throw 'throw error'})`,
			errorMessage: "throw error",
			result:       nil,
		},
	}

	for _, testCase := range testJavascriptList {
		templateCommands, err := LoadTemplateCommandForScript("test-1", testCase.script)
		if err != nil {
			t.Error(err)
			return
		}

		if len(templateCommands) <= 0 {
			t.Errorf("")
			return
		}

		for _, command := range templateCommands {
			result, err := command.handler("test" + "name")

			if !reflect.DeepEqual(testCase.result, result) {
				t.Error("The function execution result does not meet the overdue")
				return
			}

			if testCase.errorMessage != "" {
				if err == nil {
					t.Error("The function execution result does not meet the overdue")
					return
				}

				exception, ok := err.(*goja.Exception)
				if !ok {
					t.Error("The function execution result does not meet the overdue")
					return
				}

				if exception.Value().String() != testCase.errorMessage {
					t.Error("The function execution result does not meet the overdue")
					return
				}
			}
		}
	}
}

func TestRestParams(t *testing.T) {
	vm := goja.New()

	console.Enable(vm)

	vm.RunString(`
		function test(params) {
			console.log(...params)
		}
	`)

	var test func (params ...any) any
	vm.ExportTo(vm.Get("test"), &test)
	test(1)
}
