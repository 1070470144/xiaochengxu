# 🔍 点击下载按钮没有日志 - 排查指南

## 问题描述

点击"📥 普通下载"或"🖼️ 超高清"按钮后，控制台没有任何日志输出。

## 🎯 快速诊断步骤

### 步骤1：确认控制台已打开

**HBuilderX**：
1. 查看底部是否有"控制台"面板
2. 如果没有，点击菜单：视图 → 显示控制台
3. 或按快捷键：`Ctrl + Shift + Y`

**浏览器**：
1. 按 `F12` 打开开发者工具
2. 切换到"Console"标签
3. 确保控制台可见

### 步骤2：检查日志级别

1. 控制台顶部有过滤选项
2. 确保勾选了：
   - ✅ Verbose / All
   - ✅ Info
   - ✅ Log
   - ✅ Warning
   - ✅ Error
3. 不要只勾选"Errors"

### 步骤3：清空日志重试

1. 点击控制台的"🗑️ 清空"按钮
2. 刷新页面
3. 重新进入剧本详情页
4. 点击下载按钮
5. 立即查看控制台

### 步骤4：测试方法是否存在

在控制台手动输入：

```javascript
// 检查Vue实例
console.log('当前页面methods:', Object.keys(getCurrentPages()[getCurrentPages().length - 1].$vm))
```

应该能看到 `downloadPreviewNormal` 和 `downloadPreviewHD` 方法

## 🧪 诊断测试

### 测试1：按钮是否可点击

打开剧本详情页后，在控制台输入：

```javascript
// 手动触发下载方法
const currentPage = getCurrentPages()[getCurrentPages().length - 1]
if (currentPage.$vm.downloadPreviewNormal) {
  console.log('✅ downloadPreviewNormal 方法存在')
  currentPage.$vm.downloadPreviewNormal()
} else {
  console.log('❌ downloadPreviewNormal 方法不存在')
}
```

### 测试2：检查是否有预览图数据

```javascript
const currentPage = getCurrentPages()[getCurrentPages().length - 1]
console.log('剧本数据:', currentPage.$vm.scriptDetail)
console.log('预览图:', currentPage.$vm.scriptDetail?.preview_image ? '有' : '无')
```

### 测试3：检查按钮绑定

查看页面源码，确认按钮代码：

```vue
<button class="action-btn btn-download-normal" @click="downloadPreviewNormal">
  <text class="btn-icon">📥</text>
  <text class="btn-text">普通下载</text>
</button>
```

## 🔍 可能的原因

### 原因1：控制台未打开或被隐藏

**现象**：点击按钮有反应（显示loading），但看不到日志

**解决**：
- 确保控制台面板可见
- 检查控制台高度是否被拖到最小

### 原因2：日志被过滤

**现象**：其他日志可见，但下载日志不可见

**解决**：
- 检查控制台过滤器
- 清除所有过滤条件
- 选择"All Levels"

### 原因3：页面未正确加载

**现象**：按钮点击无反应，也无日志

**解决**：
- 刷新页面重试
- 重启HBuilderX
- 清除缓存后重试

### 原因4：方法未编译

**现象**：代码存在但方法不执行

**解决**：
- 保存文件
- 重新编译项目
- 重启运行

## ✅ 现在应该看到的日志

点击"📥 普通下载"后，应该立即看到：

```
=== 点击普通下载按钮 ===
剧本数据: 存在
预览图: 存在
✅ 开始下载流程
预览图格式: data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4w...
[保存图片] 开始，URL前缀: data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4w...
[保存图片] SVG格式，需要转换为PNG
[保存图片] SVG图片加载成功，尺寸: 800 x 600
[保存图片] 转换为PNG成功，大小: 234.56 KB
[保存图片] ✅ PNG已保存到相册
[保存图片] 💡 位置: 手机相册/图库
```

## 🆘 如果还是没有日志

### 立即检查清单

- [ ] HBuilderX控制台是否打开？
- [ ] 控制台是否有内容（任何内容）？
- [ ] 点击按钮是否有loading提示？
- [ ] 是否刷新了页面？
- [ ] 是否保存了代码文件？

### 请提供以下信息

1. **运行环境**：
   - [ ] HBuilderX运行到浏览器
   - [ ] HBuilderX运行到微信开发工具
   - [ ] 微信开发者工具直接运行
   - [ ] 真机预览

2. **控制台状态**：
   - [ ] 能看到其他页面的日志
   - [ ] 完全没有任何日志
   - [ ] 只是看不到下载相关日志

3. **点击反应**：
   - [ ] 点击有loading提示
   - [ ] 点击完全没反应
   - [ ] 点击后有错误提示

---

**请先按步骤1-3操作，然后告诉我看到了什么！** 🔍

