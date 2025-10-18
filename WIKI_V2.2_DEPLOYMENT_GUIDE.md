# Wiki v2.2 角色管理系统 - 部署指南

## 📋 版本信息
- **版本号**: v2.2
- **更新日期**: 2025-10-18
- **更新类型**: 角色管理系统重构

## 🎯 更新概述

### 新增功能
1. ✅ 角色名称管理（添加/删除）
2. ✅ 永久存储（wiki_role_list数据库）
3. ✅ 角色搜索（按名称）
4. ✅ 状态筛选（已同步/未同步/失败）
5. ✅ 批量同步
6. ✅ 单个同步

### 移除功能
1. ❌ 删除"同步所有内容"按钮
2. ❌ 删除"仅同步剧本"按钮
3. ❌ 删除"仅同步规则"按钮
4. ❌ 删除单个URL输入同步功能

---

## 📦 部署步骤

### 步骤 1：上传数据库Schema

1. 打开HBuilderX
2. 找到 `botc-admin/uniCloud-aliyun/database/wiki_role_list.schema.json`
3. **右键 → 上传Schema**

**验证方式：**
- 打开uniCloud Web控制台
- 进入"数据库" → "wiki_role_list"
- 确认集合已创建

---

### 步骤 2：上传云函数

需要上传以下4个云函数：

#### 2.1 wiki-role-add（添加角色）
1. 右键 `botc-admin/uniCloud-aliyun/cloudfunctions/wiki-role-add`
2. 选择 **"上传部署"**

#### 2.2 wiki-role-list（获取列表）
1. 右键 `botc-admin/uniCloud-aliyun/cloudfunctions/wiki-role-list`
2. 选择 **"上传部署"**

#### 2.3 wiki-role-delete（删除角色）
1. 右键 `botc-admin/uniCloud-aliyun/cloudfunctions/wiki-role-delete`
2. 选择 **"上传部署"**

#### 2.4 wiki-role-sync（批量同步）
1. 右键 `botc-admin/uniCloud-aliyun/cloudfunctions/wiki-role-sync`
2. 选择 **"上传部署"**

**验证方式：**
- 打开uniCloud Web控制台
- 进入"云函数/云对象"
- 确认4个云函数都显示"已部署"

---

### 步骤 3：部署前端

1. 打开 `botc-admin` 项目
2. 运行到浏览器（Chrome）
3. 登录管理后台
4. 进入"百科同步管理"页面

---

## 🧪 功能测试

### 测试 1：添加角色功能

**操作步骤：**
1. 在"添加角色"输入框中输入：
   ```
   图书管理员
   哲学家
   洗衣妇
   ```
2. 点击"保存角色"按钮
3. 等待提示"添加完成"

**预期结果：**
- ✅ 显示"成功添加 3 个角色"
- ✅ 角色列表中显示3个新角色
- ✅ 状态均为"未同步"

**验证数据库：**
```javascript
// 在uniCloud Web控制台执行
db.collection('wiki_role_list').where({}).get()
```

---

### 测试 2：搜索功能

**操作步骤：**
1. 在搜索框输入"图书"
2. 等待0.5秒（防抖）

**预期结果：**
- ✅ 只显示包含"图书"的角色（图书管理员）
- ✅ 其他角色被过滤

---

### 测试 3：状态筛选

**操作步骤：**
1. 点击筛选下拉框
2. 选择"未同步"

**预期结果：**
- ✅ 只显示未同步的角色
- ✅ 已同步的角色被隐藏

---

### 测试 4：单个同步

**操作步骤：**
1. 找到"图书管理员"角色
2. 点击"同步"按钮
3. 确认同步
4. 等待同步完成

**预期结果：**
- ✅ 显示"同步完成"
- ✅ 角色状态变为"已同步"
- ✅ 显示最后同步时间
- ✅ wiki_entries中有新记录

