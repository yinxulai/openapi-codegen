/*
Copyright © 2024 NAME HERE <EMAIL ADDRESS>
*/
package main

import (
	"os"

	"github.com/spf13/cobra"
	"github.com/yinxulai/openapi-codegen/internal/core"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "openapi-codegen",
	Short: "Generate code through openapi",
	Long:  `openapi-codegen is a cli tool that generates code through the openapi specification. It has a built-in highly flexible template engine that can be easily customized.`,

	RunE: func(cmd *cobra.Command, rest []string) (err error) {
		config := &core.Config{}
		config.ApiSchemaPath, err = cmd.Flags().GetString("file")
		if err != nil {
			return err
		}

		config.OutputPath, err = cmd.Flags().GetString("output")
		if err != nil {
			return err
		}

		config.TemplatePath, err = cmd.Flags().GetString("template")
		if err != nil {
			return err
		}

		return core.Run(config)
	},
}


func init() {
	rootCmd.Flags().StringP("template", "t", "./", "Specifying the template directory")
	rootCmd.Flags().StringP("file", "f", "./openapi.json", "Specifying the openapi file")
	rootCmd.Flags().StringP("output", "o", "./generate", "Specifying the output directory")
	rootCmd.Flags().BoolP("verify", "v",  true, "Enable format verification openapi file")

	rootCmd.MarkFlagRequired("template")
	rootCmd.MarkFlagRequired("file")
}

func main() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}
