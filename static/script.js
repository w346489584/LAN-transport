document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const transferList = document.getElementById('transferList');
    const pageUrl = document.getElementById('pageUrl');
    const copyUrl = document.getElementById('copyUrl');

    // 获取服务器IP地址
    async function getServerIP() {
        try {
            const response = await fetch('/ip');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('获取服务器IP失败:', error);
            return window.location.hostname;
        }
    }

    // 获取服务器基础URL
    const serverIP = await getServerIP();
    const serverBaseUrl = `http://${serverIP}:1112`;

    // 生成二维码
    function generateQRCode() {
        const url = serverBaseUrl;
        pageUrl.value = url;
        
        // 清除旧的二维码
        const qrcodeElement = document.getElementById('qrcode');
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
    }

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

    // 生成二维码
    generateQRCode();

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
        
        item.innerHTML = `
            <div class="transfer-info">
                <div class="filename">${file.name}</div>
                <div class="file-details">
                    <span class="file-time">${timeStr}</span>
                    <div class="file-details-right">
                        ${withProgress ? 
                            `<div class="transfer-status">
                                <span class="upload-status">
                                    <span class="upload-status-main">正在上传... <span class="upload-speed"></span></span>
                                    <span class="upload-status-sub"><span class="upload-progress">0%</span> <span class="upload-remaining"></span></span>
                                </span>
                            </div>` : 
                            `<div class="transfer-status">
                                <span class="delete-btn" style="display: none; color: red; margin-right: 10px; cursor: pointer">删除</span>
                                <a href="${file.downloadUrl}" target="_blank">点击下载</a> 
                                <span class="filesize">(${formatSize(file.size)})</span>
                            </div>`
                        }
                    </div>
                </div>
                ${withProgress ? '<div class="progress-bar"><div class="progress"></div></div>' : ''}
            </div>
        `;

        // 检查是否在移动设备上
        if (!withProgress && !isMobile()) {
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.style.display = 'inline';
            deleteBtn.addEventListener('click', async () => {
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
                const confirmed = await userChoice;
                if (confirmed) {
                    try {
                        const response = await fetch(`/delete/${file.id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            item.remove();
                        } else {
                            alert('删除文件失败');
                        }
                    } catch (error) {
                        console.error('删除文件出错:', error);
                        alert('删除文件失败');
                    }
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
    async function handleFileUpload(file) {
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
    fileInput.addEventListener('change', async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            await handleFileUpload(selectedFile);
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
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        });
    });

    // 处理文件拖放
    dropZone.addEventListener('drop', async (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    });

    // 页面加载时获取已分享的文件列表
    async function loadSharedFiles() {
        try {
            const response = await fetch('/shares');
            const files = await response.json();
            
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
            files.forEach(file => {
                // 如果文件正在上传中，跳过
                if (uploadingItems.some(item => item.dataset.id === file.id)) {
                    return;
                }
                
                const transferItem = createTransferItem({
                    id: file.id,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    createdAt: file.createdAt,
                    downloadUrl: `/download/${file.id}`
                }, false);
                transferList.appendChild(transferItem);
            });
        } catch (error) {
            console.error('加载共享文件列表失败:', error);
        }
    }

    // 定期刷新文件列表
    setInterval(loadSharedFiles, 3000);  // 每3秒刷新一次

    // 加载已分享的文件列表
    loadSharedFiles();

    // 格式化文件大小
    function formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
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
}); 