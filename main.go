package main

import (
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/getlantern/systray"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/skratchdot/open-golang/open"
)

// 共享文件信息
type SharedFile struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Size      int64     `json:"size"`
	Type      string    `json:"type"`
	Path      string    `json:"path"`
	CreatedAt time.Time `json:"createdAt"`
}

var (
	// 存储共享文件的映射
	sharedFiles = struct {
		sync.RWMutex
		m map[string]SharedFile
	}{m: make(map[string]SharedFile)}
)

// 尝试用Chrome打开URL
func openWithChrome(url string) error {
	// 常见的Chrome路径
	chromePaths := []string{
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
		os.Getenv("LOCALAPPDATA") + "\\Google\\Chrome\\Application\\chrome.exe",
	}

	for _, path := range chromePaths {
		if _, err := os.Stat(path); err == nil {
			log.Printf("找到Chrome: %s", path)
			cmd := exec.Command(path, url)
			return cmd.Start()
		}
	}

	log.Println("未找到Chrome，使用默认浏览器")
	return open.Run(url)
}

func main() {
	// 创建logs目录（如果不存在）
	if err := os.MkdirAll("logs", 0755); err != nil {
		log.Fatalf("创建日志目录失败: %v", err)
	}

	// 配置日志输出到文件
	logFile := filepath.Join("logs", "LAN-transport.log")
	f, err := os.OpenFile(logFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("打开日志文件错误: %v", err)
	}
	defer f.Close()
	log.SetOutput(f)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("------------------------------------------------------------------")
	log.Println("程序启动")

	// 启动系统托盘
	log.Println("准备初始化系统托盘...")
	go func() {
		log.Println("开始初始化系统托盘")
		systray.Run(onReady, onExit)
		log.Println("系统托盘初始化完成")
	}()

	// 创建 Gin 路由
	r := gin.Default()

	// 配置 CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	r.Use(cors.New(config))

	// 静态文件服务
	if staticFS := getStaticFS(); staticFS != nil {
		r.StaticFS("/static", staticFS)
	} else {
		log.Fatal("无法初始化静态文件服务")
	}
	
	// 主页
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/index.html")
	})

	// 上传文件
	r.POST("/upload", func(c *gin.Context) {
		// 从表单获取文件
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无法获取上传的文件"})
			return
		}

		// 获取当前最大ID
		sharedFiles.RLock()
		maxID := 0
		for id := range sharedFiles.m {
			var currentID int
			if _, err := fmt.Sscanf(id, "%d", &currentID); err == nil && currentID > maxID {
				maxID = currentID
			}
		}
		sharedFiles.RUnlock()
		fileID := maxID + 1

		// 获取用户下载目录
		var uploadDir string
		userHome, err := os.UserHomeDir()
		if err == nil {
			downloadDir := filepath.Join(userHome, "Downloads")
			// 检查下载目录是否存在
			if _, err := os.Stat(downloadDir); err == nil {
				uploadDir = filepath.Join(downloadDir, "LAN-transport")
				log.Printf("使用下载目录: %s", uploadDir)
			}
		}

		// 如果无法使用下载目录，则使用默认的uploads目录
		if uploadDir == "" {
			uploadDir = "uploads"
			log.Printf("使用默认目录: %s", uploadDir)
		}

		// 创建目录
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建上传目录失败"})
			return
		}

		// 保存文件
		filename := fmt.Sprintf("%d_%s", fileID, file.Filename)
		filepath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, filepath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
			return
		}

		// 保存文件信息
		sharedFile := SharedFile{
			ID:        fileID,
			Name:      file.Filename,
			Size:      file.Size,
			Type:      file.Header.Get("Content-Type"),
			Path:      filepath,
			CreatedAt: time.Now(),
		}

		sharedFiles.Lock()
		sharedFiles.m[fmt.Sprintf("%d", fileID)] = sharedFile
		sharedFiles.Unlock()

		// 返回文件信息
		c.JSON(http.StatusOK, gin.H{
			"id":         fileID,
			"name":       file.Filename,
			"size":       file.Size,
			"type":       file.Header.Get("Content-Type"),
			"downloadUrl": fmt.Sprintf("/download/%d", fileID),
			"createdAt":  sharedFile.CreatedAt,
		})
	})

	// 下载共享文件
	r.GET("/download/:id", func(c *gin.Context) {
		shareID := c.Param("id")
		log.Printf("【下载文件】收到下载请求，文件ID: %s", shareID)
		
		sharedFiles.RLock()
		file, exists := sharedFiles.m[shareID]
		sharedFiles.RUnlock()

		if !exists {
			log.Printf("【下载文件】文件不存在，ID: %s", shareID)
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
			return
		}

		log.Printf("【下载文件】尝试打开文件: %s", file.Path)
		// 打开文件
		f, err := os.Open(file.Path)
		if err != nil {
			log.Printf("【下载文件】打开文件失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "无法访问文件"})
			return
		}
		defer f.Close()

		// 设置响应头
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", file.Name))
		c.Header("Content-Type", file.Type)
		c.Header("Content-Length", fmt.Sprintf("%d", file.Size))

		// 流式传输文件
		io.Copy(c.Writer, f)
		log.Printf("【下载文件】文件下载完成: %s", file.Name)
	})

	// 获取共享文件列表
	r.GET("/shares", func(c *gin.Context) {
		sharedFiles.RLock()
		files := make([]gin.H, 0, len(sharedFiles.m))
		for id, file := range sharedFiles.m {
			files = append(files, gin.H{
				"id":        id,
				"name":      file.Name,
				"size":      file.Size,
				"type":      file.Type,
				"createdAt": file.CreatedAt,
			})
		}
		sharedFiles.RUnlock()

		c.JSON(http.StatusOK, files)
	})

	// 删除文件
	r.DELETE("/delete/:id", func(c *gin.Context) {
		shareID := c.Param("id")
		
		sharedFiles.Lock()
		file, exists := sharedFiles.m[shareID]
		if !exists {
			sharedFiles.Unlock()
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
			return
		}

		// 删除物理文件
		if err := os.Remove(file.Path); err != nil {
			sharedFiles.Unlock()
			log.Printf("删除文件失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文件失败"})
			return
		}

		// 从共享文件映射中删除
		delete(sharedFiles.m, shareID)
		sharedFiles.Unlock()

		c.JSON(http.StatusOK, gin.H{"message": "文件已删除"})
	})

	// 获取本机IP
	r.GET("/ip", func(c *gin.Context) {
		ip := getLocalIP()
		c.JSON(http.StatusOK, gin.H{"ip": ip})
	})

	// 获取服务器地址并自动打开浏览器
	serverAddr := "0.0.0.0:1112"
	localIP := getLocalIP()
	url := fmt.Sprintf("http://%s:1112", localIP)
	
	go func() {
		// 等待服务器启动
		time.Sleep(time.Second * 2)
		log.Printf("尝试打开浏览器: %s", url)
		if err := openWithChrome(url); err != nil {
			log.Printf("打开浏览器失败: %v", err)
		}
	}()

	// 启动服务器
	log.Printf("服务器运行在 %s", url)
	r.Run(serverAddr)
}

