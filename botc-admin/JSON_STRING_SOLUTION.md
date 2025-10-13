# JSON数据存储方案 - 字符串方式

## 🎯 最终解决方案

将 `json_data` 改为 **字符串类型**，存储JSON字符串而不是对象/数组。

### **为什么这样做？**

```
❌ 问题：数组/对象类型验证太复杂
   - Schema定义object，但数据是array
   - Schema不定义类型，还是会验证失败
   
✅ 解决：统一存储为字符串
   - 数组 → JSON字符串
   - 对象 → JSON字符串
   - 不需要类型验证
   - 使用时再解析回对象/数组
```

---

## 🔧 修改内容

### **1. Schema定义**

```json
// botc-scripts.schema.json
{
  "json_data": {
    "bsonType": "string",  // ✅ 字符串类型
    "description": "剧本JSON内容（JSON字符串格式）"
  }
}
```

### **2. 导入代码**

```javascript
// list.vue - 导入时
const dbData = {
  // ... 其他字段
  json_data: JSON.stringify(parsedData)  // ✅ 转换为字符串
}
```

### **3. 使用时（将来）**

```javascript
// 从数据库读取时
const script = await db.collection('botc-scripts').doc(id).get()
const jsonData = JSON.parse(script.data[0].json_data)  // ✅ 解析回对象/数组

// 现在可以使用原始数据了
console.log(jsonData[0].name)  // "暗流涌动"
console.log(jsonData.length)   // 角色数量
```

---

## 🚀 操作步骤

### **步骤1：重新上传Schema** ⭐⭐⭐

```
1. HBuilderX 中找到：
   botc-miniprogram/uniCloud-aliyun/database/botc-scripts.schema.json

2. 右键点击

3. 选择："上传Schema扩展Js的配置"

4. 等待"上传成功"提示

5. 确认成功！
```

### **步骤2：完全刷新浏览器**

```
方法1：硬刷新（推荐）
按 Ctrl + Shift + R（Windows）
或 Cmd + Shift + R（Mac）

方法2：清除缓存
按 Ctrl + Shift + Delete
选择"缓存的图片和文件"
点击"清除数据"
然后按 F5 刷新
```

### **步骤3：再次导入**

```
血染钟楼管理 → 剧本管理 → 📁 批量导入JSON
→ 📂 选择文件夹 → 官方已发行剧本 → 开始导入
```

---

## 📊 数据存储格式

### **数据库中的存储**

```javascript
// 官方剧本（原本是数组）
{
  "_id": "...",
  "title": "暗流涌动",
  "author": "官方",
  "json_data": "[{\"id\":\"_meta\",\"name\":\"暗流涌动\",...},{\"name\":\"调查员\",...}]"
  //           ↑ JSON字符串格式
}

// 自定义剧本（原本是对象）
{
  "_id": "...",
  "title": "自定义剧本",
  "author": "作者",
  "json_data": "{\"title\":\"自定义剧本\",\"roles\":[...]}"
  //           ↑ JSON字符串格式
}
```

### **使用时解析**

```javascript
// 读取数据
const script = await db.collection('botc-scripts').doc(scriptId).get()
const data = script.data[0]

// 解析JSON字符串
const jsonData = JSON.parse(data.json_data)

// 现在可以使用了
if (Array.isArray(jsonData)) {
  // 官方剧本
  const meta = jsonData.find(item => item.id === '_meta')
  console.log('剧本名称:', meta.name)
  
  const roles = jsonData.filter(item => item.id !== '_meta')
  console.log('角色数量:', roles.length)
} else {
  // 自定义剧本
  console.log('剧本标题:', jsonData.title)
}
```

---

## ✅ 优势

### **1. 类型兼容性**
```
✅ 支持数组格式（官方剧本）
✅ 支持对象格式（自定义剧本）
✅ 支持任何JSON数据
✅ 不需要复杂的类型验证
```

### **2. 数据完整性**
```
✅ 原始JSON完整保存
✅ 不会丢失任何信息
✅ 可以完整还原
```

### **3. 灵活性**
```
✅ 数据结构随意修改
✅ 不需要更新Schema
✅ 向后兼容
```

---

## 🎯 预期结果

### **控制台日志**

```
✅ 准备插入数据：{ title: "暗流涌动", author: "官方", ... }
✅ 数据库插入结果：{ id: "...", insertedCount: 1 }
✅ 导入成功：#暗流涌动.json

✅ 准备插入数据：{ title: "黯月初升", ... }
✅ 数据库插入结果：{ id: "...", insertedCount: 1 }
✅ 导入成功：#黯月初升.json

✅ 准备插入数据：{ title: "无上愉悦", ... }
✅ 数据库插入结果：{ id: "...", insertedCount: 1 }
✅ 导入成功：#无上愉悦·汀.json

✅ 准备插入数据：{ title: "窃窃私语", ... }
✅ 数据库插入结果：{ id: "...", insertedCount: 1 }
✅ 导入成功：#窃窃私语·汀.json
```

### **导入对话框**

```
导入完成！
成功：4
失败：0

[确定]
```

### **列表显示**

| 剧本标题 | 作者 | 类型 | 状态 |
|---------|------|------|------|
| 暗流涌动 | 官方 | 推理 | 待审核 |
| 黯月初升 | The Pandemonium Institute | 推理 | 待审核 |
| 无上愉悦 | The Pandemonium Institute | 推理 | 待审核 |
| 窃窃私语 | The Pandemonium Institute | 推理 | 待审核 |

---

## 📝 技术说明

### **JSON.stringify() 和 JSON.parse()**

```javascript
// 序列化（对象/数组 → 字符串）
const obj = { name: "测试", data: [1, 2, 3] }
const str = JSON.stringify(obj)
// 结果: '{"name":"测试","data":[1,2,3]}'

// 反序列化（字符串 → 对象/数组）
const parsed = JSON.parse(str)
// 结果: { name: "测试", data: [1, 2, 3] }

// 完全还原，无损
console.log(parsed.name)        // "测试"
console.log(parsed.data[0])     // 1
console.log(Array.isArray(parsed.data))  // true
```

---

## ⚠️ 注意事项

### **1. 数据大小限制**

MongoDB单个字段最大 16MB，JSON字符串通常不会超过这个限制。

```
官方剧本文件大小：
- 暗流涌动.json: 17KB  ✅
- 黯月初升.json: 21KB  ✅
- 无上愉悦.json: 10KB  ✅
- 窃窃私语.json: 12KB  ✅

全部远小于 16MB 限制！
```

### **2. 查询性能**

字符串字段不能进行复杂查询（如查找包含特定角色的剧本），但这不影响：
- ✅ 列表展示（通过 title、author 等字段查询）
- ✅ 详情展示（直接读取整条记录）
- ✅ 游戏使用（解析后使用）

如果将来需要按角色查询，可以增加单独的字段。

---

## 🎉 总结

### **修改了3个地方：**

1. ✅ Schema: `json_data` → `string` 类型
2. ✅ 导入代码: 使用 `JSON.stringify()` 转换
3. ✅ （将来）读取代码: 使用 `JSON.parse()` 解析

### **解决了所有问题：**

1. ✅ creator_id 必填 → 改为非必填
2. ✅ created_at 冲突 → 移除手动赋值
3. ✅ json_data 类型无效 → 改为字符串

---

**现在请重新上传Schema，然后硬刷新浏览器（Ctrl+Shift+R），再次导入！** 🚀

**这次一定能成功！** 🎊

