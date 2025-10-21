# 🐛 用户图片显示问题调试指南

## 🔍 问题描述

管理端上传了3张图片，但在预览时看不到。

---

## 📋 调试步骤

### 步骤1：检查图片是否上传成功

#### 1.1 查看上传日志
```
在添加剧本页面：
1. 打开浏览器控制台（F12）
2. 选择3张图片
3. 查看控制台输出：

应该看到：
✅ 选择用户图片： {...}
✅ 上传图片 1/3: xxx.jpg
✅ 上传进度: {...}
✅ 图片 1 上传成功: https://...
✅ 上传图片 2/3: xxx.png
...
✅ 成功上传3张图片（Toast提示）
```

#### 1.2 检查云存储
```
uniCloud控制台 → 云存储 → script-images 目录
✅ 应该看到3个图片文件
```

---

### 步骤2：检查保存时的数据

#### 2.1 查看保存日志
```
点击「保存」按钮后，查看控制台：

应该看到：
准备保存的数据： {
  title: "xxx",
  hasPreviewImage: true,
  userImagesCount: 3,
  userImages: [
    "https://xxx.cdn.bspapp.com/...",
    "https://xxx.cdn.bspapp.com/...",
    "https://xxx.cdn.bspapp.com/..."
  ]
}
```

#### 2.2 如果 userImagesCount 是 0
**问题**：图片上传成功但没有保存到 formData

**检查**：
```javascript
// 在 handleUserImagesSelect 方法中
console.log('this.formData.user_images:', this.formData.user_images)
```

---

### 步骤3：检查数据库中的数据

#### 3.1 查看数据库记录
```
uniCloud控制台 → 云数据库 → botc-scripts
找到刚保存的剧本
查看字段：

✅ user_images: [...] （应该是数组，包含3个URL）
✅ preview_image: "data:image/svg+xml;base64,..." （应该有值）
```

#### 3.2 如果 user_images 不存在或为空
**原因**：保存时没有包含这个字段

**解决方案**：
1. 检查 formData.user_images 是否有值
2. 检查保存前的日志
3. 确认 Schema 已上传

---

### 步骤4：检查预览窗口的显示逻辑

#### 4.1 查看预览数据日志
```
点击「预览」按钮后，查看控制台：

应该看到：
预览剧本数据： {...}
preview_image: 存在
user_images: [...]
user_images长度: 3
```

#### 4.2 如果 user_images 显示为 undefined
**原因**：数据库查询时没有返回这个字段

**解决方案**：检查数据库中是否真的有这个字段

#### 4.3 如果 user_images 长度为 0
**原因**：数据库中 user_images 是空数组

**解决方案**：检查保存时是否正确赋值

---

### 步骤5：检查预览窗口的显示条件

#### 5.1 查看 computed 属性
```javascript
// 在预览窗口打开后，检查：
console.log('hasImages:', this.hasImages)
console.log('hasUserImages:', this.hasUserImages)
```

#### 5.2 如果都是 false
**原因**：previewData 中确实没有图片数据

---

## 🔧 快速修复方案

### 方案1：检查 Schema 是否上传

```bash
确认步骤：
1. 右键 botc-admin/uniCloud-aliyun/database/botc-scripts.schema.json
2. 选择「上传Schema」
3. 等待上传成功
4. 刷新页面重新测试
```

### 方案2：手动检查数据库

```bash
1. 登录 uniCloud Web控制台
2. 云数据库 → botc-scripts
3. 找到刚添加的剧本
4. 手动编辑，添加 user_images 字段：
   {
     "user_images": [
       "https://test.com/1.jpg",
       "https://test.com/2.jpg"
     ]
   }
5. 保存
6. 刷新管理后台，点击预览
7. 看是否能显示
```

### 方案3：检查 formData 初始化

确认 edit.vue 第208行有：
```javascript
user_images: [],
```

---

## 📝 完整测试流程

### 测试上传和预览：

```bash
1. 刷新管理后台
2. 进入「添加剧本」
3. 打开浏览器控制台（F12）
4. 上传JSON文件
5. 上传3张图片
6. 查看控制台日志：
   - 图片上传日志
   - formData.user_images 的值
7. 点击保存
8. 查看控制台日志：
   - "准备保存的数据"
   - userImagesCount 应该是 3
9. 保存成功后，进入剧本列表
10. 点击「预览」
11. 查看控制台日志：
    - "预览剧本数据"
    - user_images 的值
12. 查看预览窗口：
    - ✅ 应该看到图片
```

---

## 🎯 请按以下顺序检查

1. **先检查**：控制台有没有错误
2. **再检查**：图片是否上传到云存储
3. **然后检查**：保存日志中 userImagesCount 是多少
4. **最后检查**：数据库中 user_images 字段的值

---

## 📞 反馈信息

请告诉我以下信息：

1. **上传图片时**控制台输出了什么？
2. **点击保存时**「准备保存的数据」显示什么？
3. **点击预览时**控制台显示什么？
4. **数据库中** user_images 字段的值是什么？

这样我就能准确定位问题了！🔍

