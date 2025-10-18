# Wiki v2.2 快速测试指南

## 🚀 快速开始

### 1. 上传数据库Schema（30秒）
```bash
右键 botc-admin/uniCloud-aliyun/database/wiki_role_list.schema.json
→ 上传Schema
```

### 2. 批量上传云函数（2分钟）
```bash
# 依次右键上传这4个云函数：
wiki-role-add
wiki-role-list  
wiki-role-delete
wiki-role-sync
```

### 3. 运行前端（1分钟）
```bash
运行 → 运行到浏览器 → Chrome
登录后台 → 百科同步管理
```

---

## ✅ 测试清单

### Test 1: 添加角色（必测 ⭐⭐⭐）
```
输入框填写：
图书管理员
哲学家
洗衣妇

点击"保存角色" → 应该显示"成功添加 3 个角色"
```

### Test 2: 搜索角色（必测 ⭐⭐⭐）
```
搜索框输入：图书
→ 应该只显示"图书管理员"
```

### Test 3: 状态筛选（必测 ⭐⭐⭐）
```
筛选下拉框选择：未同步
→ 应该只显示未同步的角色
```

### Test 4: 单个同步（必测 ⭐⭐⭐）
```
找到"图书管理员" → 点击"同步"按钮 → 确认
→ 应该显示"同步完成"，状态变为"已同步"
```

### Test 5: 批量同步（必测 ⭐⭐⭐）
```
勾选"哲学家"和"洗衣妇" → 点击"批量同步（2）" → 确认
→ 应该显示"同步完成：成功 2 个，失败 0 个"
```

### Test 6: 删除角色（选测 ⭐⭐）
```
勾选任意角色 → 点击"批量删除" → 确认
→ 应该显示"成功删除 1 个角色"
```

### Test 7: 重复添加（选测 ⭐）
```
再次输入"图书管理员" → 点击"保存"
→ 应该提示"1 个重复"
```

---

## 🔍 验证数据库

### 验证角色列表
```javascript
// uniCloud Web控制台
db.collection('wiki_role_list').where({}).get()

// 应该看到：
// { role_name: "图书管理员", is_synced: true, sync_status: "success" }
// { role_name: "哲学家", is_synced: true, sync_status: "success" }
// { role_name: "洗衣妇", is_synced: true, sync_status: "success" }
```

### 验证同步结果
```javascript
// 验证wiki_entries中有对应记录
db.collection('wiki_entries')
  .where({ title: '图书管理员' })
  .get()

// 应该看到完整的角色数据，包括：
// - title: "图书管理员"
// - entry_type: "role"
// - content: "..."
// - media: { background_story: "...", icon_url: "..." }
```

---

## 🐛 常见错误排查

### 错误 1: 添加角色后列表不显示
```javascript
// 控制台检查
console.log('[addRoles] 添加结果:', res.result)

// 手动刷新
this.loadRoleList()
```

### 错误 2: 同步失败
```javascript
// 查看错误信息
db.collection('wiki_role_list')
  .where({ sync_status: 'failed' })
  .field({ role_name: true, sync_error: true })
  .get()
```

### 错误 3: 搜索不生效
```javascript
// 检查防抖是否触发
console.log('[searchRoles] 搜索关键词:', this.searchKeyword)
```

---

## ⏱️ 预计测试时间

- **必测项目**: 5分钟
- **选测项目**: 2分钟
- **数据库验证**: 3分钟
- **总计**: 10分钟

---

## 🎯 测试成功标志

✅ 可以添加角色  
✅ 可以搜索角色  
✅ 可以筛选状态  
✅ 可以单个同步  
✅ 可以批量同步  
✅ 可以删除角色  
✅ 数据库中有对应记录

---

## 📸 测试截图建议

1. 添加角色成功提示
2. 角色列表显示
3. 同步完成提示
4. 数据库查询结果

---

**开始测试！Good Luck! 🚀**

