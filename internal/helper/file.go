package helper

import (
	"os"
	"path/filepath"
	"reflect"
	"slices"
)

// FindFilePathsByExtension 查找指定路径下的所有指定后缀的文件路径
func FindFilePathsByExtension(dirPath string, fileExtensions []string) ([]string, error) {
	var filePaths []string

	// 遍历指定路径下的所有文件和目录
	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 如果是文件且文件名后缀匹配,则添加到结果列表
		if !info.IsDir() && slices.Contains[[]string](fileExtensions, filepath.Ext(path)) {
			filePaths = append(filePaths, path)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return filePaths, nil
}

func DiffFolderContentsRecursive(target, target2 string) (bool, error) {
	files1, err := os.ReadDir(target)
	if err != nil {
			return false, err
	}

	files2, err := os.ReadDir(target2)
	if err != nil {
			return false, err
	}

	if len(files1) != len(files2) {
			return false, nil
	}

	for i := range files1 {
			path1 := filepath.Join(target, files1[i].Name())
			path2 := filepath.Join(target2, files1[i].Name())

			if files1[i].IsDir() {
					equal, err := DiffFolderContentsRecursive(path1, path2)
					if err != nil || !equal {
							return equal, err
					}
			} else {
					equal, err := DiffFileContents(path1, path2)
					if err != nil || !equal {
							return equal, err
					}
			}
	}

	return true, nil
}

func DiffFileContents(path1, path2 string) (bool, error) {
	data1, err := os.ReadFile(path1)
	if err != nil {
			return false, err
	}

	data2, err := os.ReadFile(path2)
	if err != nil {
			return false, err
	}

	return reflect.DeepEqual(data1, data2), nil
}

func ReadFirstLevelFolders(dirPath string) ([]string, error) {
	var directories []string

	files, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		if file.IsDir() {
			directories = append(directories, filepath.Join(dirPath, file.Name()))
		}
	}

	return directories, nil
}
