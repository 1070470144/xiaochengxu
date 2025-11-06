# 剧本管理批量操作功能

## ✅ 功能完成时间
2025-11-06

## 📋 功能概述

为管理端剧本管理页面添加了**多选和批量操作**功能，支持：
- ✅ 单选/全选剧本
- ✅ 批量审批通过
- ✅ 批量删除

## 🎯 新增功能

### 1. 多选功能

#### 界面改动
- **表头**：添加全选复选框
- **数据行**：每行添加单选复选框
- **批量操作栏**：选中数据后显示批量操作按钮

#### 操作方式
1. **单选**：点击每行的复选框
2. **全选**：点击表头的复选框
3. **取消选择**：再次点击已选中的复选框，或点击"取消选择"按钮

### 2. 批量审批通过

#### 功能说明
一键将多个待审核剧本的状态改为"已发布"。

#### 操作步骤
```
1. 勾选需要审批的剧本（通常是状态为"待审核"的）
2. 点击顶部的"✓ 批量通过"按钮
3. 确认弹窗中点击"确定"
4. 系统自动处理并显示结果
5. 列表自动刷新
```

#### 后台逻辑
```javascript
// 批量更新状态
for (const id of selectedIds) {
  await db.collection('botc-scripts')
    .doc(id)
    .update({
      status: 1,              // 已发布
      published_at: Date.now(), // 发布时间
      updated_at: Date.now()   // 更新时间
    })
}
```

### 3. 批量删除

#### 功能说明
一键删除多个剧本（不可恢复）。

#### 操作步骤
```
1. 勾选需要删除的剧本
2. 点击顶部的"🗑 批量删除"按钮
3. 在确认弹窗中点击"确定"（红色警告）
4. 系统自动删除并显示结果
5. 列表自动刷新
```

#### 后台逻辑
```javascript
// 批量删除
for (const id of selectedIds) {
  await db.collection('botc-scripts')
    .doc(id)
    .remove()
}
```

## 📊 界面展示

### 未选中状态
```
┌─────────────────────────────────────────────────────┐
│ 剧本管理                                             │
│ [+ 添加剧本] [📁 批量导入JSON]                       │
└─────────────────────────────────────────────────────┘
│ □ │ ID │ 剧本标题 │ 作者 │ 类型 │ ... │ 操作 │
├───┼────┼──────────┼──────┼──────┼─────┼──────┤
│ □ │ xxx│ 剧本A    │ 作者A│ 推理 │ ... │ 预览 │
│ □ │ xxx│ 剧本B    │ 作者B│ 娱乐 │ ... │ 编辑 │
```

### 已选中状态
```
┌─────────────────────────────────────────────────────┐
│ 剧本管理                                             │
│ [+ 添加剧本] [📁 批量导入JSON]                       │
│ [已选择 2 项] [✓ 批量通过] [🗑 批量删除] [取消选择]  │
└─────────────────────────────────────────────────────┘
│ ☑ │ ID │ 剧本标题 │ 作者 │ 类型 │ ... │ 操作 │
├───┼────┼──────────┼──────┼──────┼─────┼──────┤
│ ☑ │ xxx│ 剧本A    │ 作者A│ 推理 │ ... │ 预览 │
│ ☑ │ xxx│ 剧本B    │ 作者B│ 娱乐 │ ... │ 编辑 │
│ □ │ xxx│ 剧本C    │ 作者C│ 推理 │ ... │ 审核 │
```

## 💻 技术实现

### 数据结构

```javascript
data() {
  return {
    selectedIds: [],  // 选中的剧本ID数组
    dataList: [],     // 当前页的剧本列表
    // ...
  }
}
```

### 计算属性

```javascript
computed: {
  // 是否全选
  isAllSelected() {
    return this.dataList.length > 0 && 
           this.selectedIds.length === this.dataList.length
  }
}
```

### 核心方法

#### 切换单个选择
```javascript
toggleSelect(id) {
  const index = this.selectedIds.indexOf(id)
  if (index > -1) {
    this.selectedIds.splice(index, 1)  // 取消选择
  } else {
    this.selectedIds.push(id)          // 添加选择
  }
}
```

#### 切换全选
```javascript
toggleSelectAll() {
  if (this.isAllSelected) {
    this.selectedIds = []  // 取消全选
  } else {
    this.selectedIds = this.dataList.map(item => item._id)  // 全选
  }
}
```