// 获取本机IP
func getLocalIP() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "127.0.0.1"
	}

	// 首先尝试查找 WLAN 接口
	for _, iface := range interfaces {
		if strings.Contains(strings.ToLower(iface.Name), "wlan") {
			addrs, err := iface.Addrs()
			if err != nil {
				continue
			}
			
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					if ipv4 := ipnet.IP.To4(); ipv4 != nil {
						return ipv4.String()
					}
				}
			}
		}
	}

	// 如果没有找到 WLAN，查找其他有效的网络适配器
	for _, iface := range interfaces {
		// 检查是否是有效的网络适配器
		if iface.Flags&net.FlagUp != 0 && // 接口已启用
		   iface.Flags&net.FlagLoopback == 0 && // 不是回环接口
		   !strings.Contains(strings.ToLower(iface.Name), "vmware") && // 不是虚拟机接口
		   !strings.Contains(strings.ToLower(iface.Name), "virtual") && // 不是虚拟接口
		   !strings.Contains(strings.ToLower(iface.Name), "bluetooth") { // 不是蓝牙接口
			
			addrs, err := iface.Addrs()
			if err != nil {
				continue
			}
			
			for _, addr := range addrs {
				if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					if ipv4 := ipnet.IP.To4(); ipv4 != nil {
						// 排除 169.254.x.x 地址
						if !strings.HasPrefix(ipv4.String(), "169.254") {
							return ipv4.String()
						}
					}
				}
			}
		}
	}
	
	return "127.0.0.1"
}

// 系统托盘图标初始化
func onReady() {
	log.Println("开始设置系统托盘图标...")
	iconData := getIcon()
	log.Printf("获取到图标数据，大小: %d 字节", len(iconData))
	
	systray.SetIcon(iconData)
	log.Println("图标设置完成")
	
	systray.SetTitle("局域网文件传输")
	systray.SetTooltip("局域网文件传输")
	log.Println("标题和提示设置完成")

	mOpen := systray.AddMenuItem("打开主界面", "打开主界面")
	mLogs := systray.AddMenuItem("查看日志", "打开日志文件")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("退出", "退出应用")
	log.Println("菜单项添加完成")

	go func() {
		for {
			select {
			case <-mOpen.ClickedCh:
				url := fmt.Sprintf("http://%s:1112", getLocalIP())
				if err := openWithChrome(url); err != nil {
					log.Printf("打开浏览器失败: %v", err)
				}
			case <-mLogs.ClickedCh:
				logPath := filepath.Join("logs", "LAN-transport.log")
				cmd := exec.Command("notepad.exe", logPath)
				if err := cmd.Start(); err != nil {
					log.Printf("打开日志文件失败: %v", err)
				}
			case <-mQuit.ClickedCh:
				log.Println("用户点击退出")
				systray.Quit()
				os.Exit(0)
			}
		}
	}()
	log.Println("系统托盘初始化完成")
}

func onExit() {
	// 清理工作
} 