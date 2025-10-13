# json_data 字段类型修复

## 🐛 问题原因

```
数据库验证失败：["json_data"]类型无效
```

### **为什么会出错？**

```javascript
// Schema 定义（错误）：
{
  "json_data": {
    "bsonType": "object"  // ❌ 只允许对象
  }
}

// 官方剧本格式（数组）：
[
  { "id": "_meta", "name": "暗流涌动", ... },
  { "name": "调查员", "ability": "...", ... },
  { "name": "共情者", "ability": "...", ... }
  // ... 更多角色
]

// 冲突：
// Schema:  json_data 必须是 object！
// 数据：   json_data 是 array！
// 结果：   💥 验证失败
```

---

## ✅ 修复方案

**移除 `bsonType` 限制，允许任意类型（数组或对象）：**

```json
// 修复前：
{
  "json_data": {
    "bsonType": "object",  // ❌ 限制为对象
    "description": "剧本JSON内容"
  }
}

// 修复后：
{
  "json_data": {
    "description": "剧本JSON内容（可以是对象或数组）"  // ✅ 不限制类型
  }
}
```

---

## 🎯 已完成的修改

### **文件：`botc-scripts.schema.json`**

```diff
"json_data": {
- "bsonType": "object",
- "description": "剧本JSON内容"
+ "description": "剧本JSON内容（可以是对象或数组）"
}
```

这样就可以支持：
- ✅ 官方剧本（数组格式）
- ✅ 自定义剧本（对象格式）
- ✅ 任何其他JSON数据

---

## 🚀 现在必须重新上传Schema

### **关键步骤：** ⭐⭐⭐

```
1. 在 HBuilderX 中找到文件：
   botc-miniprogram/uniCloud-aliyun/database/botc-scripts.schema.json

2. 右键点击该文件

3. 选择："上传Schema扩展Js的配置"

4. 等待上传成功提示

5. 刷新浏览器页面（F5）

6. 再次尝试导入
```

---

## 📊 官方剧本 vs 自定义剧本

### **官方剧本（数组格式）：**

```json
[
  {
    "id": "_meta",
    "name": "暗流涌动",
    "author": "The Pandemonium Institute",
    "description": "...",
    "logo": "https://..."
  },
  { "name": "调查员", "team": "townsfolk", ... },
  { "name": "共情者", "team": "townsfolk", ... },
  { "name": "红唇女郎", "team": "minion", ... },
  { "name": "小恶魔", "team": "demon", ... }
]
```

### **自定义剧本（对象格式）：**

```json
{
  "title": "自定义剧本",
  "author": "作者名",
  "description": "剧本描述",
  "roles": [...]
}
```

### **现在都支持了！** ✅

---

## ⚠️ 重要提醒

**必须重新上传Schema，否则云端还是旧配置！**

```
本地修改 → 上传Schema → 云端生效 → 导入成功 ✅
     ↓           ↓            ↓
   完成 ✅     ⚠️ 待执行    等待中...
```

---

## 🎯 完整操作流程

### **步骤1：上传Schema** ⭐ 现在就做！

```
HBuilderX
→ botc-miniprogram/uniCloud-aliyun/database/botc-scripts.schema.json
→ 右键
→ 上传Schema扩展Js的配置
→ 等待"上传成功"
```

### **步骤2：刷新浏览器**

```
按 F5 刷新管理后台页面
```

### **步骤3：再次导入**

```
血染钟楼管理
→ 剧本管理
→ 📁 批量导入JSON
→ 📂 选择文件夹
→ 选择：官方已发行剧本
→ 开始导入
```

### **步骤4：查看结果**

```
✅ 成功：4
❌ 失败：0

列表自动刷新，显示4个剧本！
```

---

## 🔍 预期的导入结果

每个剧本的 `json_data` 字段会保存完整的原始JSON：

### **暗流涌动：**
```json
{
  "json_data": [
    { "id": "_meta", "name": "暗流涌动", ... },
    { "name": "乞丐", "team": "traveler", ... },
    { "name": "替罪羊", "team": "traveler", ... },
    // ... 更多角色
  ]
}
```

### **无上愉悦：**
```json
{
  "json_data": [
    { "id": "_meta", "name": "无上愉悦", ... },
    { "name": "调查员", "team": "townsfolk", ... },
    { "name": "共情者", "team": "townsfolk", ... },
    // ... 更多角色
  ]
}
```

---

## ✨ 修复总结

### **遇到的3个问题：**

1. ❌ `creator_id` 必填
   - ✅ 修改Schema，移除必填限制
   
2. ❌ `created_at` 不与默认值匹配
   - ✅ 移除手动赋值，让数据库自动填充
   
3. ❌ `json_data` 类型无效
   - ✅ 移除类型限制，支持数组和对象

### **核心原因：**
```
Schema定义太严格，不适配官方剧本格式
```

### **解决思路：**
```
放宽限制，兼容多种数据格式
```

---

**现在请立即上传Schema，然后刷新页面重新导入！** 🚀

这应该是最后一个问题了！

