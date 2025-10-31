# 📊 数据库Schema整合说明

## ✅ 已完成整合

### botc-system-messages（系统消息）
- ❌ 删除：`botc-admin/uniCloud-aliyun/database/botc-system-messages.schema.json`
- ✅ 保留：`botc-miniprogram/uniCloud-aliyun/database/botc-system-messages.schema.json`
- **原因**：客户端和管理端共享同一个数据库表

---

## 🎯 UniCloud数据库架构说明

### 重要概念

UniCloud使用**共享数据库**架构：
- 📦 **同一个服务空间**下，所有应用共享数据库
- 🔄 客户端（小程序）和管理端访问的是**同一个数据库**
- 📝 Schema文件只需要上传**一次**，两端都生效

### Schema文件的作用

```
botc-miniprogram/uniCloud-aliyun/database/
  └── xxx.schema.json  ← 定义表结构和权限

botc-admin/uniCloud-aliyun/database/
  └── xxx.schema.json  ← 如果内容相同，这个文件是多余的！
```

---

## 📋 Schema整合原则

### 应该保留的Schema

#### 1. 客户端独有功能的表
保留在 `botc-miniprogram/uniCloud-aliyun/database/`：
- ✅ `botc-system-messages.schema.json` - 系统消息（两端共用）
- ✅ `botc-browse-history.schema.json` - 浏览历史（客户端）
- ✅ `botc-favorites.schema.json` - 收藏（客户端）
- ✅ `botc-user-follows.schema.json` - 关注（客户端）
- ✅ `botc-certifications.schema.json` - 说书人认证（两端共用）

#### 2. 管理端独有功能的表
保留在 `botc-admin/uniCloud-aliyun/database/`：
- ✅ `botc-sensitive-words.schema.json` - 敏感词管理（管理端独有）
- ✅ `botc-reports.schema.json` - 举报管理（两端共用，但管理端创建）
- ✅ `opendb-admin-menus.*` - 管理端菜单（管理端独有）

#### 3. 两端共用的表
**只需保留一份**，建议保留在客户端：
- ✅ `botc-posts.schema.json` - 帖子
- ✅ `botc-scripts.schema.json` - 剧本
- ✅ `botc-shops.schema.json` - 店铺
- ✅ `botc-carpool-rooms.schema.json` - 拼车
- ✅ `wiki_*.schema.json` - 百科

---

## 🔍 当前状态分析

### 客户端独有的Schema
```
botc-miniprogram/uniCloud-aliyun/database/
✅ botc-system-messages.schema.json  ← 已整合
✅ botc-browse-history.schema.json
✅ botc-favorites.schema.json
✅ botc-user-follows.schema.json
```

### 管理端独有的Schema
```
botc-admin/uniCloud-aliyun/database/
✅ botc-sensitive-words.schema.json  ← 管理端专用
✅ botc-reports.schema.json  ← 管理端创建，但数据来自客户端
✅ botc-certifications.schema.json  ← 管理端版本（权限不同）
```

### 两端都有的Schema（需要检查）

