# ☁️ 图片上传到云存储功能

## ✅ 功能说明

管理端添加剧本时，用户上传的图片会自动上传到uniCloud云存储，并获取永久的HTTP访问地址。

---

## 🔄 上传流程

### 完整流程
```
管理员选择图片（本地文件）
    ↓
触发 handleUserImagesSelect 事件
    ↓
For 每张图片（最多3张）:
  ├─ 生成云存储路径
  ├─ 上传到云存储（uniCloud.uploadFile）
  ├─ 获取fileID
  ├─ 获取HTTP访问URL（getTempFileURL）
  └─ 添加到数组
    ↓
更新 formData.user_images = [url1, url2, url3]
    ↓
点击保存
    ↓
保存到数据库（永久URL）
```

---

## 📁 云存储路径

### 路径格式
```
script-images/{timestamp}-{random}.{ext}
```

### 示例
```
script-images/1729512000000-abc123.jpg
script-images/1729512000000-def456.png
script-images/1729512000000-ghi789.webp
```

### 特点
- ✅ 按时间戳命名（不重复）
- ✅ 随机字符串（防冲突）
- ✅ 保留原始扩展名
- ✅ 统一目录管理

---

## 🗄️ 数据库存储

### 存储格式
```javascript
{
  "user_images": [
    "https://xxx.cdn.bspapp.com/cloudstorage/script-images/1729512000000-abc123.jpg",
    "https://xxx.cdn.bspapp.com/cloudstorage/script-images/1729512000000-def456.png",
    "https://xxx.cdn.bspapp.com/cloudstorage/script-images/1729512000000-ghi789.webp"
  ]
}
```

### 对比

| 方式 | 临时地址 ❌ | 云存储URL ✅ |
|------|-----------|-------------|
| **格式** | file://... | https://... |
| **有效期** | 临时 | 永久 |
| **访问性** | 仅本地 | 全网可访问 |
| **数据库** | 不能保存 | 可以保存 |
| **用户端** | 无法访问 | 可以访问 |

---

## 💡 技术实现

### 上传代码（第323-391行）
```javascript
async handleUserImagesSelect(e) {
  const uploadedUrls = []
  
  for (let file of tempFiles) {
    // 1. 生成云存储路径
    const cloudPath = `script-images/${timestamp}-${random}.${ext}`
    
    // 2. 上传到云存储
    const uploadResult = await uniCloud.uploadFile({
      filePath: file.path,
      cloudPath: cloudPath
    })
    
    // 3. 获取HTTP访问URL
    const tempUrlRes = await uniCloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })
    
    // 4. 保存URL
    uploadedUrls.push(tempUrlRes.fileList[0].tempFileURL)
  }
  
  // 5. 更新到formData
  this.formData.user_images = uploadedUrls
}
```

---

## 🎯 用户体验优化

### 上传过程
1. **选择图片**：点击上传区域
2. **显示提示**：「⏳ 正在上传图片到云存储...」
3. **自动上传**：后台自动上传到云存储
4. **显示预览**：上传完成后显示缩略图
5. **保存数据**：点击保存时URL一起保存

### 进度提示
- 上传中：显示黄色提示文字
- 上传成功：Toast提示「成功上传X张图片」
- 上传失败：Toast提示错误信息

---

## 🧪 测试步骤

### 测试上传图片

```bash
1. 打开管理后台「添加剧本」
2. 上传JSON文件
3. 在「剧本图片」区域点击上传
4. 选择1-3张图片
5. 观察：
   ✅ 显示「⏳ 正在上传图片到云存储...」
   ✅ 上传完成后显示Toast
   ✅ 显示图片缩略图
6. 点击保存
7. 保存成功
```

### 验证云存储

```bash
1. 登录 uniCloud Web控制台
2. 进入「云存储」
3. 查看 script-images 目录
4. ✅ 应该看到刚上传的图片文件
```

### 验证数据库

```bash
1. 在 uniCloud 控制台
2. 进入「云数据库」
3. 查看 botc-scripts 集合
4. 找到刚保存的剧本
5. 查看 user_images 字段
6. ✅ 应该是HTTP URL数组，不是临时地址
```

### 验证预览

```bash
1. 在剧本列表点击「预览」
2. ✅ 应该看到用户上传的图片
3. 点击图片放大查看
4. ✅ 图片正常显示
```

---

## 💰 成本说明

### 云存储费用
- **免费额度**：前5GB免费
- **超出部分**：约¥0.0045/GB/天
- **流量费用**：按实际下载计费

### 预估成本
假设：
- 每张图片平均500KB
- 100个剧本 × 平均2张图片 = 200张
- 总大小：200 × 0.5MB = 100MB ≈ 0.1GB
- **成本**：基本免费（远低于5GB）

---

## ⚠️ 注意事项

### 1. 文件大小限制
- 单个文件默认最大100MB
- 建议图片压缩后上传（500KB-2MB）

### 2. 支持的格式
- ✅ JPG/JPEG
- ✅ PNG
- ✅ WEBP
- ✅ GIF

### 3. 删除图片
- 从列表中删除图片不会删除云存储文件
- 云存储文件会一直保留
- 如需清理，需要手动删除云存储文件

---

## 🔧 云存储权限配置

### 确保云存储权限正确

在 uniCloud 控制台：
```
云存储 → 权限设置

读取权限：公开（所有人可读）
写入权限：仅云函数（或认证用户）
```

---

## ✅ 完成清单

- [x] 实现图片上传到云存储
- [x] 获取永久HTTP URL
- [x] 保存URL数组到数据库
- [x] 显示上传进度提示
- [x] 显示上传成功提示
- [x] 错误处理
- [x] 图片预览功能
- [x] CSS样式优化

---

## 🎉 现在的完整功能

### 添加剧本时：
1. ✅ 上传JSON → 自动生成预览图（preview_image）
2. ✅ 上传1-3张图片 → 自动上传到云存储（user_images）
3. ✅ 点击保存 → 所有数据保存到数据库
4. ✅ 预览查看 → 显示所有图片

### 批量导入时：
1. ✅ 上传多个JSON → 每个都自动生成预览图
2. ✅ user_images为空（可后续编辑补充）

---

**功能版本**: v2.2.0  
**完成时间**: 2025年10月21日  
**状态**: ✅ 完成，图片上传到云存储并获取永久URL

