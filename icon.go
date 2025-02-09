package main

import (
	"embed"
	"log"
)

//go:embed assets/*
var embeddedAssets embed.FS

// 获取图标数据
func getIcon() []byte {
	// 尝试从嵌入的资源中读取图标
	iconPaths := []string{
		"assets/icon.ico",
	}

	for _, iconPath := range iconPaths {
		log.Printf("尝试加载嵌入的图标文件: %s", iconPath)
		iconData, err := embeddedAssets.ReadFile(iconPath)
		if err == nil {
			log.Printf("成功加载嵌入的图标文件: %s，大小: %d 字节", iconPath, len(iconData))
			return iconData
		}
		log.Printf("加载嵌入的图标失败: %v", err)
	}

	log.Printf("所有图标加载尝试都失败，使用默认图标")
	return getDefaultIcon()
}

// 获取默认图标
func getDefaultIcon() []byte {
	// 16x16 PNG图标 (黑色方块)
	return []byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, 0x61, 0x00, 0x00, 0x00,
		0x1C, 0x49, 0x44, 0x41, 0x54, 0x38, 0x8D, 0x63, 0x60, 0x18, 0x05, 0xA3,
		0x60, 0x14, 0x8C, 0x82, 0x51, 0x30, 0x0A, 0x46, 0xC1, 0x28, 0x18, 0x05,
		0xA3, 0x60, 0x14, 0x0C, 0x3E, 0x00, 0x00, 0x08, 0x00, 0x01, 0x9A, 0x91,
		0x6B, 0xB0, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
		0x60, 0x82,
	}
} 