# 🖼️ 剧本缩略图智能选择 - 功能说明

## ✅ 功能已实现

已在剧本排行页面实现智能缩略图选择，优先使用用户上传的图片。

## 🎯 功能逻辑

### 选择优先级

```
1. 用户上传的图片（user_images）- 随机选择一张
   ↓ 如果没有
2. 自动生成的预览图（preview_image）
   ↓ 如果没有
3. 默认Logo图片（/static/logo.png）
```

## 🔧 技术实现

### 核心方法

```javascript
getScriptThumbnail(script) {
  // 1. 优先使用用户上传的图片（随机选择一张）
  if (script.user_images && script.user_images.length > 0) {
    const randomIndex = Math.floor(Math.random() * script.user_images.length)
    return script.user_images[randomIndex]
  }
  
  // 2. 没有用户上传图片，使用自动生成的预览图
  if (script.preview_image) {
    return script.preview_image
  }
  
  // 3. 都没有，使用默认图片
  return '/static/logo.png'
}
```

### 应用范围

**修改的榜单**：
- ✅ 📘 最新剧本
- ✅ 🔥 萌萌想玩热榜
- ✅ 🔍 近期推理剧本
- ✅ 🎉 近期娱乐剧本
- ✅ 🏆 萌萌推理高分榜
- ✅ 🏆 萌萌娱乐高分榜

**共6个榜单，所有缩略图都使用智能选择** ✅

## 📊 修改详情

### 文件修改

**文件**：`botc-miniprogram/pages/script/ranking/ranking.vue`

**修改内容**：
1. ✅ 新增方法：`getScriptThumbnail(script)`
2. ✅ 替换所有图片src：`:src="script.cover_image || '/static/logo.png'"` → `:src="getScriptThumbnail(script)"`

**修改位置**：
- 第33行：最新剧本
- 第66行：热门榜单
- 第96行：推理剧本
- 第128行：娱乐剧本
- 第159行：推理高分
- 第190行：娱乐高分

**代码统计**：
- 新增方法：+14行
- 修改图片引用：6处
- **总计：+14行**

## 🎨 显示效果

### 场景1：有用户上传图片

**数据**：
```json
{
  "title": "暗流涌动",
  "user_images": ["url1.jpg", "url2.jpg", "url3.jpg"],
  "preview_image": "data:image/svg+xml..."
}
```

**显示**：
- 📱 缩略图：随机显示 `url1.jpg`、`url2.jpg` 或 `url3.jpg` 中的一张
- 🎲 每次刷新可能不同（随机）
- ✅ 更生动、更真实

### 场景2：只有自动生成图片

**数据**：
```json
{
  "title": "银河漫步",
  "user_images": [],
  "preview_image": "data:image/svg+xml..."
}
```

**显示**：
- 📱 缩略图：自动生成的SVG预览图
- ✅ 统一、规范

### 场景3：都没有

**数据**：
```json
{
  "title": "神秘剧本",
  "user_images": [],
  "preview_image": null
}
```

**显示**：
- 📱 缩略图：默认Logo
- ✅ 有图可显示

## 💡 优势说明

### 1. 用户体验提升

**之前**：
- 只显示 `cover_image`（已废弃字段）
- 大部分剧本显示默认Logo
- 界面单调

**现在**：
- ✅ 优先显示用户上传的真实图片
- ✅ 随机选择增加趣味性
- ✅ 界面更生动丰富

### 2. 数据利用优化

**充分利用已有数据**：
- ✅ 用户上传的图片得到展示
- ✅ AI生成的预览图作为备选
- ✅ 多级降级策略

### 3. 随机性增加趣味

**每次刷新可能看到不同图片**：
- 如果剧本有3张用户图片
- 每次显示随机其中一张
- 增加新鲜感

## 📱 显示示例

### 热门榜单效果

```
🔥 萌萌想玩热榜

┌─────┐ ┌─────┐ ┌─────┐
│  1  │ │  2  │ │  3  │
│[图片]│ │[图片]│ │[图片]│  ← 随机用户图片
│暗流  │ │银河  │ │神秘  │
│⭐4.5 │ │⭐4.3 │ │⭐4.7 │
└─────┘ └─────┘ └─────┘
```

**图片来源**：
- 暗流涌动：用户上传图片1/2/3之一（随机）
- 银河漫步：自动生成SVG
- 神秘剧本：默认Logo

## 🔍 图片选择逻辑示例

### 示例1：多张用户图片

