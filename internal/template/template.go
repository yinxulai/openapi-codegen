package template

import (
	"log/slog"
	"os"
	"path"
	"path/filepath"
	"strings"
	tpl "text/template"

	"github.com/Masterminds/sprig/v3"
	"github.com/yinxulai/openapi-codegen/internal/helper"
	"github.com/yinxulai/openapi-codegen/internal/template/script"
)

const templateFileExtension = ".tmpl"

func Render(templatePath string, outputPath string, data any) error {
	slog.Info("render template dir", slog.String("path", templatePath))
	templates := make(map[string]*tpl.Template)

	scriptFuncs, err := script.Load(templatePath)
	if err != nil {
		return err
	}

	templateFilePaths, err := helper.FindFilePathsByExtension(templatePath, []string{templateFileExtension})
	if err != nil {
		return err
	}

	for _, templateFilePath := range templateFilePaths {
		relativePath, err := helper.GetRelativePath(templatePath, templateFilePath)
		if err != nil {
			slog.Error(
				"get template file relative path failed", 
				slog.Any("file", relativePath),
				slog.Any("error", err),
			)
			return err
		}

		slog.Info("parse template file", slog.String("file", relativePath))

		file, err := os.ReadFile(templateFilePath)
		if err != nil {
			slog.Error(
				"read template file failed", 
				slog.Any("file", relativePath),
				slog.Any("error", err),
			)
			return err
		}

		templateObj := tpl.New(templateFilePath)
		templateObj = templateObj.Funcs(sprig.FuncMap())
		templateObj = templateObj.Funcs(scriptFuncs)
		templateObj, err = templateObj.Parse(string(file))
		if err != nil {
			return err
		}

		templates[templateFilePath] = templateObj
	}

	for name, template := range templates {
		outputFilePath, err := getOutputFilePath(templatePath, name, outputPath)
		if err != nil {
			return err
		}

		dirPath := filepath.Dir(outputFilePath)
		err = os.MkdirAll(dirPath, 0755)
		if err != nil {
			return err
		}

		file, err := os.Create(outputFilePath)
		if err != nil {
			return err
		}
		defer file.Close()

		if err = template.Execute(file, data); err != nil {
			return err
		}
	}

	return nil
}

// 根据模版文件对象对模板根目录的位置生成对应的输出路径
// 例如：/a，/a/test/test.js.tmpl, /c 输出 /c/test/tets.js
func getOutputFilePath(templateRootPath, templatePath, outputRootPath string) (string, error) {
	relativePath, err := helper.GetRelativePath(templateRootPath, templatePath)
	if err != nil {
		return "", nil
	}

	outputFilePath, _ := strings.CutSuffix(relativePath, templateFileExtension)
	return path.Join(outputRootPath, outputFilePath), nil
}
