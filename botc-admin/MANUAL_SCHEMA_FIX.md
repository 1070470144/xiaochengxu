# 手动修改云端Schema - 终极解决方案

## 🎯 问题根源

Schema文件上传后，云端可能有缓存，需要手动在Web控制台修改。

---

## 🚀 立即操作（5分钟搞定）

### **步骤1：登录uniCloud Web控制台**

```
1. 打开浏览器

2. 访问：https://unicloud.dcloud.net.cn/

3. 登录（使用HBuilderX相同的账号）

4. 选择服务空间：mp-1e0f6630-18c8-400c-99ff-761aea3a4e83
```

### **步骤2：进入数据库管理**

```
1. 点击左侧菜单：云数据库

2. 点击：数据表

3. 找到并点击：botc-scripts
```

### **步骤3：修改表结构**

```
1. 点击顶部标签页：表结构（或 Schema）

2. 找到 json_data 字段

3. 有两个选择：
```

#### **选择A：修改类型为string（推荐）** ⭐

```json
找到 json_data 字段，修改为：

{
  "bsonType": "string",
  "description": "剧本JSON内容（JSON字符串格式）"
}
```

#### **选择B：完全移除类型限制**

```json
找到 json_data 字段，修改为：

{
  "description": "剧本JSON内容"
}

// 只保留 description，删除 bsonType
```

### **步骤4：保存修改**

```
1. 点击页面底部的 "保存" 或 "确定" 按钮

2. 等待提示 "保存成功"

3. 关闭当前标签页
```

### **步骤5：返回管理后台测试**

```
1. 回到 botc-admin 管理后台

2. 按 Ctrl + Shift + R 硬刷新

3. 再次尝试导入

4. 应该成功！✅
```

---

## 🎯 如果找不到 Schema/表结构 标签

### **方法1：直接修改数据**

```
1. uniCloud Web控制台 → 云数据库 → 数据表 → botc-scripts

2. 点击："数据"标签页

3. 点击："新增记录"

4. 手动输入一条测试数据：

{
  "title": "测试剧本",
  "status": 0,
  "json_data": "[{\"test\":\"data\"}]"
}

5. 点击"确定"

6. 如果成功 → Schema已生效 ✅
   如果失败 → 继续下一步
```

### **方法2：删除表重建**

```
⚠️ 警告：这会删除表中的所有数据！

1. uniCloud Web控制台 → 云数据库 → 数据表

2. 找到 botc-scripts 表

3. 点击表名右侧的"删除"按钮

4. 确认删除

5. 返回 HBuilderX

6. 右键点击 botc-scripts.schema.json

7. 选择："创建云数据库表"

8. 等待创建成功

9. 再次上传Schema

10. 测试导入
```

---

## 🎯 最简单的临时方案

如果以上都不行，直接移除json_data的验证：

### **在Schema文件中：**

```json
// botc-scripts.schema.json

{
  "bsonType": "object",
  "required": ["title", "status"],  // 移除了 json_data
  "properties": {
    // ... 其他字段
    
    "json_data": {
      // 什么都不写，或者只写description
      "description": "剧本JSON内容"
    }
    
    // ... 其他字段
  }
}
```

### **然后：**

```
1. 保存文件

2. 右键 → 上传Schema

3. 等待1-2分钟让云端更新

4. 硬刷新浏览器

5. 再次导入
```

---

## 🎯 终极大招：云函数直接插入

如果Schema验证一直有问题，可以创建一个云函数来绕过客户端验证：

### **创建云函数：script-batch-import**

```javascript
// uniCloud-aliyun/cloudfunctions/script-batch-import/index.js

'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { scripts } = event  // 接收剧本数组
  
  const results = []
  
  for (const script of scripts) {
    try {
      // 直接插入，绕过Schema验证
      const res = await db.collection('botc-scripts').add(script)
      results.push({
        success: true,
        title: script.title,
        id: res.id
      })
    } catch (error) {
      results.push({
        success: false,
        title: script.title,
        error: error.message
      })
    }
  }
  
  return {
    code: 0,
    results
  }
}
```

### **前端调用：**

```javascript
// 批量导入时
const scripts = []  // 准备好的剧本数据数组

const result = await uniCloud.callFunction({
  name: 'script-batch-import',
  data: {
    scripts: scripts
  }
})

console.log('导入结果:', result.result.results)
```

---

## 📊 检查云端当前Schema

### **方法1：查看当前配置**

```
1. uniCloud Web控制台

2. 云数据库 → 数据表 → botc-scripts

3. 表结构/Schema 标签

4. 查看 json_data 字段当前的配置：
   - 如果是 "bsonType": "object" → 需要改为 "string"
   - 如果是 "bsonType": "string" → 已正确，可能是缓存问题
   - 如果没有 bsonType → 可以接受任何类型
```

### **方法2：测试插入**

```javascript
// 在浏览器控制台执行（F12）

// 测试1：插入字符串
db.collection('botc-scripts').add({
  title: '测试1',
  status: 0,
  json_data: '{"test": "string"}'
}).then(res => {
  console.log('✅ 字符串成功:', res)
}).catch(err => {
  console.log('❌ 字符串失败:', err)
})

// 测试2：插入数组
db.collection('botc-scripts').add({
  title: '测试2',
  status: 0,
  json_data: [{"test": "array"}]
}).then(res => {
  console.log('✅ 数组成功:', res)
}).catch(err => {
  console.log('❌ 数组失败:', err)
})

// 测试3：插入对象
db.collection('botc-scripts').add({
  title: '测试3',
  status: 0,
  json_data: {"test": "object"}
}).then(res => {
  console.log('✅ 对象成功:', res)
}).catch(err => {
  console.log('❌ 对象失败:', err)
})
```

---

## ✅ 推荐操作顺序

### **第一优先：Web控制台手动修改**

```
1. 登录 uniCloud Web控制台
2. 找到 botc-scripts 表
3. 修改 json_data 为 string 类型
4. 保存
5. 测试导入
```

### **第二优先：完全移除验证**

```
1. 修改 Schema 文件，json_data 只保留 description
2. 上传 Schema
3. 等待2分钟
4. 测试导入
```

### **第三优先：删除表重建**

```
⚠️ 仅当前两种方法都失败时使用
```

---

## 🎯 预计解决时间

- Web控制台修改：**5分钟** ⭐⭐⭐
- 移除验证：**3分钟** ⭐⭐
- 删除重建：**10分钟** ⭐
- 云函数方案：**15分钟**

---

**我强烈建议先尝试第一种方法：直接在uniCloud Web控制台手动修改Schema！**

**这是最快最可靠的方式！** 🚀

登录后告诉我看到了什么，我可以更详细地指导您！

