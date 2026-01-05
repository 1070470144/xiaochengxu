# 管理端剧本编辑保存错误修复

## 🔍 问题诊断

### 错误信息
```
保存失败： te: 数据库验证失败：提交的字段["related_links","average_rating"]在本地数据表的schema文件中不存在
```

### 根本原因

在 `botc-admin/pages/botc/script/edit.vue` 中：

**问题代码（第 277-280 行）**：
```javascript
this.formData = {
  ...this.formData,
  ...res.result.data[0]  // 将数据库中的所有字段都复制到 formData
}
```

**保存代码（第 617-624 行）**：
```javascript
if (this.isEdit) {
  const updateData = { ...data }
  delete updateData._id  // 只删除了 _id
  
  await db.collection('botc-scripts')
    .doc(this.scriptId)
    .update(updateData)  // 尝试更新包括只读字段在内的所有字段
}
```

**问题分析**：
1. 加载数据时，将数据库中的**所有字段**（包括 `related_links`、`average_rating`、`rating_count` 等）都复制到 `formData`
2. 保存时，尝试更新这些只读字段或 schema 中不存在的字段
3. uniCloud 数据库的 schema 验证拒绝了这些字段的更新

## ✅ 修复方案

在更新数据前，过滤掉所有只读字段和 schema 中不存在的字段。

### 修复代码

**文件**：`botc-admin/pages/botc/script/edit.vue`

```javascript
if (this.isEdit) {
  // 更新时需要移除_id字段和只读字段（不能更新）
  const updateData = { ...data }
  delete updateData._id
  delete updateData.related_links  // schema中不存在或只读
  delete updateData.average_rating // 由评分系统自动计算
  delete updateData.rating_count   // 由评分系统自动计算
  delete updateData.created_at     // 创建时间不能修改
  
  await db.collection('botc-scripts')
    .doc(this.scriptId)
    .update(updateData)
}
```

## 📊 需要过滤的字段说明

| 字段 | 类型 | 原因 |
|------|------|------|
| `_id` | 系统字段 | MongoDB 的唯一标识，不能修改 |
| `related_links` | schema不存在 | 可能是旧版本字段或未在 schema 中定义 |
| `average_rating` | 计算字段 | 由评分系统自动计算，不应手动修改 |
| `rating_count` | 计算字段 | 由评分系统自动计算，不应手动修改 |
| `created_at` | 时间戳 | 创建时间，不应修改（只能在创建时设置） |

## 🎯 修复效果

### 修复前
- ❌ 保存剧本时报错：`数据库验证失败：提交的字段["related_links","average_rating"]在本地数据表的schema文件中不存在`
- ❌ 无法编辑已有剧本

### 修复后
- ✅ 正确过滤只读字段和不存在的字段
- ✅ 可以正常保存和更新剧本
- ✅ 不影响评分系统的计算字段

## 📝 最佳实践建议

### 1. 加载数据时使用白名单
更好的做法是只加载需要编辑的字段，而不是所有字段：

```javascript
async loadData() {
  try {
    const res = await db.collection('botc-scripts')
      .doc(this.scriptId)
      .field({
        // 只获取需要编辑的字段
        title: true,
        subtitle: true,
        author: true,
        script_type: true,
        difficulty: true,
        player_count: true,
        duration: true,
        description: true,
        tags: true,
        cover_image: true,
        user_images: true,
        preview_image: true,
        json_data: true,
        status: true,
        is_featured: true,
        published_at: true
      })
      .get()
    
    if (res.result.data && res.result.data.length > 0) {
      this.formData = {
        ...this.formData,
        ...res.result.data[0]
      }
    }
  } catch (error) {
    console.error('加载失败：', error)
  }
}
```

### 2. 使用更新字段白名单
也可以定义一个允许更新的字段列表：

```javascript
const UPDATABLE_FIELDS = [
  'title', 'subtitle', 'author', 'script_type', 'difficulty',
  'player_count', 'duration', 'description', 'tags',
  'cover_image', 'user_images', 'preview_image', 'json_data',
  'status', 'is_featured', 'published_at', 'updated_at'
]

if (this.isEdit) {
  const updateData = {}
  UPDATABLE_FIELDS.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  })
  
  await db.collection('botc-scripts')
    .doc(this.scriptId)
    .update(updateData)
}
```

## 🔧 测试建议

1. **编辑已有剧本**
   - 打开剧本列表，选择一个已有剧本
   - 点击编辑，修改任意字段
   - 保存，确认没有报错

2. **检查评分字段**
   - 编辑一个有评分的剧本
   - 保存后，确认 `average_rating` 和 `rating_count` 没有被意外修改

3. **检查创建时间**
   - 编辑一个旧剧本
   - 保存后，确认 `created_at` 没有变化

## 📋 相关字段说明

### botc-scripts 表结构（常见字段）

**可编辑字段**：
- `title` - 剧本标题
- `subtitle` - 副标题
- `author` - 作者
- `script_type` - 类型（1推理/2娱乐）
- `difficulty` - 难度（1-4）
- `player_count` - 玩家人数
- `duration` - 时长（分钟）
- `description` - 描述
- `tags` - 标签数组
- `cover_image` - 封面图
- `user_images` - 用户图片数组
- `preview_image` - 预览图
- `json_data` - JSON数据
- `status` - 状态（0待审核/1已发布/2已下架）
- `is_featured` - 是否精选
- `updated_at` - 更新时间

**只读/自动计算字段**：
- `_id` - 唯一标识
- `created_at` - 创建时间
- `average_rating` - 平均评分（由评分系统计算）
- `rating_count` - 评分人数（由评分系统计算）
- `view_count` - 浏览次数（由浏览系统更新）
- `download_count` - 下载次数（由下载系统更新）
- `favorite_count` - 收藏次数（由收藏系统更新）

---

**修复完成时间**：2025年1月7日  
**状态**：✅ 已修复，待测试


