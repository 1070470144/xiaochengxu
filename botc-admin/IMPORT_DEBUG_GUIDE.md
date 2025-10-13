# 批量导入失败排查指南

## 🔍 第一步：查看详细错误信息

请按以下步骤查看导入失败的具体原因：

### **操作步骤：**

```
1. 在浏览器中按 F12 键打开开发者工具

2. 点击 "Console"（控制台）标签页

3. 清空之前的日志（点击 🚫 清空按钮）

4. 再次尝试导入：
   - 点击 "📁 批量导入JSON"
   - 选择文件夹
   - 点击 "开始导入"

5. 观察控制台输出的信息
```

---

## 📝 需要查看的关键信息

### **成功的日志应该是这样的：**

```
✅ 准备插入数据：{ title: "暗流涌动", author: "...", creator_id: "..." }
✅ 数据库插入结果：{ id: "...", ... }
✅ 导入成功：#暗流涌动.json { fileName: "...", title: "...", id: "..." }
```

### **失败的日志会显示错误：**

```
❌ 导入失败 #暗流涌动.json: [错误信息]
```

**常见错误类型：**

#### 错误1：creator_id 必填
```
Error: 上传者不能为空
或
Error: required field missing: creator_id
```
**解决方法：** 需要上传 Schema 到云端

#### 错误2：JSON解析错误
```
Error: Unexpected token
或
Error: Invalid JSON
```
**解决方法：** JSON文件格式问题

#### 错误3：权限错误
```
Error: Permission denied
或
Error: 没有权限
```
**解决方法：** 需要配置数据库权限

#### 错误4：字段类型错误
```
Error: Invalid type
或
Error: bsonType mismatch
```
**解决方法：** 数据类型不匹配

---

## 🎯 最可能的原因

根据您的情况，**99% 的可能性是因为 Schema 还没有上传到云端！**

### **为什么这么说？**

```
1. 修改了 botc-scripts.schema.json
   ↓
2. 将 creator_id 从 required 中移除
   ↓
3. 但是只修改了本地文件
   ↓
4. 云端数据库还是旧的配置
   ↓
5. 插入数据时云端检查：creator_id 必填！
   ↓
6. 插入失败 ❌
```

---

## ✅ 解决方案

### **方案1：上传Schema到云端（推荐）** ⭐⭐⭐

```
1. 在 HBuilderX 中找到文件：
   botc-miniprogram/uniCloud-aliyun/database/botc-scripts.schema.json

2. 右键点击该文件

3. 选择："上传Schema扩展Js的配置"

4. 等待上传成功提示

5. 重新运行 botc-admin 项目

6. 再次尝试导入
```

### **方案2：在代码中提供有效的creator_id**

```javascript
// 在导入前获取当前登录用户ID
const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
if (userInfo && userInfo._id) {
  // 有有效用户ID，可以导入
} else {
  // 没有有效用户ID，需要先登录
  uni.showToast({
    title: '请先登录',
    icon: 'none'
  })
}
```

### **方案3：手动修改云端Schema（不推荐）**

```
1. 登录 uniCloud Web 控制台
2. 进入云数据库
3. 找到 botc-scripts 表
4. 点击"表结构"
5. 手动编辑 required 字段
6. 移除 creator_id
7. 保存
```

---

## 🚀 推荐的完整操作流程

### **步骤1：查看错误（现在就做）**

```
F12 → Console → 再次导入 → 看错误信息
```

### **步骤2：上传Schema（最重要）**

```
HBuilderX → botc-scripts.schema.json → 右键 → 上传Schema
```

### **步骤3：重新运行项目**

```
停止 botc-admin → 重新运行 → 等待编译完成
```

### **步骤4：重新测试导入**

```
登录 → 剧本管理 → 批量导入 → 选择文件夹 → 开始导入
```

### **步骤5：确认成功**

```
导入完成 → 对话框显示"成功：4" → 列表自动刷新 → 看到4个新剧本 ✅
```

---

## 📸 请截图或复制以下信息

为了快速定位问题，请提供：

### **1. 控制台错误信息**
```
F12 → Console → 复制红色错误文字
```

### **2. Schema上传状态**
```
是否已经上传？
上传时有没有报错？
```

### **3. 导入结果对话框**
```
成功：0
失败：4
```

### **4. 当前登录状态**
```
是否已登录管理后台？
用户ID是什么？
```

---

## ⚡ 快速测试

### **测试1：Schema是否已上传**

```sql
-- 在 uniCloud Web 控制台执行查询
db.collection('botc-scripts').limit(1).get()

-- 如果返回空数组 [] → 正常，还没有数据
-- 如果返回错误 → 可能有Schema问题
```

### **测试2：手动插入一条测试数据**

```javascript
// 在控制台执行
db.collection('botc-scripts').add({
  title: '测试剧本',
  status: 0
})

// 如果成功 → Schema已生效，creator_id不是必填
// 如果失败，提示creator_id必填 → Schema还没生效
```

---

## 🎯 下一步

请先做以下操作，然后告诉我结果：

```
✅ 第1步：按 F12 打开控制台
✅ 第2步：再次尝试导入
✅ 第3步：截图或复制控制台的错误信息
✅ 第4步：告诉我具体的错误内容
```

**有了错误信息，我就能准确定位并解决问题！** 🎯

