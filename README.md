# LAN-transport

一个简单的局域网文件传输工具，支持在同一局域网内快速传输文件。

**当前版本：** v1.0

## 功能特性

- 简单易用的 Web 界面
- 系统托盘常驻，方便访问
- 支持拖拽上传文件
- 自动使用用户下载目录保存文件
- 支持查看传输历史
- 支持二维码扫描，方便移动设备访问
- 支持查看运行日志

## 技术栈

- 后端：Go + Gin
- 前端：原生 JavaScript + CSS
- 系统托盘：systray
- 资源嵌入：Go 1.16+ embed

## 开发环境要求

- Go 1.16 或更高版本
- Windows 操作系统（目前仅支持 Windows）
- goversioninfo（用于生成 Windows 资源文件）

## 构建说明

1. 安装依赖工具：
```bash
go install github.com/josephspurrier/goversioninfo/cmd/goversioninfo@latest
```

2. 生成资源文件：
```bash
go generate
```

3. 构建程序：
```bash
go build -ldflags "-H windowsgui" -o build/LAN-transport.exe
```

## 目录结构

```
.
├── assets/             # 资源文件（图标等）
├── static/            # 静态文件（前端资源）
│   ├── index.html    # 主页面
│   ├── style.css     # 样式文件
│   └── script.js     # JavaScript 脚本
├── build/            # 构建输出目录
├── logs/             # 日志文件目录
└── uploads/          # 默认上传文件目录
```

## 主要文件说明

- `main.go`: 主程序入口，包含 HTTP 服务器和主要业务逻辑
- `icon.go`: 系统托盘图标处理
- `static_files.go`: 静态文件服务处理
- `embed.go`: 资源文件嵌入
- `resource.go`: Windows 资源文件生成配置

## 使用说明

1. 运行程序后，会在系统托盘显示图标
2. 点击"打开主界面"可以打开 Web 界面
3. 可以通过拖拽或点击上传按钮来传输文件
4. 上传的文件默认保存在用户的下载目录下的 LAN-transport 文件夹中
5. 可以通过系统托盘菜单查看运行日志
6. 移动设备可以通过扫描二维码访问

## 注意事项

- 程序会在用户下载目录下创建 LAN-transport 文件夹
- 如果无法访问下载目录，会在程序目录下创建 uploads 文件夹
- 日志文件保存在 logs 目录下
- 首次运行时会自动打开浏览器访问主界面

## 开发计划

- [ ] 支持更多操作系统（Linux、macOS）
- [ ] 添加文件传输进度显示
- [ ] 支持文件夹上传
- [ ] 添加传输速度限制功能
- [ ] 支持设置保存目录
- [ ] 添加暗色主题

## 作者

- **作者：** Jason Mars
- **微信：** Break2029