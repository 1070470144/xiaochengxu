# ⚡ 快速检查：举报消息未显示

## 🎯 请按顺序执行以下检查

---

## ✅ 检查1：云函数是否已上传？

### 操作步骤
```bash
1. HBuilderX中右键：
   botc-admin/uniCloud-aliyun/cloudfunctions/reports-admin
   
2. 选择：上传部署

3. 等待显示"上传成功"
```

### 验证方法
```bash
1. 打开：https://unicloud.dcloud.net.cn/
2. 登录 → 选择服务空间
3. 云函数/云对象 → 找到 reports-admin
4. 查看"更新时间"是否是最近的（几分钟内）
```

**如果未上传或时间不对 → 重新上传！**

---

## ✅ 检查2：查看云函数执行日志

### 操作步骤
```bash
1. uniCloud控制台
2. 云函数/云对象 → reports-admin
3. 点击"日志"
4. 找到最近的执行记录（就是你刚才点击"处理"的那次）
```

### 应该看到的日志

**✅ 成功的情况：**
```
已警告用户 66b7c8e8f3a7b5000156789a
已发送系统消息给用户 66b7c8e8f3a7b5000156789a
```

**❌ 失败的情况：**
```
警告失败：未找到被举报用户ID
```
或
```
发送系统消息失败：xxx
```

### 如果看到失败日志
→ 跳到 **检查3**

### 如果看到成功日志
→ 跳到 **检查4**

### 如果没有任何日志
→ **云函数未执行或未上传，回到检查1**

---

## ✅ 检查3：被举报内容是否存在？

### 在uniCloud控制台执行

```javascript
// 第1步：查看最近的举报记录
db.collection('botc-reports')
  .orderBy('created_at', 'desc')
  .limit(1)
  .get()
  .then(res => {
    const report = res.data[0]
    console.log('举报记录：')
    console.log('content_type:', report.content_type)
    console.log('content_id:', report.content_id)
    console.log('reported_user_id:', report.reported_user_id)
    
    // 记下这两个值，下一步要用
    return report
  })
```

**记下输出的值：**
- `content_type`: __________ （例如：post）
- `content_id`: __________ （例如：abc123）

---

### 第2步：检查被举报内容是否存在

**如果 content_type 是 'post'：**
```javascript
db.collection('botc-posts')
  .doc('刚才记下的content_id')  // ← 替换这里
  .get()
  .then(res => {
    if (res.data.length > 0) {
      console.log('✅ 帖子存在')
      console.log('作者ID:', res.data[0].user_id)
    } else {
      console.log('❌ 帖子不存在或已删除')
    }
  })
```

**如果内容不存在：**
→ **这就是问题！系统无法获取作者ID，自然无法发送消息。**

**解决方案：**
- 举报的内容已被删除，无法再发送消息
- 下次举报时，先处理再删除（或选择"警告用户"而不是"删除内容"）

---

## ✅ 检查4：数据库中是否有消息？

### 在uniCloud控制台执行

```javascript
db.collection('botc-system-messages')
  .orderBy('created_at', 'desc')
  .limit(5)
  .get()
  .then(res => {
    console.log('最近5条消息：')
    res.data.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.title}`)
      console.log('   接收人ID:', msg.user_id)
      console.log('   创建时间:', new Date(msg.created_at))
      console.log('   是否已读:', msg.is_read)
      console.log('---')
    })
  })
```

### 结果分析

**如果有最新的警告消息：**
```
1. 违规警告
   接收人ID: 66b7c8e8f3a7b5000156789a
   创建时间: 刚才的时间
   是否已读: false
