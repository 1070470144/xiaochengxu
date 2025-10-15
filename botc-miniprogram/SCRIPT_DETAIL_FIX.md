# 剧本详情页面修复说明

## ❌ 原问题

**症状**: 上传剧本后，点击查看详情报错"剧本加载失败"

**原因**: 
1. 剧本详情云函数只查询 `status: 1`（已发布）的剧本
2. 用户刚上传的剧本是 `status: 0`（待审核）
3. 待审核剧本查询不到 → 报错

---

## ✅ 解决方案

### 修改权限逻辑

**新规则**:
- ✅ `status: 1`（已发布）→ 所有人都可以看
- ✅ `status: 0`（待审核）→ **仅上传者本人可以看**
- ✅ `status: 2`（已拒绝）→ **仅上传者本人可以看**

**实现**:
```javascript
// 1. 获取当前用户ID
const currentUserId = token.split('_')[0]

// 2. 查询剧本
const script = await db.collection('botc-scripts').doc(id).get()

// 3. 权限判断
const isPublished = script.status === 1  // 已发布
const isOwner = script.creator_id === currentUserId  // 是本人

// 4. 决定是否允许访问
if (!isPublished && !isOwner) {
  return { code: 403, message: '该剧本暂未发布' }
}

// 5. 允许访问，返回数据
return { code: 0, data: script }
```

---

## 📋 修改的文件

### 云函数
- ✅ `cloudfunctions/script-detail/index.js` - 修改权限逻辑

### 前
