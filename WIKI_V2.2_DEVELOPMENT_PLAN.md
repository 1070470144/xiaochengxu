# 血染百科 v2.2 开发计划

## 📋 项目概述

### 版本
v2.2.0 - 角色名称管理系统（简化版）

### 核心目标
通过角色名称管理系统，让用户可以：
1. 输入角色名称添加到列表
2. 永久保存，不用每次输入
3. 批量同步所有角色
4. 搜索和筛选角色

### 开发周期
**5.5小时**

---

## 🎯 开发阶段

### 阶段一：数据库设计（0.5小时）

#### 任务1：创建wiki_role_list集合

**Schema定义**：
```javascript
{
  role_name: String,        // 角色名称（唯一）
  role_url: String,         // 自动生成
  is_synced: Boolean,       // 是否已同步
  last_sync_time: Date,     // 最后同步时间
  sync_status: String,      // success/failed/pending
  sync_error: String,       // 错误信息
  created_at: Date,
  updated_at: Date
}
```

**索引**：
- role_name（唯一索引）
- sync_status
- is_synced

---

### 阶段二：云函数开发（1.5小时）

#### 任务2：wiki-role-add

**功能**：添加角色到列表

```javascript
exports.main = async (event, context) => {
  const { roleNames } = event;  // 数组：['哲学家', '送茶侍者']
  
  const db = uniCloud.database();
  const results = [];
  
  for (const name of roleNames) {
    // 生成URL
    const url = `https://clocktower-wiki.gstonegames.com/index.php?title=${encodeURIComponent(name)}`;
    
    // 检查是否已存在
    const existing = await db.collection('wiki_role_list')
      .where({ role_name: name })
      .get();
    
    if (existing.data.length > 0) {
      results.push({ name, status: 'exists' });
      continue;
    }
    
    // 添加到列表
    await db.collection('wiki_role_list').add({
      role_name: name,
      role_url: url,
      is_synced: false,
      sync_status: 'pending',
      created_at: new Date()
    });
    
    results.push({ name, status: 'added' });
  }
  
  return {
    code: 0,
    message: '添加完成',
    data: results
  };
};
```

---

#### 任务3：wiki-role-list

**功能**：获取角色列表（支持搜索）

```javascript
exports.main = async (event, context) => {
  const { 
    keyword = '',           // 搜索关键词
    syncStatus = 'all',     // all/synced/pending/failed
    page = 1, 
    pageSize = 20 
  } = event;
  
  const db = uniCloud.database();
  const where = {};
  
  // 名称搜索
  if (keyword) {
    where.role_name = new RegExp(keyword, 'i');
  }
  
  // 状态筛选
  if (syncStatus === 'synced') {
    where.is_synced = true;
    where.sync_status = 'success';
  } else if (syncStatus === 'pending') {
    where.is_synced = false;
  } else if (syncStatus === 'failed') {
    where.sync_status = 'failed';
  }
  
  // 查询
  const countRes = await db.collection('wiki_role_list').where(where).count();
  const listRes = await db.collection('wiki_role_list')
    .where(where)
    .orderBy('created_at', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  
  return {
    code: 0,
    data: {
      list: listRes.data,
      total: countRes.total,
      page,
      pageSize
    }
  };
};
```

---

#### 任务4：wiki-role-delete

**功能**：删除角色

```javascript
exports.main = async (event, context) => {
  const { roleId } = event;
  
  const db = uniCloud.database();
  await db.collection('wiki_role_list').doc(roleId).remove();
  
  return {
    code: 0,
    message: '删除成功'
  };
};
```

---

#### 任务5：wiki-role-sync

**功能**：同步角色

```javascript
exports.main = async (event, context) => {
  const { roleIds = [] } = event;  // 要同步的角色ID数组
  
  const db = uniCloud.database();
  const results = { success: 0, failed: 0, errors: [] };
  
  for (const roleId of roleIds) {
    // 获取角色信息
    const role = await db.collection('wiki_role_list').doc(roleId).get();
    if (!role.data || role.data.length === 0) continue;
    
    const roleData = role.data[0];
    
    try {
      // 调用同步
      const syncRes = await uniCloud.callFunction({
        name: 'wiki-admin-sync-single',
        data: { url: roleData.role_url }
      });
      
      if (syncRes.result.code === 0) {
        // 更新状态
        await db.collection('wiki_role_list').doc(roleId).update({
          is_synced: true,
          sync_status: 'success',
          last_sync_time: new Date(),
          sync_error: null
        });
        results.success++;
      } else {
        throw new Error(syncRes.result.message);
      }
    } catch (error) {
      // 更新为失败
      await db.collection('wiki_role_list').doc(roleId).update({
        sync_status: 'failed',
        sync_error: error.message
      });
      results.failed++;
      results.errors.push({ name: roleData.role_name, error: error.message });
    }
  }
  
  return {
    code: 0,
    message: '同步完成',
    data: results
  };
};
```

---

### 阶段三：前端开发（2.5小时）

#### 任务6-10：修改sync.vue

**新增数据**：
```javascript
data() {
  return {
    // 搜索
    searchKeyword: '',
    syncStatusFilter: 'all',
    
    // 添加角色
    roleNamesInput: '',
    
    // 角色列表
    roleList: [],
    page: 1,
    pageSize: 20,
    total: 0,
    
    // 批量同步
    batchSyncing: false,
    syncProgress: { current: 0, total: 0 }
  }
}
```

**新增方法**：
```javascript
methods: {
  // 加载角色列表
  async loadRoleList() {
    const res = await uniCloud.callFunction({
      name: 'wiki-role-list',
      data: {
        keyword: this.searchKeyword,
        syncStatus: this.syncStatusFilter,
        page: this.page,
        pageSize: this.pageSize
      }
    });
    
    this.roleList = res.result.data.list;
    this.total = res.result.data.total;
  },
  
  // 添加角色
  async addRoles() {
    const names = this.roleNamesInput
      .split('\n')
      .map(n => n.trim())
      .filter(n => n);
    
    if (names.length === 0) {
      return uni.showToast({ title: '请输入角色名称', icon: 'none' });
    }
    
    const res = await uniCloud.callFunction({
      name: 'wiki-role-add',
      data: { roleNames: names }
    });
    
    uni.showToast({ title: '添加成功', icon: 'success' });
    this.roleNamesInput = '';
    this.loadRoleList();
  },
  
  // 删除角色
  async deleteRole(roleId) {
    uni.showModal({
      title: '确认删除',
      content: '确定要删除这个角色吗？',
      success: async (res) => {
        if (res.confirm) {
          await uniCloud.callFunction({
            name: 'wiki-role-delete',
            data: { roleId }
          });
          uni.showToast({ title: '删除成功', icon: 'success' });
          this.loadRoleList();
        }
      }
    });
  },
  
  // 同步所有未同步角色
  async syncAllPending() {
    const pendingRoles = this.roleList.filter(r => !r.is_synced);
    if (pendingRoles.length === 0) {
      return uni.showToast({ title: '没有待同步角色', icon: 'none' });
    }
    
    const roleIds = pendingRoles.map(r => r._id);
    
    uni.showModal({
      title: '确认同步',
      content: `确定要同步${roleIds.length}个角色吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.executeBatchSync(roleIds);
        }
      }
    });
  },
  
  async executeBatchSync(roleIds) {
    this.batchSyncing = true;
    
    uni.showLoading({ title: '同步中...', mask: true });
    
    const res = await uniCloud.callFunction({
      name: 'wiki-role-sync',
      data: { roleIds }
    });
    
    uni.hideLoading();
    
    uni.showModal({
      title: '同步完成',
      content: `成功：${res.result.data.success}\n失败：${res.result.data.failed}`,
      showCancel: false
    });
    
    this.batchSyncing = false;
    this.loadRoleList();
  }
}
```

---

### 阶段四：测试（1小时）

#### 测试清单
- [ ] 添加单个角色
- [ ] 添加多个角色
- [ ] 搜索角色
- [ ] 状态筛选
- [ ] 删除角色
- [ ] 同步单个角色
- [ ] 批量同步
- [ ] 重新同步

---

## 📊 开发任务清单（13个）

### 数据库（1个）
1. ⏸️ 创建 wiki_role_list Schema

### 云函数（4个）
2. ⏸️ wiki-role-add
3. ⏸️ wiki-role-list
4. ⏸️ wiki-role-delete
5. ⏸️ wiki-role-sync

### 前端界面（5个）
6. ⏸️ 删除剧本/规则同步按钮
7. ⏸️ 添加搜索框
8. ⏸️ 添加角色名称输入区
9. ⏸️ 添加角色列表展示
10. ⏸️ 添加批量操作按钮

### 测试（3个）
11. ⏸️ 添加角色功能测试
12. ⏸️ 搜索筛选功能测试
13. ⏸️ 批量同步功能测试

---

## ⏱️ 时间规划

```
数据库设计：    0.5小时
云函数开发：    1.5小时
前端界面：      2.5小时
测试优化：      1.0小时
────────────────────────
总计：          5.5小时
```

---

## 🎯 开发顺序

### Day 1（5.5小时）

**上午（3小时）**
- 0.5h：创建数据库
- 1.5h：开发4个云函数
- 1.0h：删除旧功能，添加搜索框

**下午（2.5小时）**
- 1.5h：添加角色输入和列表展示
- 1.0h：添加批量同步功能和测试

---

## 📦 交付清单

### 代码文件
1. ✅ wiki_role_list.schema.json
2. ✅ wiki-role-add/index.js
3. ✅ wiki-role-list/index.js
4. ✅ wiki-role-delete/index.js
5. ✅ wiki-role-sync/index.js
6. ✅ sync.vue（优化版）

### 文档
7. ✅ v2.2功能说明
8. ✅ 使用手册

---

## 🎊 完成后效果

### 用户操作流程

```
1. 输入角色名称：
   哲学家
   送茶侍者
   祖母

2. 点击"添加到列表"
   → 保存成功，显示在列表中

3. 搜索"哲"
   → 显示：哲学家

4. 点击"同步所有未同步角色"
   → 自动同步3个新角色

5. 以后想添加新角色
   → 直接输入名称
   → 不用每次输入旧角色
```

---

## ✅ 功能特性

- ✅ **永久保存** - 一次添加，永久使用
- ✅ **智能URL** - 自动生成钟楼百科URL
- ✅ **批量管理** - 一次同步多个
- ✅ **状态追踪** - 知道哪些已同步
- ✅ **快速搜索** - 瞬间找到角色
- ✅ **操作简单** - 界面清晰直观

---

## 🚀 准备开始？

确认后回复 **/implement**，我将立即开始开发v2.2！

---

**版本**: v2.2.0  
**开发时间**: 5.5小时  
**任务数**: 13个  
**创建时间**: 2025年10月18日

