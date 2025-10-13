# 云函数 .field() 方法格式修复

## 问题描述

云函数中使用了错误的 `.field()` 方法格式，导致运行时错误：
```
Cannot assign to read only property '0' of string '_id,nickname,avatar'
```

## 问题原因

uniCloud 数据库的 `.field()` 方法不接受逗号分隔的字符串，正确格式应该是对象。

### ❌ 错误格式
```javascript
.field('_id,nickname,avatar')
```

### ✅ 正确格式
```javascript
.field({
  _id: true,
  nickname: true,
  avatar: true
})
```

## 修复的云函数

### 1. chat-conversation-list/index.js
- **问题行**: `.field('_id,nickname,avatar')`
- **修复**: 改为对象格式
- **影响功能**: 私聊会话列表加载

### 2. user-profile/index.js
- **问题行1**: `.field('_id,nickname,avatar,gender,level,exp,register_date,followers_count,following_count')`
- **问题行2**: `.field('_id,content,images,like_count,comment_count,created_at')`
- **修复**: 都改为对象格式
- **影响功能**: 用户主页数据加载

### 3. user-following-list/index.js
- **问题行**: `.field('_id,nickname,avatar,level')`
- **修复**: 改为对象格式
- **影响功能**: 关注列表显示

### 4. user-followers-list/index.js
- **问题行**: `.field('_id,nickname,avatar,level')`
- **修复**: 改为对象格式  
- **影响功能**: 粉丝列表显示

### 5. carpool-applied-list/index.js
- **问题行**: `.field('_id,nickname,avatar')`
- **修复**: 改为对象格式
- **影响功能**: 报名记录中的用户信息显示

### 6. script-calculate-heat/index.js
- **问题行**: `.field('view_count,download_count')`
- **修复**: 改为对象格式
- **影响功能**: 剧本热度计算

## 修复示例

### 修复前
```javascript
const usersResult = await usersCollection
  .where({
    _id: db.command.in(otherUserIds)
  })
  .field('_id,nickname,avatar')
  .get()
```

### 修复后
```javascript
const usersResult = await usersCollection
  .where({
    _id: db.command.in(otherUserIds)
  })
  .field({
    _id: true,
    nickname: true,
    avatar: true
  })
  .get()
```

## 部署说明

### 1. 上传修复的云函数
所有修复的云函数需要重新上传：
- chat-conversation-list
- user-profile
- user-following-list
- user-followers-list  
- carpool-applied-list
- script-calculate-heat

### 2. 验证修复
测试以下功能应该不再出现错误：
- ✅ 私聊会话列表加载
- ✅ 用户主页访问
- ✅ 关注/粉丝列表查看
- ✅ 报名记录查看
- ✅ 剧本热度计算

## 预防措施

### 1. 代码规范
- 统一使用对象格式的 `.field()` 方法
- 避免使用逗号分隔的字符串

### 2. 测试要求
- 新增云函数必须测试 `.field()` 方法调用
- 确保数据查询返回正确字段

### 3. 文档参考
- [uniCloud 数据库查询 API](https://uniapp.dcloud.net.cn/uniCloud/clientdb.html#field)

## 技术细节

### 为什么会出错？
1. uniCloud 内部尝试解析字符串参数
2. 字符串是只读的，无法修改其字符
3. 导致 `Cannot assign to read only property` 错误

### 正确的参数格式
- **对象格式**: `{ fieldName: true/false }`
- **数组格式**: `['field1', 'field2']` （部分情况）
- **字符串数组**: 某些特定场景下支持

---

**修复完成时间**: 2025-01-13  
**修复文件数量**: 6个云函数  
**影响功能**: 用户系统、私聊功能、关注系统、报名记录、剧本热度