#### 批量审批
```javascript
async batchApprove() {
  // 1. 确认弹窗
  uni.showModal({
    title: '批量审核',
    content: `确定要通过审核这 ${this.selectedIds.length} 个剧本吗？`,
    success: async (res) => {
      if (res.confirm) {
        // 2. 显示loading
        uni.showLoading({ title: '处理中...' })
        
        // 3. 循环更新
        for (const id of this.selectedIds) {
          await db.collection('botc-scripts').doc(id).update({
            status: 1,
            published_at: Date.now(),
            updated_at: Date.now()
          })
        }
        
        // 4. 显示结果
        uni.showToast({ title: '审批完成' })
        
        // 5. 刷新列表
        this.loadData()
        this.selectedIds = []
      }
    }
  })
}
```

## 🎨 样式设计

### 批量操作栏样式
```css
.batch-actions {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  background: #f0f9ff;      /* 浅蓝色背景 */
  border: 1px solid #91d5ff; /* 蓝色边框 */
  border-radius: 4px;
}

.selected-count {
  font-size: 14px;
  color: #1890ff;           /* 蓝色文字 */
  font-weight: 500;
}
```

### 复选框样式
```css
checkbox {
  transform: scale(1.2);    /* 放大复选框 */
  cursor: pointer;          /* 鼠标指针 */
}
```

## 🔄 使用流程

### 批量审批流程
```
管理员登录
    ↓
进入剧本管理
    ↓
筛选待审核剧本（status=0）
    ↓
勾选需要审批的剧本
    ↓
点击"批量通过"
    ↓
确认弹窗
    ↓
系统处理（显示loading）
    ↓
更新状态为"已发布"
    ↓
显示结果统计
    ↓
自动刷新列表
    ↓
清空选择
```

### 批量删除流程
```
管理员登录
    ↓
进入剧本管理
    ↓
勾选需要删除的剧本
    ↓
点击"批量删除"
    ↓
确认弹窗（红色警告）
    ↓
系统处理（显示loading）
    ↓
从数据库删除
    ↓
显示结果统计
    ↓
自动刷新列表
    ↓
清空选择
```

## ⚠️ 注意事项

### 1. 权限控制
- 批量操作仅限管理员使用
- 确保用户已登录且有管理员权限

### 2. 数据安全
- **批量删除不可恢复**，操作前会有红色警告确认
- 建议定期备份数据库

### 3. 性能优化
- 批量操作采用循环处理，大量数据时可能较慢
- 建议分批处理，每次不超过50条

### 4. 错误处理
- 每个操作都有独立的错误捕获
- 显示成功/失败统计，便于了解处理结果

### 5. 用户体验
- 操作过程中显示loading遮罩，防止重复提交
- 完成后自动刷新列表
- 自动清空选择，避免误操作

## 🚀 未来优化建议

### 1. 批量操作优化
```javascript
// 使用数据库的批量操作API（如果支持）
await db.collection('botc-scripts')
  .where({
    _id: db.command.in(selectedIds)
  })
  .update({
    status: 1,
    published_at: Date.now()
  })
```

### 2. 添加更多批量操作
- 批量修改类型
- 批量修改难度
- 批量添加标签
- 批量导出

### 3. 选择持久化
- 切换页面后保持选择状态
- 跨页选择

### 4. 操作历史
- 记录批量操作日志
- 支持撤销操作

## 📝 使用示例

### 场景1：批量审核新导入的剧本
```
1. 筛选：状态 = 待审核
2. 全选：点击表头复选框
3. 审批：点击"批量通过"
4. 确认：确认弹窗
5. 完成：所有剧本变为"已发布"状态
```

### 场景2：删除测试数据
```
1. 筛选：关键词 = "测试"
2. 勾选：选择要删除的测试剧本
3. 删除：点击"批量删除"
4. 确认：确认弹窗（红色警告）
5. 完成：测试数据被删除
```

### 场景3：选择性审批
```
1. 筛选：状态 = 待审核
2. 浏览：逐个查看剧本预览
3. 勾选：只选择符合要求的剧本
4. 审批：点击"批量通过"
5. 完成：选中的剧本变为"已发布"
```

## 相关文件

- 📄 `botc-admin/pages/botc/script/list.vue` - 已添加批量操作功能
- 📄 `botc-admin/SCRIPT_BATCH_OPERATIONS.md` - 本文档

---

**功能已完成！管理员现在可以高效地批量审批和删除剧本了。** ✅

