# 系统消息功能 - 问题排查

## 🔍 问题：加载失败

### 步骤1：确认数据库表已创建

**在 uniCloud web控制台**：
1. 登录 https://unicloud.dcloud.net.cn
2. 选择你的服务空间
3. 点击"云数据库"
4. 查看是否有 `botc-system-messages` 表

**如果没有**：
- 重新上传：右键 `botc-system-messages.schema.json` → 上传DB Schema

---

### 步骤2：检查表权限

**在 uniCloud web控制台**：
1. 进入"云数据库"
2. 点击 `botc-system-messages` 表
3. 点击"表结构"
4. 查看"权限规则"

**应该是**：
```json
{
  "read": true,
  "create": false,
  "update": true,
  "delete": false
}
```

**如果不是**：
- 重新上传 schema 文件

---

### 步骤3：手动创建测试数据

**在 uniCloud web控制台**：
1. 进入"云数据库"
2. 点击 `botc-system-messages` 表
3. 点击"添加记录"
4. 填入以下数据：

```json
{
  "user_id": "你的用户ID",
  "type": "notice",
  "title": "测试消息",
  "content": "这是一条测试消息",
  "is_read": false,
  "created_at": 1730000000000
}
```

**获取你的用户ID**：
- 在小程序中，打开控制台
- 查看 `Auth.getUserInfo()` 的输出
- 复制 `uid` 或 `_id` 字段

---

### 步骤4：查看详细日志

**修改后的代码会输出**：
```
用户信息: {...}
用户ID: xxx
开始查询消息，user_id: xxx
查询结果: {...}
消息数量: 0
```

**如果看到错误**：
- 记录错误信息
- 检查错误代码

---

## 🐛 常见错误及解决方案

### 错误1：`Permission denied`

**原因**：权限配置错误

**解决**：
1. 修改 `botc-system-messages.schema.json`
2. 将 `read` 和 `update` 改为 `true`
3. 重新上传

---

### 错误2：`Collection not found`

**原因**：数据库表不存在

**解决**：
1. 在 uniCloud 控制台手动创建表
2. 表名：`botc-system-messages`
3. 或重新上传 schema

---

### 错误3：`user_id is undefined`

**原因**：用户ID获取失败

**解决**：
1. 确认用户已登录
2. 检查 `Auth.getUserInfo()` 返回值
3. 确认 token 有效

---

## 🔧 临时解决方案

### 方案1：使用云函数查询

创建云函数 `get-system-messages`：

```javascript
'use strict';
exports.main = async (event, context) => {
  const { token } = event
  const userId = token.split('_')[0]
  
  const db = uniCloud.database()
  const res = await db.collection('botc-system-messages')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(20)
    .get()
  
  return {
    code: 0,
    data: res.data
  }
}
```

修改前端代码：
```javascript
const res = await uniCloud.callFunction({
  name: 'get-system-messages',
  data: { token: Auth.getToken() }
})
this.messages = res.result.data
```

---

### 方案2：检查服务空间

**确认使用的是正确的服务空间**：
1. 打开 `uniCloud/spaces.json`
2. 确认 `spaceId` 正确
3. 确认当前连接的是这个服务空间

---

## 📞 需要提供的信息

如果问题仍未解决，请提供：

1. **控制台完整日志**（包括错误信息）
2. **数据库表截图**（显示表名和权限）
3. **用户信息**（`Auth.getUserInfo()` 的输出）
4. **查询结果**（`console.log('查询结果:', res)` 的输出）

---

## ✅ 验证步骤

完成以上步骤后，按顺序验证：

1. [ ] 数据库表存在
2. [ ] 权限配置正确
3. [ ] 手动添加的测试数据可见
4. [ ] 控制台无错误日志
5. [ ] 消息列表可以正常显示
6. [ ] 点击消息可以查看详情
7. [ ] 标记已读功能正常

