# ✅ 批量导入预览图同步

## 🔄 更新内容

### 已同步的优化
批量导入功能的预览生成器已更新到最新版本，包含所有优化：

#### 1. **布局优化**
- ✅ 左右列间距收缩（280px位置）
- ✅ 角色logo缩小到22px
- ✅ 行高增加到50px

#### 2. **文字显示优化**
- ✅ 角色名称字体增大（11px）
- ✅ 技能描述字体增大（8px）
- ✅ 左右列宽度统一（135px，17字符）
- ✅ 删除省略号

#### 3. **夜晚行动顺序**
- ✅ 右侧位置左移（X=475）
- ✅ Logo缩小（18px）
- ✅ 间距调整

---

## 📁 更新的文件

### 批量导入云函数
```
botc-admin/uniCloud-aliyun/cloudfunctions/script-batch-import/
├── index.js (无需修改，已正确调用)
└── preview-generator.js ✅ 已更新到最新版本
```

### 单个添加云函数
```
botc-admin/uniCloud-aliyun/cloudfunctions/script-generate-preview/
├── index.js
└── preview-generator.js ✅ 最新版本
```

---

## 🎯 功能一致性

### 批量导入流程
```javascript
// script-batch-import/index.js
for (const script of scripts) {
  // 1. 解析JSON数据
  let parsedJson = script.json_data
  
  // 2. 生成预览图（使用最新的preview-generator）
  const svgContent = generateScriptPreviewSVG({
    title: script.title,
    author: script.author,
    json: parsedJson
  })
  
  // 3. 转换为base64
  const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64')
  script.preview_image = `data:image/svg+xml;base64,${svgBase64}`
  
  // 4. 插入数据库
  await db.collection('botc-scripts').add(script)
}
```

### 单个添加流程
```javascript
// script-generate-preview/index.js
// 生成预览图（使用相同的preview-generator）
const svgContent = generateScriptPreviewSVG({
  title: scriptData.title,
  author: scriptData.author,
  json: scriptData.json
})

// 上传到云存储
const fileID = await uploadToCloudStorage(svgContent, filename)
```

---

## 📊 预览图参数对照

### 统一的布局参数
| 参数 | 值 | 说明 |
|------|-----|------|
| SVG宽度 | 520px | 固定宽度 |
| 标题宽度 | 360px | 队伍标题 |
| 左列位置 | X=90 | Logo中心 |
| 右列位置 | X=280 | Logo中心 |
| 列间距 | 190px | 280-90 |
| 行高 | 50px | 角色行间距 |

### 统一的文字参数
| 元素 | 字体 | 宽度 | 字符数 |
|------|------|------|--------|
| 角色名称 | 11px粗体 | - | - |
| 技能描述 | 8px常规 | 135px | 17字符 |
| 显示行数 | - | - | 3行 |

---

## 🧪 测试验证

### 批量导入测试
```bash
1. 进入管理后台
2. 点击"批量导入"
3. 上传包含多个剧本的JSON文件
4. 等待导入完成
5. 查看生成的预览图
```

### 验证要点
- ✅ 左右列宽度一致
- ✅ 文字不超出标题
- ✅ 角色不重叠
- ✅ 夜晚行动在边框内
- ✅ 无省略号
- ✅ 布局美观

---

## 💡 优势

### 完全一致的体验
- ✅ **单个添加** = **批量导入**：预览图完全一致
- ✅ **统一的美观度**：所有剧本预览图风格统一
- ✅ **维护简单**：只需维护一个preview-generator.js
- ✅ **功能同步**：未来优化自动同步

---

## 📝 注意事项

### 上传云函数
```bash
批量导入功能需要上传两个云函数：
1. script-batch-import（批量导入逻辑）
2. script-generate-preview（单个生成逻辑）

右键云函数 → 上传部署
```

### 版本同步
```bash
如果修改了preview-generator.js，记得同步到两个位置：
1. script-generate-preview/preview-generator.js
2. script-batch-import/preview-generator.js
```

---

**✅ 批量导入已同步最新优化！现在上传云函数测试！** 🎉