| Schema文件 | 客户端 | 管理端 | 建议 |
|-----------|--------|--------|------|
| `botc-posts.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-scripts.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-shops.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-carpool-rooms.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-carpool-members.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-chat-conversations.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-chat-messages.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-post-comments.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-post-likes.schema.json` | ❌ | ✅ | 保留管理端版本 |
| `botc-script-reviews.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-shop-reviews.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-storyteller-profiles.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `botc-storyteller-reviews.schema.json` | ✅ | ✅ | 保留客户端版本 |
| `wiki_*.schema.json` | ✅ | ✅ | 保留管理端版本（管理端创建） |

---

## 🚀 整合建议

### 方案1：保守方案（推荐）
**保持现状，只删除完全重复的**
- ✅ 已删除：`botc-system-messages.schema.json`（管理端）
- ✅ 其他保持不变
- **优点**：安全，不影响现有功能
- **缺点**：有一些重复文件

### 方案2：激进方案
**删除所有重复的Schema**
- ❌ 风险较高
- ❌ 需要逐个对比权限配置
- ❌ 可能影响现有功能

---

## 💡 最佳实践

### 1. 新建表时的原则

**客户端创建的表 → 放在客户端**
```bash
botc-miniprogram/uniCloud-aliyun/database/
└── botc-new-table.schema.json
```

**管理端创建的表 → 放在管理端**
```bash
botc-admin/uniCloud-aliyun/database/
└── botc-admin-only-table.schema.json
```

**两端共用的表 → 放在先创建的一端**
```bash
# 如果客户端先有，就放客户端
botc-miniprogram/uniCloud-aliyun/database/
└── botc-shared-table.schema.json
```

### 2. Schema权限配置

**客户端Schema（用户可读写）**
```json
{
  "permission": {
    "read": "doc.user_id == auth.uid",
    "create": true,
    "update": "doc.user_id == auth.uid",
    "delete": "doc.user_id == auth.uid"
  }
}
```

**管理端Schema（只允许云函数操作）**
```json
{
  "permission": {
    "read": true,
    "create": false,
    "update": false,
    "delete": false
  }
}
```

### 3. 特殊情况

**举报表（botc-reports）**
- 客户端：用户提交举报
- 管理端：管理员处理举报
- **解决方案**：
  - Schema放在管理端（因为管理端需要修改权限）
  - 客户端通过云函数提交举报

**认证表（botc-certifications）**
- 客户端：用户申请认证
- 管理端：管理员审核认证
- **解决方案**：
  - 两端各有一份Schema
  - 权限配置不同
  - 或者统一放在管理端，客户端通过云函数操作

---

## ⚠️ 注意事项

### 1. 不要随意删除Schema
- 删除前先确认两端的Schema**完全一致**
- 特别注意 `permission` 权限配置
- 删除后需要重新上传保留的那份

### 2. 权限冲突问题
如果两端都有Schema且权限不同：
- 后上传的会**覆盖**先上传的
- 可能导致权限配置错误
- **建议**：只保留一份，权限设置为最严格的

### 3. Schema更新
更新Schema时：
- 只更新保留的那份
- 上传后两端都生效
- 不需要两边都更新

---

## 📝 当前整合状态

### ✅ 已整合
- `botc-system-messages.schema.json` - 已删除管理端版本

### 🔄 待整合（可选）
以下文件两端都有，可以考虑只保留一份：
- `botc-posts.schema.json`
- `botc-scripts.schema.json`
- `botc-shops.schema.json`
- `botc-carpool-*.schema.json`
- `botc-chat-*.schema.json`
- `botc-*-comments.schema.json`
- `botc-*-reviews.schema.json`

### ⚠️ 不建议整合
以下文件两端权限可能不同，建议保持独立：
- `botc-certifications.schema.json` - 权限配置可能不同
- `botc-reports.schema.json` - 管理端需要特殊权限
- `wiki_*.schema.json` - 管理端创建和管理

---

## 🎯 总结

### 核心原则
1. **UniCloud数据库是共享的**，Schema只需要一份
2. **权限配置很重要**，不同权限需求可以保留两份
3. **谨慎删除**，删除前先对比确认

### 当前方案
- ✅ 已删除 `botc-system-messages.schema.json`（管理端）
- ✅ 保留其他Schema不变（安全起见）
- ✅ 未来新建表时遵循最佳实践

### 建议
**保持现状即可**，不需要进一步整合。重复的Schema文件虽然存在，但不影响功能，反而更安全。

---

**✅ Schema整合完成！** 🎉

**要点：**
- UniCloud数据库是共享的
- Schema只需要上传一次
- 重复的Schema可以删除，但要谨慎
- 当前只删除了完全相同的 `botc-system-messages.schema.json`