```javascript
script = {
  user_images: ["img1.jpg", "img2.jpg", "img3.jpg"]
}

// 调用 getScriptThumbnail(script)
// 第1次刷新：可能返回 "img2.jpg"
// 第2次刷新：可能返回 "img1.jpg"  
// 第3次刷新：可能返回 "img3.jpg"
// 随机选择，增加趣味性
```

### 示例2：单张用户图片

```javascript
script = {
  user_images: ["img1.jpg"]
}

// 调用 getScriptThumbnail(script)
// 总是返回 "img1.jpg"
```

### 示例3：降级到AI图片

```javascript
script = {
  user_images: [],
  preview_image: "data:image/svg+xml;base64,..."
}

// 调用 getScriptThumbnail(script)
// 返回 preview_image（AI生成的SVG）
```

## 🧪 测试场景

### 测试1：有用户上传图片的剧本

1. 数据库中添加测试数据：
```javascript
db.collection('botc-scripts')
  .doc('剧本ID')
  .update({
    user_images: [
      'https://picsum.photos/400/400?random=1',
      'https://picsum.photos/400/400?random=2',
      'https://picsum.photos/400/400?random=3'
    ]
  })
```

2. 刷新排行页面
3. 查看该剧本的缩略图
4. 多次刷新，观察是否随机切换

**预期**：
- ✅ 显示用户上传的图片
- ✅ 每次刷新可能显示不同的图片

### 测试2：只有AI预览图的剧本

1. 数据库数据：
```javascript
{
  user_images: [],
  preview_image: "data:image/svg+xml;base64,..."
}
```

2. 查看排行页面

**预期**：
- ✅ 显示AI生成的预览图
- ✅ SVG图片正常显示

### 测试3：都没有图片的剧本

1. 数据库数据：
```javascript
{
  user_images: [],
  preview_image: null
}
```

2. 查看排行页面

**预期**：
- ✅ 显示默认Logo
- ✅ 不会显示空白

## ✅ 完成清单

- [x] ✅ 添加 `getScriptThumbnail` 方法
- [x] ✅ 替换最新剧本的图片引用
- [x] ✅ 替换热门榜单的图片引用
- [x] ✅ 替换推理剧本的图片引用
- [x] ✅ 替换娱乐剧本的图片引用
- [x] ✅ 替换推理高分榜的图片引用
- [x] ✅ 替换娱乐高分榜的图片引用
- [x] ✅ 代码无linter错误

## 🎓 符合规范

- ✅ **spec-kit v2.0.0** - 代码规范
- ✅ **命名规范** - camelCase方法名
- ✅ **注释完整** - 清晰的功能说明
- ✅ **逻辑清晰** - 3级降级策略

## 🔮 后续优化方向

### 短期
- [ ] 添加图片缓存（避免每次随机）
- [ ] 支持按图片质量选择

### 中期
- [ ] 图片懒加载优化
- [ ] 添加占位图动画

### 长期
- [ ] AI智能选择最佳展示图片
- [ ] 图片CDN加速

## 📝 使用说明

### 开发者

如果想修改选择逻辑，编辑 `getScriptThumbnail` 方法即可。

**示例：固定选择第一张**
```javascript
getScriptThumbnail(script) {
  if (script.user_images && script.user_images.length > 0) {
    return script.user_images[0]  // 总是返回第一张
  }
  // ...
}
```

**示例：按质量排序后选择**
```javascript
getScriptThumbnail(script) {
  if (script.user_images && script.user_images.length > 0) {
    // 选择文件大小最大的（假设质量更好）
    return script.user_images.sort((a, b) => b.length - a.length)[0]
  }
  // ...
}
```

### 用户

无需任何操作，自动生效：
- 上传剧本时添加图片
- 排行榜自动使用用户图片
- 每次刷新可能看到不同图片

## 🎉 总结

### 核心改进

✅ **智能选择** - 优先用户图片，随机展示  
✅ **降级策略** - AI图片→默认图片  
✅ **随机趣味** - 每次刷新可能不同  
✅ **数据利用** - 充分展示上传内容  

### 修改范围

- **文件**：1个（ranking.vue）
- **方法**：+1个（getScriptThumbnail）
- **榜单**：6个（全部修改）
- **代码行数**：+14行

---

**功能完成时间**：2025-10-21  
**遵循规范**：spec-kit v2.0.0  
**代码质量**：0错误  
**状态**：✅ 已完成

**排行榜现在会优先显示用户上传的真实图片！** 🎉