```
→ **消息已创建！跳到检查5**

**如果没有最新消息：**
→ **消息创建失败，跳到检查6**

---

## ✅ 检查5：user_id 是否正确？

### 需要知道的信息

1. **消息中的 user_id**（从检查4获得）：__________
2. **当前登录小程序的用户ID**

### 获取当前用户ID

**方法1：小程序端查看**
```javascript
// 在小程序任意页面的 onLoad 中打印
uni.getStorageSync('uni_id_token_expired')
// 或
const userId = uni.getStorageSync('userId')
console.log('当前用户ID:', userId)
```

**方法2：从token解析**
```javascript
const token = uni.getStorageSync('token')
const userId = token.split('_')[0]
console.log('用户ID:', userId)
```

### 对比结果

**user_id 一致：**
→ **跳到检查7（查看小程序查询逻辑）**

**user_id 不一致：**
→ **问题找到了！消息发给了错误的用户**

**原因：**
- 举报记录中的 `reported_user_id` 不正确
- 或从内容中获取的 `user_id` 不正确

---

## ✅ 检查6：为什么消息创建失败？

### 检查Schema是否上传

```bash
1. uniCloud控制台
2. 云数据库 → botc-system-messages
3. 点击"表结构"
4. 查看是否有以下字段：
   - user_id
   - type
   - title
   - content
   - related_type
   - related_id
   - is_read
   - created_at
```

**如果表不存在或字段不全：**
```bash
右键：botc-miniprogram/uniCloud-aliyun/database/botc-system-messages.schema.json
→ 上传DB Schema
```

**如果表结构正确：**
→ 查看云函数详细错误日志

---

## ✅ 检查7：小程序查询逻辑

### 查看查询代码

打开：`botc-miniprogram/pages/user/system-messages/list.vue`

找到查询代码（大约114行）：

```javascript
const res = await db.collection('botc-system-messages')
  .where({
    user_id: userId,    // ← 这个userId对吗？
    is_read: false      // ← 这个条件会过滤已读消息
  })
  .orderBy('created_at', 'desc')
  .get()
```

### 临时调试

**修改为：**
```javascript
console.log('查询用户ID:', userId)

const res = await db.collection('botc-system-messages')
  .where({
    user_id: userId
    // 临时去掉 is_read 条件
  })
  .orderBy('created_at', 'desc')
  .limit(20)
  .get()

console.log('查询到的消息数量:', res.data.length)
console.log('消息列表:', res.data)
```

### 重新测试

```bash
1. 保存修改
2. 刷新小程序
3. 进入"系统消息"
4. 查看控制台输出
```

**如果能查到消息：**
→ **原因是 `is_read: false` 过滤了消息（可能你之前已读了）**

**如果查不到：**
→ **userId 不匹配或数据库确实没有消息**

---

## 🎯 最常见的3个问题

### 问题1：云函数未上传（60%可能性）
**症状：** 云函数日志中没有记录  
**解决：** 重新上传 `reports-admin` 云函数

### 问题2：被举报内容已删除（20%可能性）
**症状：** 日志显示"未找到被举报用户ID"  
**解决：** 无法补救，下次先警告再删除

### 问题3：user_id 不匹配（15%可能性）
**症状：** 数据库有消息，但小程序查不到  
**解决：** 检查举报记录的 `reported_user_id` 是否正确

---

## 💡 快速测试方案

### 方案A：手动创建测试消息

```javascript
// 在uniCloud控制台执行
db.collection('botc-system-messages').add({
  user_id: '你的用户ID',  // ← 替换为你登录的用户ID
  type: 'warning',
  title: '测试警告',
  content: '这是一条测试消息，用于验证功能是否正常',
  related_type: 'post',
  related_id: '',
  is_read: false
})
.then(() => {
  console.log('✅ 测试消息创建成功')
})
```

**然后：**
1. 刷新小程序
2. 进入"系统消息"
3. 看是否显示测试消息

**如果显示：**
→ 说明消息功能正常，问题在举报处理流程

**如果不显示：**
→ 说明消息查询有问题，检查 `user_id` 是否正确

---

## 📞 需要帮助？

**请告诉我以下信息：**

1. **检查1结果：** 云函数上传时间？
2. **检查2结果：** 云函数日志显示什么？
3. **检查3结果：** 被举报内容是否存在？
4. **检查4结果：** 数据库中是否有新消息？
5. **检查5结果：** user_id 是否一致？

**或者直接发送：**
- 云函数日志截图
- 数据库查询结果
- 小程序控制台输出

---

**🔍 按照上面的步骤检查后，告诉我在哪一步遇到了问题！**

