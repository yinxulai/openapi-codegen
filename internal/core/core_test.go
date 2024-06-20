package core

import (
	"path"
	"testing"

	"github.com/yinxulai/openapi-codegen/internal/helper"
)

type TestCase struct {
	RootPath      string
	TemplatePath  string
	OutputPath    string
	ApiSchemaPath string
	ExpectedPath  string
}

func TestBasic(t *testing.T) {
	testTemplates, err := helper.ReadFirstLevelFolders("../../test_templates")
	if err != nil {
		t.Errorf("Failed to load test template folder %s", err)
		return
	}

	testCaseList := []*TestCase{}
	for _, testTemplateFolder := range testTemplates {
		testCaseList = append(testCaseList, &TestCase{
			RootPath:      testTemplateFolder,
			ExpectedPath:  path.Join(testTemplateFolder, "/expected"),
			TemplatePath:  path.Join(testTemplateFolder, "/template"),
			OutputPath:    path.Join(testTemplateFolder, "/generated"),
			ApiSchemaPath: path.Join(testTemplateFolder, "/openapi.json"),
		})
	}

	for _, caseData := range testCaseList {
		err := Run(&Config{
			OutputPath:    caseData.OutputPath,
			TemplatePath:  caseData.TemplatePath,
			ApiSchemaPath: caseData.ApiSchemaPath,
		})
		if err != nil {
			t.Errorf("Failed to generate code %s, template %s", err, caseData.RootPath)
			return
		}

		expected, err := helper.DiffFolderContentsRecursive(caseData.OutputPath, caseData.ExpectedPath)
		if err != nil {
			t.Errorf("Comparison of generated results failed %s, template %s", err, caseData.RootPath)
			return
		}

		if !expected {
			t.Errorf("The generated results are inconsistent with expectations template %s", caseData.RootPath)
			return
		}
	}
}