**验证数据库：**
```javascript
// 查询同步结果
db.collection('wiki_entries')
  .where({ title: '图书管理员' })
  .get()
```

---

### 测试 5：批量同步

**操作步骤：**
1. 勾选"哲学家"和"洗衣妇"
2. 点击"批量同步"按钮
3. 确认同步
4. 等待同步完成

**预期结果：**
- ✅ 显示"同步完成：成功 2 个，失败 0 个"
- ✅ 两个角色状态变为"已同步"
- ✅ wiki_entries中有2条新记录

---

### 测试 6：删除功能

**操作步骤：**
1. 勾选一个角色
2. 点击"批量删除"按钮
3. 确认删除

**预期结果：**
- ✅ 显示"成功删除 1 个角色"
- ✅ 角色从列表中消失
- ✅ 数据库中记录已删除

---

### 测试 7：重复添加

**操作步骤：**
1. 再次输入"图书管理员"
2. 点击"保存角色"

**预期结果：**
- ✅ 提示"成功添加 0 个角色，1 个重复"
- ✅ 列表中不出现重复角色

---

## 🔍 常见问题排查

### 问题 1：添加角色后列表不显示

**排查步骤：**
1. 打开浏览器控制台，查看是否有错误
2. 检查云函数是否部署成功
3. 检查数据库是否创建成功

**解决方案：**
```javascript
// 手动刷新列表
this.loadRoleList()
```

---

### 问题 2：同步失败

**排查步骤：**
1. 查看角色的sync_error字段
2. 检查wiki-admin-sync-single云函数日志
3. 确认钟楼百科URL是否正确

**解决方案：**
- 手动访问URL验证页面是否存在
- 检查角色名称是否有特殊字符

---

### 问题 3：状态筛选不生效

**排查步骤：**
1. 检查statusOptions数组是否正确
2. 查看onStatusFilterChange是否触发

**解决方案：**
```javascript
// 手动触发筛选
this.statusFilterIndex = 1 // 已同步
this.loadRoleList()
```

---

## 📊 数据库结构

### wiki_role_list 集合

```javascript
{
  _id: "xxx",
  role_name: "图书管理员",
  role_url: "https://clocktower-wiki.gstonegames.com/index.php?title=图书管理员",
  is_synced: true,
  last_sync_time: 1697628000000,
  sync_status: "success",  // success/failed/pending
  sync_error: null,
  created_at: 1697628000000,
  updated_at: 1697628000000
}
```

---

## 🚀 性能优化建议

### 1. 搜索防抖
当前已实现500ms防抖，避免频繁查询

### 2. 分页加载
默认每页20条，可根据需要调整

### 3. 批量同步
建议每次批量同步不超过50个角色，避免超时

---

## 📝 维护建议

### 定期清理
定期清理失败的角色记录：
```javascript
db.collection('wiki_role_list')
  .where({ 
    sync_status: 'failed',
    updated_at: db.command.lt(Date.now() - 30*24*60*60*1000) // 30天前
  })
  .remove()
```

### 监控同步状态
定期检查同步失败的角色：
```javascript
db.collection('wiki_role_list')
  .where({ sync_status: 'failed' })
  .get()
```

---

## 🎉 部署完成

恭喜！Wiki v2.2 角色管理系统部署完成！

### 下一步建议
1. 添加常用角色到列表
2. 执行批量同步
3. 验证前端显示正常
4. 监控错误日志

---

## 📞 技术支持

如遇到问题，请提供以下信息：
1. 浏览器控制台截图
2. 云函数日志
3. 数据库查询结果
4. 具体操作步骤

---

**部署时间**: 预计 15-20 分钟  
**难度等级**: ⭐⭐☆☆☆（简单）

---

## 版本历史

- **v2.2** (2025-10-18): 角色管理系统重构
- **v2.1** (2025-10-18): 详细解析优化
- **v2.0** (2025-10-17): 初始版本

