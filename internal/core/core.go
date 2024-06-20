package core

import (
	"errors"

	"github.com/yinxulai/openapi-codegen/internal/helper"
	"github.com/yinxulai/openapi-codegen/internal/openapi"
	"github.com/yinxulai/openapi-codegen/internal/template"
)

type Config struct {
	OutputPath    string
	TemplatePath  string
	ApiSchemaPath string
}

func Run(config *Config) error {
	if config.ApiSchemaPath == "" {
		return errors.New("必须指定 ApiSchemaPath")
	}

	if config.TemplatePath == "" {
		return errors.New("必须指定 TemplatePath")
	}

	if config.OutputPath == "" {
		return errors.New("必须指定 OutputPath")
	}

	absoluteOutpath, err := helper.NormalizeToAbsolutePath(config.OutputPath)
	if err != nil {
		return err
	}

	absoluteTemplatePath, err := helper.NormalizeToAbsolutePath(config.TemplatePath)
	if err != nil {
		return err
	}

	absoluteApiSchemaPath, err := helper.NormalizeToAbsolutePath(config.ApiSchemaPath)
	if err != nil {
		return err
	}

	apiSchemaData, err := openapi.Load(absoluteApiSchemaPath)
	if err != nil {
		return err
	}

	if err := template.Render(absoluteTemplatePath, absoluteOutpath, apiSchemaData); err != nil {
		return err
	}

	return nil
}
