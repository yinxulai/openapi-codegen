package typescript

import (
	"errors"
	"log/slog"

	"github.com/evanw/esbuild/pkg/api"
)

func Compile(source string) (output string, err error) {
	result := api.Transform(source, api.TransformOptions{
		Loader:       api.LoaderTS,
		Target:       api.ES2015,
		MinifySyntax: false,
	})

	if len(result.Errors) > 0 {
		for _, message := range result.Errors {
			slog.Error(
				"Compile typescript failed",
				slog.Any("file", message.Location.File),
				slog.Any("line", message.Location.Line),
				slog.Any("lineText", message.Location.LineText),
			)
		}

		return "", errors.New("Compile typescript failed")
	}

	return string(result.Code), nil
}
