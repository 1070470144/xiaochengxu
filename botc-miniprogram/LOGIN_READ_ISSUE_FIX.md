# 登录后无法读取剧本数据 - 修复指南

## 🐛 问题现象

```
未登录状态：✅ 可以看到剧本
登录后：❌ 看不到剧本
```

## 🎯 问题原因

可能的原因：
1. 数据库 Schema 权限配置未生效
2. 登录后触发了额外的权限验证
3. uni-id 配置问题

---

## ✅ 解决方案（3种）

### **方案1：在云端手动设置权限（推荐）** ⭐

```
1. 登录 uniCloud Web 控制台
   https://unicloud.dcloud.net.cn/

2. 选择服务空间：mp-1e0f6630-18c8-400c-99ff-761aea3a4e83

3. 点击：云数据库 → 数据表 → botc-scripts

4. 点击：表结构 或 Schema 标签

5. 找到 permission 部分，确认配置：
   {
     "permission": {
       "read": true,           // ✅ 所有人都可以读
       "create": "auth.uid != null",
       "update": "auth.uid == doc.creator_id",
       "delete": "auth.uid == doc.creator_id"
     }
   }

6. 如果不是 true，改为 true

7. 点击"保存"

8. 刷新小程序测试
```

---

### **方案2：重新上传Schema并重启**

```
1. 在 HBuilderX 中找到：
   botc-miniprogram/uniCloud-aliyun/database/botc-scripts.schema.json

2. 右键点击

3. 选择："上传Schema扩展Js的配置"

4. 等待"上传成功"

5. 完全关闭 HBuilderX

6. 重新打开 HBuilderX

7. 重新运行 botc-miniprogram 项目

8. 登录测试
```

---

### **方案3：使用 JQL 查询绕过权限检查**

修改小程序端的查询方式：

```javascript
// 原来的方式（可能受权限限制）
const res = await db.collection('botc-scripts')
  .where({ status: 1 })
  .get()

// 改为 JQL 查询（管理员权限）
const res = await uniCloud.callFunction({
  name: 'script-list',
  data: {
    status: 1,
    pageSize: 10,
    pageNum: 1
  }
})
```

---

## 🔍 诊断步骤

### **步骤1：检查实际权限**

在小程序端控制台执行：

```javascript
// 测试未登录读取
db.collection('botc-scripts').where({ status: 1 }).limit(1).get()
  .then(res => console.log('未登录读取：', res))
  .catch(err => console.error('未登录读取失败：', err))

// 测试登录后读取
// （先登录）
db.collection('botc-scripts').where({ status: 1 }).limit(1).get()
  .then(res => console.log('登录后读取：', res))
  .catch(err => console.error('登录后读取失败：', err))
```

### **步骤2：查看错误信息**

```
1. 按 F12 打开控制台

2. 登录

3. 尝试查看剧本列表

4. 查看控制台的错误信息

5. 复制错误信息
```

常见错误：
- `permission denied` - 权限被拒绝
- `Invalid uni-id config` - uni-id 配置错误
- `auth.uid is undefined` - 用户ID获取失败

---

## 🎯 临时解决方案

### **禁用 uni-id 的权限检查（仅测试用）**

在查询时添加 `skipPermission`：

```javascript
const res = await db.collection('botc-scripts')
  .where({ status: 1 })
  .get({
    getOne: false,
    getCount: false,
    skipPermission: true  // ⚠️ 跳过权限检查（仅测试用）
  })
```

---

## 📊 权限配置说明

### **当前配置：**

```json
{
  "permission": {
    "read": true,  // ✅ 任何人都可以读取
    "create": "auth.uid != null",  // 登录用户可以创建
    "update": "auth.uid == doc.creator_id",  // 只有创建者可以更新
    "delete": "auth.uid == doc.creator_id"   // 只有创建者可以删除
  }
}
```

### **read: true 的含义：**

```
未登录用户：✅ 可以读取
登录用户：✅ 可以读取
任何人：✅ 都可以读取
```

如果设置为 `"read": "auth.uid != null"`，则：
```
未登录用户：❌ 不能读取
登录用户：✅ 可以读取
```

---

## ⚡ 快速测试

### **测试1：检查 Schema 是否生效**

在 uniCloud Web 控制台执行：

```javascript
// 直接在数据库中查询
db.collection('botc-scripts')
  .where({ status: 1 })
  .limit(1)
  .get()
```

如果能查询到数据，说明数据本身没问题。

### **测试2：检查登录状态**

在小程序控制台执行：

```javascript
// 查看当前登录状态
console.log('Token:', uni.getStorageSync('uni_id_token'))
console.log('User Info:', uni.getStorageSync('uni-id-pages-userInfo'))
```

---

## 🆘 如果都不行

提供以下信息：

1. **控制台完整错误信息**
2. **数据库中剧本的实际数据**（截图）
3. **uniCloud Web 控制台的 Schema 配置**（截图）
4. **登录用户的 token 信息**

---

## ✅ 最可能的解决方案

**直接在 uniCloud Web 控制台修改 botc-scripts 表的权限：**

```
1. 登录 uniCloud Web 控制台
2. 云数据库 → botc-scripts → 表结构
3. 找到 permission.read
4. 改为 true
5. 保存
6. 刷新小程序测试
```

**这是最直接、最有效的方式！** 🚀

