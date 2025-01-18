package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

//go:embed static/*
var staticFiles embed.FS

// 获取静态文件系统
// 优先使用本地文件，如果本地文件不存在则使用嵌入的文件
func getStaticFS() http.FileSystem {
	// 检查本地static目录是否存在
	if _, err := os.Stat("static"); err == nil {
		log.Println("使用本地静态文件")
		return http.Dir("static")
	}

	// 如果本地目录不存在，使用嵌入的文件
	log.Println("使用嵌入的静态文件")
	// 因为嵌入的文件包含"static"前缀，需要去掉这个前缀
	stripped, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Printf("无法处理嵌入的静态文件: %v", err)
		return nil
	}
	return http.FS(stripped)
}

// 获取静态文件内容
func getStaticFile(filename string) ([]byte, error) {
	// 先尝试从本地读取
	localPath := filepath.Join("static", filename)
	if data, err := os.ReadFile(localPath); err == nil {
		return data, nil
	}

	// 如果本地文件不存在，从嵌入的文件系统读取
	return staticFiles.ReadFile(filepath.Join("static", filename))
} 