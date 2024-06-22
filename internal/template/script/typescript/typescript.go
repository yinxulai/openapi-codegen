package typescript

import (
	_ "embed"
	"log/slog"

	"github.com/dop251/goja"
)

//go:embed typescript.js
var typescriptSource string
var compileVm *goja.Runtime

func Compile(source string) (output string, err error) {
	if compileVm == nil {
		compileVm = goja.New()

		_, err = compileVm.RunString(typescriptSource)
		if err != nil {
			return output, err
		}

		versionValue, err := compileVm.RunString("ts.version")
		if err != nil {
			return output, err
		}

		var typescriptVersion string
		if err = compileVm.ExportTo(versionValue, &typescriptVersion); err != nil {
			return output, err
		}

		slog.Info("use typescript compiler", slog.String("version", typescriptVersion))
	}

	err = compileVm.Set("transpileSource", source)
	if err != nil {
		return
	}

	transpileScriptSource := `
		var transpileResult = ts.transpile(transpileSource, {
			target: ts.ScriptTarget.ES5, // 指定编译目标为 ES5
			module: ts.ModuleKind.CommonJS // 指定模块系统为 CommonJS
		})
	`

	if _, err = compileVm.RunString(transpileScriptSource); err != nil {
		return
	}

	if err = compileVm.ExportTo(compileVm.Get("transpileResult"), &output); err != nil {
		return
	}

	// clean
	compileVm.RunString(`transpileResult = ""`)
	return
}
