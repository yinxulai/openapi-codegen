package script

import (
	"html/template"
	"log/slog"
	"os"

	"github.com/dop251/goja"
	"github.com/yinxulai/openapi-codegen/internal/helper"
	"github.com/yinxulai/openapi-codegen/internal/template/script/console"
)

type TemplateCommand struct {
	name     string
	filename string
	handler  func(params ...any) (result any, err error)
}

var scriptExtensions = []string{".js"}

func Load(templatePath string) (template.FuncMap, error) {
	funcMap := template.FuncMap{}
	scriptFilePaths, err := helper.FindFilePathsByExtension(templatePath, scriptExtensions)
	if err != nil {
		return funcMap, err
	}

	for _, scriptFilePath := range scriptFilePaths {
		relativePath, err := helper.GetRelativePath(templatePath, scriptFilePath)
		if err != nil {
			slog.Error(
				"get template script file relative path failed", 
				slog.Any("file", relativePath),
				slog.Any("error", err),
			)
			return funcMap, err
		}

		slog.Info("load template script file", slog.String("file", relativePath))

		script, err := os.ReadFile(scriptFilePath)
		if err != nil {
			slog.Error(
				"read template script file failed", 
				slog.Any("file", relativePath),
				slog.Any("error", err),
			)
			return funcMap, err
		}

		newTemplateCommands, err := LoadTemplateCommandForScript(scriptFilePath, string(script))
		if err != nil {
			slog.Error(
				"load template script failed", 
				slog.Any("file", relativePath),
				slog.Any("error", err),
			)
			return funcMap, err
		}

		for _, command := range newTemplateCommands {
			slog.Info(
				"register template command for script",
				slog.String("command", command.name),
				slog.String("file", relativePath),
			)

			if funcMap[command.name] != nil {
				slog.Warn(
					"duplicate registered template command",
					slog.String("command", command.name),
					slog.String("file", relativePath),
				)
			}

			funcMap[command.name] = command.handler
		}
	}

	return funcMap, nil
}

type CallbackType = func(params ...any) (any, error)

func LoadTemplateCommandForScript(filename string, script string) ([]*TemplateCommand, error) {
	// goja 基本支持 es6，且正在持续推进
	scriptRuntimeVm := goja.New()
	console.Enable(scriptRuntimeVm)
	templateCommands := []*TemplateCommand{}
	err := scriptRuntimeVm.Set("registerTemplateCommand", func(name string, callback CallbackType) {

		// 不是特别快，但是没关系，渲染模板而已
		templateCommands = append(templateCommands, &TemplateCommand{
			name:     name,
			filename: filename,
			handler: func(params ...any) (result any, err error) {
				result, err = callback(params...)
				return result, err
			},
		})
	})
	if err != nil {
		slog.Error("set script runtime failed", slog.Any("error", err))
		return templateCommands, err
	}

	_, err = scriptRuntimeVm.RunString(script)
	if err != nil {
		slog.Error("load template script failed", slog.Any("error", err))
		return templateCommands, err
	}

	return templateCommands, nil
}
