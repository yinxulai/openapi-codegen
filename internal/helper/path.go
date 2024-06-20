package helper

import (
	"errors"
	"os"
	"path/filepath"
)

// normalizeToAbsolutePath 自动检查并归一化路径为绝对路径
func NormalizeToAbsolutePath(path string) (string, error) {
	if (path == "") {
		return "", errors.New("path cant to be empty")
	}

	// 检查是否是绝对路径
	if filepath.IsAbs(path) {
			return path, nil
	}

	// 获取当前工作目录
	cwd, err := os.Getwd()
	if err != nil {
			return "", err
	}

	// 拼接相对路径和当前工作目录得到绝对路径
	absolutePath := filepath.Join(cwd, path)

	return absolutePath, nil
}


func GetRelativePath(basePath, targetPath string) (string, error) {
	/*
	获取指定目标路径相对于基础路径的相对路径。

	参数:
	basePath (string): 基础路径。
	targetPath (string): 目标路径。

	返回值:
	string: 相对路径。
	error: 如果出现错误,则返回错误对象,否则返回 nil。
	*/
	relPath, err := filepath.Rel(basePath, targetPath)
	if err != nil {
			return "", err
	}
	return relPath, nil
}
