package openapi

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/pb33f/libopenapi"
	validator "github.com/pb33f/libopenapi-validator"

	yaml "gopkg.in/yaml.v3"
)

func Load(schemaPath string, verify bool) (any, error) {
	slog.Info(
		"load openapi file",
		slog.String("file", schemaPath),
	)

	data, err := os.ReadFile(schemaPath)
	if err != nil {
		slog.Error(
			"read openapi file failed",
			slog.Any("error", err),
		)
		return nil, err
	}

	if verify {

		// 校验格式
		document, docErrs := libopenapi.NewDocument(data)
		if docErrs != nil {
			slog.Error(
				"read openapi as document failed",
				slog.Any("error", docErrs),
			)
			return nil, err
		}

		parameterValidator, NewValidatorErrors := validator.NewValidator(document)
		if len(NewValidatorErrors) > 0 {
			for i := range NewValidatorErrors {
				err := NewValidatorErrors[i]
				slog.Error("create openapi schema Validator failed:", slog.Any("error", err))
			}
		}

		ok, validateErrors := parameterValidator.ValidateDocument()
		if len(validateErrors) > 0 {
			for i := range validateErrors {
				err := validateErrors[i]
				slog.Error("openapi schema validate failed",
					slog.String("error", err.Message),
					slog.String("reason", err.Reason),
					slog.String("HowToFix", err.HowToFix),
				)
			}
		}

		if !ok {
			panic(NewValidatorErrors)
		}
	}

	schema, err := parseOpenapiFile(schemaPath, data)
	if err != nil {
		slog.Error(
			"parse openapi file failed",
			slog.Any("error", err),
		)
		return nil, err
	}

	return schema, nil
}

// 根据文件后缀识别和解析文件
func parseOpenapiFile(filename string, fileData []byte) (any, error) {
	var data any

	fileExtension := strings.ToLower(filepath.Ext(filename))

	switch fileExtension {
	case ".json":
		if err := json.Unmarshal(fileData, &data); err != nil {
			return nil, err
		}
	case ".yaml", ".yml":
		if err := yaml.Unmarshal(fileData, &data); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unsupported file format: %s", fileExtension)
	}

	return data, nil
}
