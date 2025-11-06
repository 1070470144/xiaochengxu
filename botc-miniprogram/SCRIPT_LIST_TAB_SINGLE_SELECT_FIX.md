# 剧本列表页签单选修复

## ✅ 修复完成时间
2025-11-06

## 🔍 问题描述

用户反馈：剧本查找页面的页签应该是单选切换，但"娱乐"和"高分"可以同时高亮显示。

### 问题截图描述
```
页签：[全部] [最新] [最热] [推理] [娱乐✓] [高分✓]
                                    ↑同时高亮↑
```

### 根本原因

#### 1. 模板高亮逻辑错误

**原代码**：
```vue
<!-- 推理 -->
<text :class="['filter-item', 
  currentType === 'mystery' || currentType === 'mystery-rating' ? 'active' : '']">
  推理
</text>

<!-- 娱乐 -->
<text :class="['filter-item', 
  currentType === 'fun' || currentType === 'fun-rating' ? 'active' : '']">
  娱乐
</text>

<!-- 高分 -->
<text :class="['filter-item', 
  currentType === 'rating' || currentType === 'mystery-rating' || currentType === 'fun-rating' ? 'active' : '']">
  高分
</text>
```

**问题**：
- 当 `currentType = 'fun-rating'` 时
  - "娱乐" tab：`'fun-rating' === 'fun' || 'fun-rating' === 'fun-rating'` → ✅ active
  - "高分" tab：`'fun-rating' === 'rating' || ... || 'fun-rating' === 'fun-rating'` → ✅ active
  - **结果**：两个 tab 同时高亮 ❌

#### 2. 复杂的组合类型逻辑

原代码设计了组合类型（`mystery-rating`、`fun-rating`），试图实现"推理 + 高分"、"娱乐 + 高分"的组合筛选。但这违反了单选页签的设计原则。

## 🛠️ 修复方案

### 1. 简化页签高亮逻辑

**修改前**（允许多个tab同时高亮）：
```vue
<text :class="['filter-item', 
  currentType === 'mystery' || currentType === 'mystery-rating' ? 'active' : '']">
  推理
</text>
```

**修改后**（严格单选）：
```vue
<text :class="['filter-item', 
  currentType === 'mystery' ? 'active' : '']">
  推理
</text>
```

### 2. 移除组合类型逻辑

**修改前**（复杂的切换逻辑）：
```javascript
changeType(type) {
  // 处理组合类型逻辑
  let targetType = type
  
  if (type === 'mystery' && this.currentType === 'mystery-rating') {
    targetType = 'mystery'
  } else if (type === 'rating') {
    if (this.currentType === 'mystery') {
      targetType = 'mystery-rating'  // 组合类型
    } else if (this.currentType === 'fun') {
      targetType = 'fun-rating'  // 组合类型
    }
  }
  
  this.currentType = targetType
  this.refreshList()
}
```

**修改后**（简单直接）：
```javascript
changeType(type) {
  // 点击相同的tab，不处理
  if (this.currentType === type) return
  
  // 直接切换类型，不做复杂的组合逻辑
  // 每个tab都是独立的，互斥选择
  this.currentType = type
  this.refreshList()
}
```

### 3. 简化查询逻辑

**修改前**（支持组合类型）：
```javascript
// 处理类型筛选（支持组合类型）
if (this.currentType === 'mystery' || this.currentType === 'mystery-rating') {
  whereCondition.script_type = 1
} else if (this.currentType === 'fun' || this.currentType === 'fun-rating') {
  whereCondition.script_type = 2
}

// 排序
if (this.currentType === 'rating' || 
    this.currentType === 'mystery-rating' || 
    this.currentType === 'fun-rating') {
  orderByField = 'average_rating'
}
```

**修改后**（只支持基础类型）：
```javascript
// 处理类型筛选
if (this.currentType === 'mystery') {
  whereCondition.script_type = 1  // 推理
} else if (this.currentType === 'fun') {
  whereCondition.script_type = 2  // 娱乐
}

// 排序
if (this.currentType === 'rating') {
  orderByField = 'average_rating'  // 高分
}
```

## 📊 页签功能说明

### 修复后的页签列表

