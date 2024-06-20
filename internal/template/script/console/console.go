package console

import (
	"encoding/json"

	"github.com/dop251/goja"
)

const ModuleName = "console"

type Console struct {
	runtime *goja.Runtime
}

func (c *Console) log(p func(string)) func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		var result string

		for _, arg := range call.Arguments {
			str, _ := json.Marshal(arg)
			result += string(str)
		}

		p(result)
		return nil
	}
}

func Enable(runtime *goja.Runtime) {
	console := &Console{runtime: runtime}

	consoleObj := runtime.NewObject()
	consoleObj.Set("log", console.log(defaultStdPrinter.Log))
	consoleObj.Set("error", console.log(defaultStdPrinter.Error))
	consoleObj.Set("warn", console.log(defaultStdPrinter.Warn))
	consoleObj.Set("info", console.log(defaultStdPrinter.Log))
	consoleObj.Set("debug", console.log(defaultStdPrinter.Log))
	runtime.Set(ModuleName, consoleObj)
}
