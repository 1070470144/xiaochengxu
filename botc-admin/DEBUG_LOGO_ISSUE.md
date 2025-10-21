# 🔍 预览图Logo不显示问题调试

## 📋 调试步骤

### 步骤1：上传云函数并测试

```bash
1. 上传云函数：
   右键 script-batch-import → 上传部署
   或
   右键 script-generate-preview → 上传部署

2. 在管理后台添加剧本或批量导入

3. 查看云函数日志
```

---

### 步骤2：查看云函数日志

```bash
1. 登录 uniCloud Web控制台
2. 进入「云函数」
3. 找到 script-batch-import 或 script-generate-preview
4. 点击「日志」
5. 查找以下日志：
```

#### 关键日志信息

```
[预览图生成] townsfolk第一个角色: {
  name: "贵族",
  hasImage: true/false,  ← 重要！这个是true还是false？
  imageUrl: "https://...",  ← 重要！URL是什么？
  initial: "贵"
}

[预览图生成] 角色 贵族 使用图片logo: https://...
或
[预览图生成] 角色 贵族 使用首字母logo: 贵
```

---

## 🔍 可能的原因

### 原因1：JSON中没有image字段

**检查**：
```javascript
// 你的JSON中角色对象是否有image字段？
{
  "id": "noble",
  "name": "贵族",
  "image": "https://...",  ← 这个字段存在吗？
  "team": "townsfolk"
}
```

**结果**：
- 如果没有 `image` 字段 → `hasImage: false` → 显示首字母
- 如果有 `image` 字段 → `hasImage: true` → 应该显示图片

---

### 原因2：image URL无法访问

**现象**：
- SVG中有 `<image>` 标签
- 但图片不显示（加载失败）

**可能原因**：
- URL被墙或无法访问
- CORS跨域问题
- URL格式错误
- 图片已删除

**验证方法**：
```
复制image URL，在浏览器直接访问
看是否能正常显示图片
```

---

### 原因3：SVG渲染问题

**现象**：
- 日志显示使用图片logo
- 但SVG中图片不显示

**可能原因**：
- SVG的 `<image>` 标签在某些环境下可能不渲染外部URL
- base64编码的SVG中嵌入外部图片可能有限制

---

## 📊 定位流程

### 请按顺序检查：

#### 1. 查看云函数日志
```
hasImage 是 true 还是 false？
如果是 false → JSON中没有image字段
如果是 true → 继续检查
```

#### 2. 检查imageUrl
```
imageUrl 的值是什么？
复制URL在浏览器访问，能否看到图片？
```

#### 3. 检查SVG代码
```
查看生成的preview_image（base64）
解码后查看SVG源码
是否包含 <image href="..."> 标签？
```

#### 4. 测试SVG渲染
```
将preview_image的base64复制出来
在浏览器地址栏打开
查看是否显示图片logo
```

---

## 🎯 请提供以下信息

1. **云函数日志中显示什么？**
   ```
   hasImage: true 还是 false？
   imageUrl: 是什么地址？
   ```

2. **你的JSON中image字段是什么？**
   ```
   复制一个角色对象给我看
   ```

3. **浏览器直接访问image URL能否看到图片？**

4. **预览图中是显示空白，还是显示首字母？**
   - 空白 → 可能是图片加载问题
   - 首字母 → JSON中没有image字段

---

## 💡 快速测试方案

### 测试1：查看生成的SVG

```bash
1. 保存一个剧本
2. 在数据库中找到该剧本
3. 复制 preview_image 字段的值
4. 在浏览器地址栏粘贴
5. 查看生成的SVG：
   - 是否有图片logo显示？
   - 还是只有首字母？
```

---

**请先上传云函数，然后告诉我日志中显示的信息，我来帮你定位问题！** 🔍
