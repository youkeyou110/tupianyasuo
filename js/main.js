document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const compressionSettings = document.getElementById('compressionSettings');
    const previewArea = document.getElementById('previewArea');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const imageList = document.getElementById('imageList');
    const imageItems = document.getElementById('imageItems');
    const compressAllBtn = document.getElementById('compressAllBtn');

    let originalFile = null;
    let imageFiles = []; // 存储所有待处理的图片文件

    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 处理拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#2196f3';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.match('image.*'));
        if (files.length > 0) {
            handleMultipleImages(files);
        }
    });

    // 处理文件选择
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleMultipleImages(files);
        }
    });

    // 处理多图片上传
    function handleMultipleImages(files) {
        imageFiles = [...imageFiles, ...files];
        updateImageList();
        imageList.style.display = 'block';
        
        // 显示第一张图片的预览和压缩效果
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    }

    // 处理单张图片预览和压缩
    function handleImageUpload(file) {
        originalFile = file;
        
        // 显示原始图片大小
        originalSize.textContent = `大小：${formatFileSize(file.size)}`;
        
        // 预览原始图片
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            // 立即进行压缩预览
            compressImage(e.target.result, qualitySlider.value / 100)
                .then(blob => {
                    compressedPreview.src = URL.createObjectURL(blob);
                    compressedSize.textContent = `大小：${formatFileSize(blob.size)}`;
                });
        };
        reader.readAsDataURL(file);

        // 显示压缩设置和预览区域
        compressionSettings.style.display = 'block';
        previewArea.style.display = 'block';
    }

    // 更新图片列表显示
    function updateImageList() {
        imageItems.innerHTML = '';
        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'image-item';
                itemDiv.innerHTML = `
                    <img src="${e.target.result}" alt="预览图片">
                    <div class="item-info">
                        <div>${file.name}</div>
                        <div>大小：${formatFileSize(file.size)}</div>
                        <div class="progress-bar">
                            <div class="progress" style="width: 0%"></div>
                        </div>
                    </div>
                    <button class="remove-btn" data-index="${index}">×</button>
                `;
                imageItems.appendChild(itemDiv);

                // 添加点击预览功能
                itemDiv.querySelector('img').addEventListener('click', () => {
                    handleImageUpload(file);
                });

                // 添加删除按钮事件
                const removeBtn = itemDiv.querySelector('.remove-btn');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止触发图片预览
                    imageFiles.splice(index, 1);
                    updateImageList();
                    if (imageFiles.length === 0) {
                        imageList.style.display = 'none';
                        previewArea.style.display = 'none';
                        compressionSettings.style.display = 'none';
                    }
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // 压缩所有图片
    compressAllBtn.addEventListener('click', async () => {
        const quality = qualitySlider.value / 100;
        
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const progressBar = document.querySelectorAll('.progress')[i];
            
            // 更新进度条
            progressBar.style.width = '50%';
            
            // 压缩图片
            const compressedBlob = await compressImage(file, quality);
            
            // 触发下载
            const link = document.createElement('a');
            link.download = `compressed_${file.name}`;
            link.href = URL.createObjectURL(compressedBlob);
            link.click();
            
            // 完成进度条
            progressBar.style.width = '100%';
        }
    });

    // 压缩单张图片
    async function compressImage(file, quality) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(
                        (blob) => resolve(blob),
                        'image/jpeg',
                        quality
                    );
                };
            };
            reader.readAsDataURL(file);
        });
    }

    // 质量滑块变化时实时更新压缩预览
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        if (originalFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                compressImage(event.target.result, e.target.value / 100)
                    .then(blob => {
                        compressedPreview.src = URL.createObjectURL(blob);
                        compressedSize.textContent = `大小：${formatFileSize(blob.size)}`;
                    });
            };
            reader.readAsDataURL(originalFile);
        }
    });

    // 压缩图片（返回Promise<Blob>）
    async function compressImage(input, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = typeof input === 'string' ? input : URL.createObjectURL(input);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => resolve(blob),
                    'image/jpeg',
                    quality
                );
            };
        });
    }

    // 下载压缩后的图片
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `compressed_${originalFile.name}`;
        link.href = compressedPreview.src;
        link.click();
    });

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 