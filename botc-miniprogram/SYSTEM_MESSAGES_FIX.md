# 🔧 系统消息表错误修复

## ❌ 错误信息
```
Error: created_at不与默认值匹配
```

## 🎯 问题原因

`botc-system-messages` 表的 `created_at` 字段类型不匹配，可能原因：
1. 表中有旧数据，`created_at` 是数字类型
2. Schema期望 `timestamp` 类型，但实际数据是 `number`

## ✅ 解决方案

### 方案1：重新上传Schema（推荐）

```bash
1. 右键：botc-miniprogram/uniCloud-aliyun/database/botc-system-messages.schema.json
2. 选择：上传DB Schema
3. 等待上传成功
```

### 方案2：清空表数据（如果表中没有重要数据）

```bash
1. 打开 uniCloud web控制台
2. 进入：云数据库 → botc-system-messages
3. 点击"清空数据"
4. 重新上传Schema
```

### 方案3：修复现有数据（如果有重要数据）

在 uniCloud web控制台执行以下脚本：

```javascript
// 查询所有 created_at 为数字类型的记录
db.collection('botc-system-messages')
  .where({
    created_at: _.exists(true)
  })
  .get()
  .then(res => {
    console.log('找到记录数：', res.data.length)
    
    // 批量更新
    const promises = res.data.map(item => {
      if (typeof item.created_at === 'number') {
        return db.collection('botc-system-messages')
          .doc(item._id)
          .update({
            created_at: new Date(item.created_at)
          })
      }
    })
    
    return Promise.all(promises)
  })
  .then(() => {
    console.log('修复完成')
  })
```

---

## 🚀 快速修复步骤

### 步骤1：检查表是否存在数据

```bash
1. 打开 uniCloud web控制台
2. 云数据库 → botc-system-messages
3. 查看数据量
```

### 步骤2：根据情况选择方案

**如果表为空或数据不重要：**
```bash
→ 使用方案2：清空数据 + 重新上传Schema
```

**如果表有重要数据：**
```bash
→ 使用方案3：执行修复脚本
```

### 步骤3：验证修复

```bash
1. 刷新小程序
2. 进入个人中心
3. 查看是否还有错误
```

---

## 📋 正确的Schema配置

```json
{
  "created_at": {
    "bsonType": "timestamp",
    "description": "创建时间",
    "label": "创建时间",
    "forceDefaultValue": {
      "$env": "now"
    }
  }
}
```

**说明：**
- `bsonType: "timestamp"` - 时间戳类型
- `forceDefaultValue: { "$env": "now" }` - 自动使用当前时间

---

## 🔍 如何避免此问题

### 1. 创建数据时不要手动传 created_at

❌ **错误示例：**
```javascript
await db.collection('botc-system-messages').add({
  user_id: 'xxx',
  type: 'notice',
  title: '标题',
  content: '内容',
  created_at: Date.now() // ❌ 不要手动传
})
```

✅ **正确示例：**
```javascript
await db.collection('botc-system-messages').add({
  user_id: 'xxx',
  type: 'notice',
  title: '标题',
  content: '内容'
  // created_at 会自动生成
})
```

### 2. 使用云函数创建数据

如果需要在云函数中创建系统消息：

```javascript
// 云函数中
await db.collection('botc-system-messages').add({
  user_id: userId,
  type: 'warning',
  title: '警告通知',
  content: '您的内容因违规被删除',
  related_type: 'post',
  related_id: postId,
  is_read: false
  // created_at 会自动生成
})
```

---

## 🧪 测试验证

### 1. 创建测试消息

在 uniCloud web控制台执行：

```javascript
db.collection('botc-system-messages').add({
  user_id: '测试用户ID',
  type: 'system',
  title: '测试消息',
  content: '这是一条测试消息',
  is_read: false
})
```

### 2. 查询验证

```javascript
db.collection('botc-system-messages')
  .limit(1)
  .get()
  .then(res => {
    console.log('created_at 类型:', typeof res.data[0].created_at)
    console.log('created_at 值:', res.data[0].created_at)
  })
```

**期望结果：**
```
created_at 类型: object
created_at 值: Date对象
```

---

## 💡 临时解决方案

如果上述方案都不行，可以临时修改Schema，允许 `created_at` 为可选字段：

```json
{
  "created_at": {
    "bsonType": "timestamp",
    "description": "创建时间",
    "label": "创建时间",
    "defaultValue": {
      "$env": "now"
    }
  }
}
```

将 `forceDefaultValue` 改为 `defaultValue`。

---

## ⚠️ 注意事项

1. **备份数据**
   - 修复前先导出数据备份
   - 避免数据丢失

2. **Schema一致性**
   - 确保管理端和客户端的Schema一致
   - 都要重新上传

3. **时间戳格式**
   - 统一使用 `timestamp` 类型
   - 不要混用 `number` 和 `Date`

---

**✅ 推荐快速修复：**

```bash
1. uniCloud控制台 → botc-system-messages → 清空数据
2. 右键 botc-system-messages.schema.json → 上传DB Schema
3. 刷新小程序测试
```

**如果还有问题，请提供完整的错误堆栈信息！** 🔧

