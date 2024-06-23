package typescript

import (
	"errors"
	"log/slog"

	"github.com/evanw/esbuild/pkg/api"
)

func Compile(source string) (output string, err error) {
  result := api.Transform(source, api.TransformOptions{
    Loader: api.LoaderTS,
		MinifySyntax: false,
		Target: api.ES2015,
  })

  if len(result.Errors) > 0 {
		slog.Error("Compile typescript failed", slog.Any("error", result.Errors))
    return "", errors.New("Compile typescript failed")
  }

	return string(result.Code), nil
}