| 页签 | 功能 | 筛选条件 | 排序方式 |
|------|------|----------|----------|
| 全部 | 显示所有剧本 | status=1（已发布） | 按发布时间倒序 |
| 最新 | 显示最新剧本 | status=1 | 按发布时间倒序 |
| 最热 | 显示最热剧本 | status=1 | 按热度分数倒序 |
| 推理 | 显示推理剧本 | status=1 + script_type=1 | 按发布时间倒序 |
| 娱乐 | 显示娱乐剧本 | status=1 + script_type=2 | 按发布时间倒序 |
| 高分 | 显示高分剧本 | status=1 | 按平均评分倒序 |

### 交互逻辑

**单选互斥**：
- 点击任意页签，其他页签自动取消高亮
- 同一时刻只有一个页签处于激活状态
- 点击当前已激活的页签，不触发刷新

**示例**：
```
初始状态：[全部✓] [最新] [最热] [推理] [娱乐] [高分]
点击"推理" → [全部] [最新] [最热] [推理✓] [娱乐] [高分]
点击"高分" → [全部] [最新] [最热] [推理] [娱乐] [高分✓]
点击"娱乐" → [全部] [最新] [最热] [推理] [娱乐✓] [高分]
```

## 🎯 修复效果对比

### 修复前 ❌

```
点击"娱乐" → [娱乐✓] ... 
点击"高分" → [娱乐✓] [高分✓]  ← 两个同时高亮
```

**问题**：
- 违反单选原则
- 用户困惑：到底选的是什么？
- 视觉混乱

### 修复后 ✅

```
点击"娱乐" → [娱乐✓]
点击"高分" → [高分✓]  ← 只有一个高亮
```

**优点**：
- 符合单选设计
- 状态清晰
- 交互简单

## 💡 设计原则

### 1. 单一职责
每个页签有且只有一个明确的功能：
- "推理" = 显示推理剧本
- "娱乐" = 显示娱乐剧本
- "高分" = 显示高分剧本

### 2. 互斥选择
同一时刻只能选择一个页签，避免状态混乱。

### 3. 简单明确
用户点击哪个页签，就显示对应的内容，无需理解复杂的组合逻辑。

## 🧪 测试用例

### 测试用例1：基础切换
```
1. 打开剧本列表（默认"全部"）✓
2. 点击"推理" → 只有"推理"高亮 ✓
3. 点击"娱乐" → 只有"娱乐"高亮 ✓
4. 点击"高分" → 只有"高分"高亮 ✓
```

### 测试用例2：重复点击
```
1. 点击"推理" → "推理"高亮
2. 再次点击"推理" → "推理"仍高亮，不刷新 ✓
```

### 测试用例3：快速切换
```
1. 点击"推理" → "推理"高亮
2. 点击"娱乐" → "娱乐"高亮，"推理"取消 ✓
3. 点击"高分" → "高分"高亮，"娱乐"取消 ✓
4. 点击"最热" → "最热"高亮，"高分"取消 ✓
```

### 测试用例4：验证数据
```
1. 点击"推理" → 显示的都是 script_type=1 的剧本 ✓
2. 点击"娱乐" → 显示的都是 script_type=2 的剧本 ✓
3. 点击"高分" → 按 average_rating 降序排列 ✓
```

## 📝 代码清理

### 移除的概念
- ❌ `mystery-rating`（推理高分榜）
- ❌ `fun-rating`（娱乐高分榜）
- ❌ 组合类型切换逻辑
- ❌ 多tab同时高亮

### 保留的功能
- ✅ 6个基础页签
- ✅ 单选互斥
- ✅ 独立的筛选和排序
- ✅ 点击刷新数据

## 🎨 用户体验提升

### 修复前
- ❌ 用户：点了"娱乐"又点"高分"，两个都亮了，现在到底是什么状态？
- ❌ 困惑、不确定

### 修复后
- ✅ 用户：点击"娱乐"就是看娱乐剧本
- ✅ 用户：点击"高分"就是看高分剧本
- ✅ 清晰、确定

## 相关文件

- 📄 `botc-miniprogram/pages/script/list/list.vue` - 已修复
- 📄 `botc-miniprogram/SCRIPT_LIST_TAB_FILTER_FIX.md` - 之前的筛选修复
- 📄 `botc-miniprogram/SCRIPT_LIST_TAB_SINGLE_SELECT_FIX.md` - 本文档

---

**页签单选问题已修复！现在每次只能选中一个页签，符合单选设计原则。** ✅

