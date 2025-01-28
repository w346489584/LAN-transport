// 初始化应用
function initApp() {
    console.log('页面加载完成');
    const fileInput = document.getElementById('fileInput');
    const transferList = document.getElementById('transferList');
    const pageUrl = document.getElementById('pageUrl');
    const copyUrl = document.getElementById('copyUrl');
    const selectFileBtn = document.querySelector('.select-file-btn');

    // 初始化主题
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'blue';
        const themeButtons = document.querySelectorAll('.theme-btn');
        
        // 设置初始主题
        document.body.dataset.theme = savedTheme;
        themeButtons.forEach(btn => {
            if (btn.dataset.theme === savedTheme) {
                btn.classList.add('active');
            }
            
            // 添加点击事件
            btn.addEventListener('click', () => {
                // 移除其他按钮的active类
                themeButtons.forEach(b => b.classList.remove('active'));
                // 添加当前按钮的active类
                btn.classList.add('active');
                
                // 设置主题
                const theme = btn.dataset.theme;
                document.body.dataset.theme = theme;
                localStorage.setItem('theme', theme);
            });
        });
    }

    // 选择文件按钮点击事件
    selectFileBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止默认行为
        fileInput.click();
    });

    // 获取服务器IP地址
    function getServerIP() {
        console.log('开始获取服务器IP');
        return fetch('/ip')
            .then(response => response.json())
            .then(data => {
                console.log('获取到服务器IP:', data.ip);
            return data.ip;
                        })
            .catch(error => {
            console.error('获取服务器IP失败:', error);
            return window.location.hostname;
            });
    }

    // 生成二维码
    function generateQRCode(url) {
        console.log('开始生成二维码，URL:', url);
        try {
        pageUrl.value = url;
            
            // 检查QRCode是否存在
            if (typeof QRCode === 'undefined') {
                console.error('QRCode库未加载');
                return;
            }
        
        // 清除旧的二维码
        const qrcodeElement = document.getElementById('qrcode');
            if (!qrcodeElement) {
                console.error('找不到二维码容器元素');
                return;
            }
        qrcodeElement.innerHTML = '';
        
        // 生成新的二维码
        new QRCode(qrcodeElement, {
            text: url,
            width: 200,
            height: 200,
            colorDark: "#2c3e50",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
            console.log('二维码生成成功');
        } catch (error) {
            console.error('生成二维码失败:', error);
            const qrcodeElement = document.getElementById('qrcode');
            if (qrcodeElement) {
                qrcodeElement.innerHTML = `<div style="color: red;">二维码生成失败: ${error.message}</div>`;
            }
        }
    }

    // 获取服务器基础URL并生成二维码
    console.log('开始初始化服务器URL');
    getServerIP().then(serverIP => {
        console.log('服务器IP获取成功:', serverIP);
        const serverBaseUrl = `http://${serverIP}:1112`;
        console.log('生成服务器基础URL:', serverBaseUrl);
        generateQRCode(serverBaseUrl);
    });

    // 复制链接
    copyUrl.addEventListener('click', () => {
        pageUrl.select();
        document.execCommand('copy');
        
        // 显示复制成功提示
        const originalText = copyUrl.textContent;
        copyUrl.textContent = '已复制';
        copyUrl.style.backgroundColor = '#2ecc71';
        
        setTimeout(() => {
            copyUrl.textContent = originalText;
            copyUrl.style.backgroundColor = '';
        }, 2000);
    });

    // 获取文件图标
    function getFileIcon(fileType, fileName) {
        // 文件类型图标映射
        const iconMap = {
            // 图片
            'image': '<svg class="file-icon" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
            // 视频
            'video': '<svg class="file-icon" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
            // 音频
            'audio': '<svg class="file-icon" viewBox="0 0 24 24"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>',
            // PDF
            'pdf': '<svg class="file-icon" viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>',
            // 文档
            'document': '<svg class="file-icon" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
            // 压缩文件
            'archive': '<svg class="file-icon" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 6h-2v2h2v2h-2v2h-2v-2H8v-2h2v-2H8v-2h2v-2h2v2h2v2z"/></svg>',
            // 默认
            'default': '<svg class="file-icon" viewBox="0 0 24 24"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>'
        };

        // 获取文件扩展名
        const ext = fileName.split('.').pop().toLowerCase();

        // 根据文件类型和扩展名返回对应图标
        if (fileType.startsWith('image/')) {
            return iconMap.image;
        } else if (fileType.startsWith('video/')) {
            return iconMap.video;
        } else if (fileType.startsWith('audio/')) {
            return iconMap.audio;
        } else if (fileType === 'application/pdf' || ext === 'pdf') {
            return iconMap.pdf;
        } else if (fileType.includes('document') || ['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
            return iconMap.document;
        } else if (fileType.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return iconMap.archive;
        }
        
        return iconMap.default;
    }

    // 创建缩略图
    function createThumbnail(file) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            if (file.type.startsWith('image/')) {
                if (file instanceof File) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.src = e.target.result;
                        img.className = 'file-thumbnail';
                        resolve(img);
                    };
                    reader.readAsDataURL(file);
                } else {
                    const img = new Image();
                    img.src = `/download/${file.id}`;
                    img.className = 'file-thumbnail';
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                }
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.currentTime = 1; // 截取第1秒的画面
                video.addEventListener('loadeddata', () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 100;
                    canvas.height = 100;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const img = new Image();
                    img.src = canvas.toDataURL();
                    img.className = 'file-thumbnail';
                    URL.revokeObjectURL(video.src);
                    resolve(img);
                });
            }
        });
    }

    // 处理图片预览
    function handleImagePreview(file, transferItem) {
        const previewDialog = document.getElementById('imagePreviewDialog');
        const previewImage = document.getElementById('previewImage');
        const closeBtn = previewDialog.querySelector('.close-btn');
        const downloadBtn = previewDialog.querySelector('.download-btn');

        // 显示图片前先清空
        previewImage.removeAttribute('src');
        
        console.log('预览图片:', file);
        console.log('是否为File对象:', file instanceof File);
        
        // 添加图片加载错误处理
        const handleError = () => {
            console.error('图片加载失败:', previewImage.src);
            alert('图片加载失败，请重试');
            closePreview();
        };

        // 添加图片加载成功处理
        const handleLoad = () => {
            console.log('图片加载成功');
            // 显示对话框
            previewDialog.style.display = 'flex';
        };

        previewImage.addEventListener('error', handleError);
        previewImage.addEventListener('load', handleLoad);
        
        // 显示图片
        if (file instanceof File) {
            console.log('预览上传中的文件');
            previewImage.src = URL.createObjectURL(file);
        } else {
            console.log('预览已上传的文件, ID:', file.id);
            previewImage.src = `/download/${file.id}`;
        }

        // 点击背景关闭
        const handleBackgroundClick = (e) => {
            if (e.target === previewDialog) {
                closePreview();
            }
        };
        previewDialog.addEventListener('click', handleBackgroundClick);

        // 关闭按钮
        const handleClose = () => closePreview();
        closeBtn.addEventListener('click', handleClose);

        // 下载按钮 - 使用与文件列表相同的下载方式
        const handleDownload = () => {
            if (file instanceof File) {
                alert('文件正在上传中，请等待上传完成后再下载');
                return;
            }
            if (isMobile()) {
                // 移动端保持原来的行为
                window.open(`/download/${file.id}`, '_blank');
            } else {
                // PC端使用download属性强制下载
                const a = document.createElement('a');
                a.href = `/download/${file.id}`;
                a.download = file.name;  // 强制下载而不是打开
                a.click();
            }
        };
        downloadBtn.addEventListener('click', handleDownload);

        function closePreview() {
            // 移除所有事件监听器
            previewDialog.removeEventListener('click', handleBackgroundClick);
            closeBtn.removeEventListener('click', handleClose);
            downloadBtn.removeEventListener('click', handleDownload);
            previewImage.removeEventListener('error', handleError);
            previewImage.removeEventListener('load', handleLoad);
            
            // 隐藏对话框
            previewDialog.style.display = 'none';
            
            // 清理资源
            if (file instanceof File && previewImage.src) {
                URL.revokeObjectURL(previewImage.src);
            }
            
            // 最后再清空图片源
            previewImage.removeAttribute('src');
        }
    }

    // 创建传输项UI
    function createTransferItem(file, withProgress = true) {
        const item = document.createElement('div');
        item.className = 'transfer-item';
        item.dataset.id = file.id;
        
        // 格式化时间
        const time = file.createdAt ? new Date(file.createdAt) : new Date();
        const timeStr = time.toLocaleString('zh-CN', {
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 获取文件图标
        const fileIcon = getFileIcon(file.type, file.name);
        
        // 基本HTML结构
        item.innerHTML = `
            <div class="file-name-row">
                <div class="file-preview">
                    ${fileIcon}
                    <div class="thumbnail-container"></div>
                </div>
                <div class="filename">${file.name}</div>
                ${!withProgress ? `<span class="filesize">${formatSize(file.size)}</span>` : ''}
            </div>
            <div class="file-info-row">
                <span class="file-time">${timeStr}</span>
                ${withProgress ? 
                    `<div class="transfer-status">
                        <span class="upload-status">
                            <span class="upload-status-main">正在上传... <span class="upload-speed"></span></span>
                            <span class="upload-status-sub"><span class="upload-progress">0%</span> <span class="upload-remaining"></span></span>
                        </span>
                    </div>` : 
                    `<div class="transfer-status">
                        <button class="delete-btn" style="display: none">
                            <svg viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            删除
                        </button>
                        <button class="download-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            点击下载
                        </button>
                    </div>`
                }
            </div>
            ${withProgress ? '<div class="progress-bar"><div class="progress"></div></div>' : ''}
        `;

        // 如果是图片或视频，创建并添加缩略图
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const thumbnail = createThumbnail(file);
            thumbnail.then(img => {
                if (img) {
                    const container = item.querySelector('.thumbnail-container');
                    container.appendChild(img);
                    item.querySelector('.file-preview').classList.add('has-thumbnail');
                }
            });
        }

        // 如果是图片，添加点击预览功能
        if (file.type.startsWith('image/')) {
            const preview = item.querySelector('.file-preview');
            preview.style.cursor = 'pointer';
            preview.addEventListener('click', () => handleImagePreview(file, item));
        }

        // 检查是否在移动设备上
        if (!withProgress) {
            const deleteBtn = item.querySelector('.delete-btn');
            if (!isMobile()) {
                deleteBtn.style.display = 'inline-flex';
                deleteBtn.addEventListener('click', () => {
                    // 显示确认对话框
                    const confirmDialog = document.getElementById('confirmDialog');
                    const confirmBtn = confirmDialog.querySelector('.confirm-btn');
                    const cancelBtn = confirmDialog.querySelector('.cancel-btn');
                    
                    confirmDialog.style.display = 'flex';
                    
                    // 创建Promise来处理用户选择
                    const userChoice = new Promise((resolve) => {
                        const handleConfirm = () => {
                            cleanup();
                            resolve(true);
                        };
                        
                        const handleCancel = () => {
                            cleanup();
                            resolve(false);
                        };
                        
                        const handleOutsideClick = (e) => {
                            if (e.target === confirmDialog) {
                                cleanup();
                                resolve(false);
                            }
                        };
                        
                        // 清理事件监听器
                        const cleanup = () => {
                            confirmDialog.style.display = 'none';
                            confirmBtn.removeEventListener('click', handleConfirm);
                            cancelBtn.removeEventListener('click', handleCancel);
                            confirmDialog.removeEventListener('click', handleOutsideClick);
                        };
                        
                        confirmBtn.addEventListener('click', handleConfirm);
                        cancelBtn.addEventListener('click', handleCancel);
                        confirmDialog.addEventListener('click', handleOutsideClick);
                    });
                    
                    // 等待用户选择
                    userChoice.then(confirmed => {
                        if (confirmed) {
                            try {
                                fetch(`/delete/${file.id}`, {
                                    method: 'DELETE'
                                }).then(response => {
                                    if (response.ok) {
                                        item.remove();
                                    } else {
                                        alert('删除文件失败');
                                    }
                                });
                            } catch (error) {
                                console.error('删除文件出错:', error);
                                alert('删除文件失败');
                            }
                        }
                    });
                });
            }

            // 添加下载按钮事件
            const downloadBtn = item.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (isMobile()) {
                    // 移动端保持原来的行为
                    window.open(`/download/${file.id}`, '_blank');
                } else {
                    // PC端使用download属性强制下载
                    const a = document.createElement('a');
                    a.href = `/download/${file.id}`;
                    a.download = file.name;  // 强制下载而不是打开
                    a.click();
                }
            });
        }

        return item;
    }

    // 添加检测移动设备的函数
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 处理文件上传
    function handleFileUpload(file) {
        try {
            // 创建传输项并添加到列表顶部
            const transferItem = createTransferItem({
                name: file.name,
                size: file.size,
                type: file.type
            });
            transferList.insertBefore(transferItem, transferList.firstChild);
            
            // 获取进度条和进度文本元素
            const progressBar = transferItem.querySelector('.progress');
            const progressText = transferItem.querySelector('.upload-progress');
            const speedText = transferItem.querySelector('.upload-speed');
            const remainingText = transferItem.querySelector('.upload-remaining');
            
            // 创建 FormData
            const formData = new FormData();
            formData.append('file', file);

            // 上传文件
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload', true);

            // 用于计算速度的变量
            let lastLoaded = 0;
            let lastTime = Date.now();
            const updateInterval = 1000; // 每秒更新一次速度

            // 进度处理
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = percentComplete + '%';
                    progressText.textContent = percentComplete + '%';

                    // 计算速度
                    const currentTime = Date.now();
                    const timeElapsed = (currentTime - lastTime) / 1000; // 转换为秒
                    if (timeElapsed >= 1) { // 每秒更新一次速度
                        const loaded = e.loaded - lastLoaded;
                        const speed = loaded / timeElapsed; // 字节/秒
                        speedText.textContent = formatSpeed(speed);

                        // 计算剩余时间
                        const remaining = e.total - e.loaded;
                        const remainingTime = remaining / speed; // 秒
                        remainingText.textContent = formatTime(remainingTime);

                        lastLoaded = e.loaded;
                        lastTime = currentTime;
                    }
                }
            };

            // 处理响应
            xhr.onload = function() {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    // 更新传输项
                    const newTransferItem = createTransferItem({
                        id: response.id,
                        name: response.name,
                        size: response.size,
                        type: response.type,
                        createdAt: response.createdAt,
                        downloadUrl: response.downloadUrl
                    }, false);
                    transferList.replaceChild(newTransferItem, transferItem);
                } else {
                    throw new Error('上传失败');
                }
            };

            xhr.onerror = function() {
                throw new Error('网络错误');
            };

            // 发送请求
            xhr.send(formData);

        } catch (error) {
            console.error('处理文件失败:', error);
            alert('处理文件失败: ' + error.message);
            // 移除传输项
            if (transferItem && transferItem.parentNode) {
                transferItem.parentNode.removeChild(transferItem);
            }
        }
    }

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleFileUpload(selectedFile);
            fileInput.value = ''; // 清空选择
        }
    });

    // 拖拽处理
    const dropZone = document.getElementById('dropZone');

    // 阻止默认拖拽行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // 拖拽效果
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener('dragenter', () => {
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
    });

    // 处理文件拖放
    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    });

    // 页面加载时获取已分享的文件列表
    function loadSharedFiles() {
        fetch('/shares')
            .then(response => response.json())
            .then(files => {
            // 按创建时间倒序排序
            files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // 保存正在上传的文件
            const uploadingItems = Array.from(transferList.children).filter(item => 
                item.querySelector('.upload-progress') !== null
            );
            
            // 清空现有列表
            transferList.innerHTML = '';
            
            // 恢复正在上传的文件
            uploadingItems.forEach(item => {
                transferList.appendChild(item);
            });
            
            // 添加其他文件
                for (const file of files) {
                    // 如果文件正在上传中，跳过
                    if (uploadingItems.some(item => item.dataset.id === file.id)) {
                        continue;
                    }
                    
                    const transferItem = createTransferItem({
                        id: file.id,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        createdAt: file.createdAt,
                        downloadUrl: `/preview/${file.id}`  // 预览用的URL
                    }, false);
                    transferList.appendChild(transferItem);
                }
            })
            .catch(error => {
                console.error('加载共享文件列表失败:', error);
        });
    }

    // 初始化
    function init() {
        try {
            // 初始化主题
            initTheme();
            
            // 获取服务器基础URL并生成二维码
            getServerIP().then(serverIP => {
                const serverBaseUrl = `http://${serverIP}:1112`;
                generateQRCode(serverBaseUrl);
            });

            // 加载已分享的文件列表
            loadSharedFiles();

            // 定期刷新文件列表
            setInterval(() => {
                loadSharedFiles();
            }, 3000);  // 每3秒刷新一次
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }    
    
    // 初始化应用
    init();

    // 格式化文件大小
    function formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const value = bytes / Math.pow(1024, i);
        return parseFloat(value.toFixed(2)) + ' ' + sizes[i];
    }

    // 格式化速度
    function formatSpeed(bytesPerSecond) {
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        let value = bytesPerSecond;
        let unitIndex = 0;
        
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        
        return Math.round(value) + ' ' + units[unitIndex];
    }

    // 格式化时间
    function formatTime(seconds) {
        if (seconds === Infinity || isNaN(seconds)) {
            return '计算中...';
        }

        if (seconds < 1) {
            return '即将完成';
        }        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        let timeStr = '';
        if (hours > 0) {
            timeStr += `${hours}小时`;
        }
        if (minutes > 0 || hours > 0) {
            timeStr += `${minutes}分`;
        }
        timeStr += `${secs}秒`;

        return `剩余${timeStr}`;
    }
}

// 当页面加载完成时启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}







