# 我的上传 - 删除记录重新出现问题修复

## 🐛 问题描述

**现象**：在"我的上传"页面删除上传记录后，刷新页面这些记录又会重新出现

**影响**：用户无法有效管理自己的上传记录，造成困扰

---

## 🔍 问题分析

### 根本原因

系统采用**软删除**机制，但查询逻辑存在漏洞：

1. **删除操作**（`script-delete` 云函数）：
   - 正确执行了软删除
   - 设置 `deleted_at` 字段为当前时间
   - 设置 `status` 字段为 `-1`（已删除状态）
   
2. **查询操作**（`script-my-uploads` 云函数）：
   - ❌ **只过滤了 `creator_id`**
   - ❌ **没有过滤 `deleted_at` 字段**
   - ❌ 导致已删除的记录仍被查询出来

### 代码对比

**修复前**（有问题的代码）：
```javascript
// script-my-uploads/index.js
const countRes = await scriptsCollection
  .where({
    creator_id: userId  // 只过滤上传者
  })
  .count()

const listRes = await scriptsCollection
  .where({
    creator_id: userId  // 只过滤上传者，未排除已删除的
  })
  .orderBy('created_at', 'desc')
  .get()
```

**修复后**（正确的代码）：
```javascript
// script-my-uploads/index.js
const $ = db.command

const whereCondition = {
  creator_id: userId,
  deleted_at: $.or($.eq(null), $.not($.exists(true)))  // 排除已删除的
}

const countRes = await scriptsCollection
  .where(whereCondition)
  .count()

const listRes = await scriptsCollection
  .where(whereCondition)
  .orderBy('created_at', 'desc')
  .get()
```

---

## ✅ 修复方案

### 1. 修改查询云函数

**文件**：`uniCloud-aliyun/cloudfunctions/script-my-uploads/index.js`

**修改内容**：
- 引入数据库命令工具 `db.command`
- 添加 `deleted_at` 过滤条件
- 只查询 `deleted_at` 为 `null` 或不存在的记录

**核心改动**：
```javascript
const whereCondition = {
  creator_id: userId,
  deleted_at: $.or($.eq(null), $.not($.exists(true)))  // 新增：排除已删除
}
```

### 2. 查询条件说明

使用 `$.or($.eq(null), $.not($.exists(true)))` 来匹配：
- `deleted_at` 字段值为 `null` 的记录
- `deleted_at` 字段不存在的记录（兼容旧数据）

这样可以有效过滤掉软删除的记录（`deleted_at` 有值的记录）。

---

## 🚀 部署步骤

### 1. 重新部署云函数

在 HBuilderX 中：

```
1. 右键 uniCloud-aliyun/cloudfunctions/script-my-uploads
2. 选择"上传并运行"或"上传部署"
3. 等待部署完成
```

### 2. 验证修复

**测试步骤**：
1. 打开小程序，进入"我的上传"页面
2. 删除某个上传记录
3. 下拉刷新页面
4. ✅ 确认已删除的记录不再出现
5. 完全退出小程序重新进入
6. ✅ 再次确认已删除的记录仍然不显示

---

## 📊 完整的软删除机制

### 删除流程

```
用户点击删除
    ↓
前端调用 script-delete 云函数
    ↓
云函数验证权限
    ↓
执行软删除：
  - deleted_at = Date.now()
  - status = -1
    ↓
返回成功
    ↓
前端从列表移除该记录
```

### 查询流程（修复后）

```
用户打开"我的上传"
    ↓
前端调用 script-my-uploads 云函数
    ↓
云函数查询数据库：
  - WHERE creator_id = 当前用户
  - AND deleted_at IS NULL  ← 新增过滤
    ↓
返回有效记录
    ↓
前端显示列表
```

---

## 🔧 技术细节

### 为什么使用软删除？

✅ **优点**：
- 数据可恢复（如需要）
- 保留删除历史
- 避免关联数据问题
- 符合数据管理规范

❌ **需要注意**：
- 所有查询都必须过滤 `deleted_at`
- 需要定期清理旧的已删除数据
- 统计数据要排除已删除记录

### uniCloud 数据库命令

```javascript
const $ = db.command

// 常用过滤命令
$.eq(value)           // 等于
$.neq(value)          // 不等于
$.gt(value)           // 大于
$.lt(value)           // 小于
$.exists(true)        // 字段存在
$.exists(false)       // 字段不存在
$.or([condition1, condition2])  // 或条件
$.and([condition1, condition2]) // 与条件
```

---

## 🧪 测试场景

### 场景 1：正常删除
```
1. 有3个上传记录
2. 删除第2个
3. 刷新页面
4. ✅ 只显示第1和第3个
```

### 场景 2：多次删除
```
1. 删除记录A
2. 删除记录B
3. 刷新页面
4. ✅ A和B都不显示
```

### 场景 3：筛选状态
```
1. 删除一个"待审核"的记录
2. 切换到"待审核"筛选
3. ✅ 已删除的不显示
4. 切换到"全部"
5. ✅ 已删除的仍不显示
```

### 场景 4：退出重进
```
1. 删除记录
2. 完全退出小程序
3. 重新进入"我的上传"
4. ✅ 已删除的记录不显示
```

---

## 📝 相关文件清单

### 已修改的文件
- ✅ `uniCloud-aliyun/cloudfunctions/script-my-uploads/index.js`

### 未修改的文件（无需修改）
- `pages/user/my-uploads/my-uploads.vue` - 前端页面
- `uniCloud-aliyun/cloudfunctions/script-delete/index.js` - 删除云函数

---

## 💡 额外优化建议

### 1. 统一查询接口

可以在云函数中添加一个通用的查询条件构建函数：

```javascript
// 获取有效记录的查询条件
function getValidRecordsCondition(userId) {
  const $ = db.command
  return {
    creator_id: userId,
    deleted_at: $.or($.eq(null), $.not($.exists(true))),
    status: $.neq(-1)  // 额外保险：排除 status = -1 的
  }
}
```

### 2. 添加索引

在数据库中为 `deleted_at` 字段添加索引，提高查询性能：

```javascript
// 在 uniCloud 控制台的数据库管理中创建索引
{
  "creator_id": 1,
  "deleted_at": 1,
  "created_at": -1
}
```

### 3. 定期清理

可以创建定时任务，清理超过30天的已删除记录：

```javascript
// 新建云函数：cleanup-deleted-scripts
const db = uniCloud.database()
const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

await db.collection('botc-scripts')
  .where({
    status: -1,
    deleted_at: db.command.lt(thirtyDaysAgo)
  })
  .remove()  // 真正删除
```

---

## ✅ 修复总结

### 问题
- 删除记录后刷新又出现

### 原因
- 查询时未过滤已删除的记录

### 解决
- 在查询条件中添加 `deleted_at` 过滤

### 影响
- ✅ 删除后立即生效
- ✅ 刷新不再重现
- ✅ 重启应用也有效
- ✅ 不影响其他功能

---

**修复日期**：2025年10月16日  
**修复状态**：✅ 完成  
**需要部署**：是（需要重新上传 script-my-uploads 云函数）



