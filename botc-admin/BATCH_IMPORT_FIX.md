# 批量导入JSON剧本数据显示问题修复

## 问题描述
用户反馈：管理端-剧本管理，批量导入JSON剧本提示上传成功但是数据没有正常显示。

## 问题根因

### 原有代码问题
在 `admin-script` 云对象的 `batchImport` 方法中，直接将解析的 JSON 数据插入数据库，**没有确保必需字段有默认值**。

```javascript
// 原有代码（有问题）
script.created_at = script.created_at || Date.now();
script.updated_at = Date.now();
const res = await db.collection('botc-scripts').add(script);
```

**问题**：
- 如果 JSON 文件中没有 `script_type` 字段 → 数据库中该字段为 `undefined`
- 如果 JSON 文件中没有 `difficulty` 字段 → 数据库中该字段为 `undefined`
- 如果 JSON 文件中没有 `status` 字段 → 数据库中该字段为 `undefined`
- 如果 JSON 文件中没有 `player_count` 字段 → 数据库中该字段为 `undefined`

**结果**：虽然数据插入成功，但在列表页面显示时，这些字段因为是 `undefined` 而无法正确渲染。

## 修复方案

### 修改内容

在插入数据库之前，**构建一个完整的 `scriptData` 对象**，为所有必需字段设置默认值。

```javascript
// 🔧 确保必要字段有默认值
const scriptData = {
  // 基本信息
  title: script.title || '未命名剧本',
  subtitle: script.subtitle || '',
  author: script.author || '',
  description: script.description || '',
  
  // 分类信息（设置默认值）
  script_type: script.script_type || 1,  // 默认：推理
  difficulty: script.difficulty || 2,     // 默认：中等
  player_count: script.player_count || '',
  duration: script.duration || null,
  
  // JSON数据
  json_data: script.json_data || [],
  
  // 图片
  cover_image: script.cover_image || '',
  preview_image: previewImage || script.preview_image || '',
  user_images: script.user_images || [],
  
  // 标签和链接
  tags: script.tags || [],
  related_links: script.related_links || [],
  
  // 状态信息（设置默认值）
  status: script.status !== undefined ? script.status : 1,  // 默认：已发布
  is_featured: script.is_featured || false,
  
  // 统计信息
  view_count: script.view_count || 0,
  download_count: script.download_count || 0,
  favorite_count: script.favorite_count || 0,
  share_count: script.share_count || 0,
  comment_count: script.comment_count || 0,
  rating: script.rating || 0,
  rating_count: script.rating_count || 0,
  
  // 创建者和时间
  creator_id: script.creator_id || 'admin',
  created_at: script.created_at || Date.now(),
  updated_at: Date.now()
};

// 直接插入数据库
const res = await db.collection('botc-scripts').add(scriptData);
```

## 默认值说明

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `script_type` | `1` | 推理类型 |
| `difficulty` | `2` | 中等难度 |
| `status` | `1` | 已发布状态 |
| `player_count` | `''` | 空字符串 |
| `duration` | `null` | 空值 |
| `view_count` | `0` | 浏览量初始为0 |
| `download_count` | `0` | 下载量初始为0 |
| `favorite_count` | `0` | 收藏量初始为0 |
| `rating` | `0` | 评分初始为0 |
| `creator_id` | `'admin'` | 创建者为管理员 |

## 修复效果

### 修复前
批量导入的剧本数据：
```json
{
  "title": "大权在握v4",
  "json_data": [...],
  // script_type、difficulty、status 等字段缺失
}
```

插入数据库后，列表页面显示：
- **类型**：（空白）
- **难度**：（空白）
- **状态**：（空白）

### 修复后
批量导入的剧本数据：
```json
{
  "title": "大权在握v4",
  "json_data": [...],
  "script_type": 1,      // ✅ 自动补全
  "difficulty": 2,        // ✅ 自动补全
  "status": 1,           // ✅ 自动补全
  "view_count": 0,       // ✅ 自动补全
  "creator_id": "admin"  // ✅ 自动补全
  // ... 其他字段也都有默认值
}
```

插入数据库后，列表页面显示：
- **类型**：推理 ✅
- **难度**：中等 ✅
- **状态**：已发布 ✅

## 使用说明

### 1. 上传云对象
修改完成后，需要将 `admin-script` 云对象上传到云端：

1. 在 HBuilderX 中右键点击 `botc-admin/uniCloud-aliyun/cloudfunctions/admin-script`
2. 选择"上传部署"
3. 等待上传完成

### 2. 重新测试批量导入

1. 打开管理端剧本管理页面
2. 点击"批量导入JSON"按钮
3. 选择 JSON 文件或文件夹
4. 点击"开始导入"
5. 等待导入完成
6. 刷新列表，查看数据是否正常显示

### 3. 验证字段显示

导入后的剧本应该显示：
- ✅ **类型**：推理（如果JSON中有此字段则显示JSON中的值）
- ✅ **难度**：中等（如果JSON中有此字段则显示JSON中的值）
- ✅ **玩家人数**：-（如果JSON中没有此字段）
- ✅ **时长**：-（如果JSON中没有此字段）
- ✅ **状态**：已发布（如果JSON中有此字段则显示JSON中的值）

## 现有数据修复

如果之前已经导入了数据但显示不正常，可以通过以下方式修复：

### 方案A：重新导入（推荐）
1. 删除之前导入失败的数据
2. 上传修复后的云对象
3. 重新批量导入

### 方案B：数据库批量更新
在 uniCloud Web控制台执行：

```javascript
// 为所有缺少 script_type 的剧本设置默认值
db.collection('botc-scripts')
  .where({
    script_type: db.command.or([
      db.command.eq(null),
      db.command.eq(undefined),
      db.command.exists(false)
    ])
  })
  .update({
    script_type: 1
  })

// 为所有缺少 difficulty 的剧本设置默认值
db.collection('botc-scripts')
  .where({
    difficulty: db.command.or([
      db.command.eq(null),
      db.command.eq(undefined),
      db.command.exists(false)
    ])
  })
  .update({
    difficulty: 2
  })

// 为所有缺少 status 的剧本设置默认值
db.collection('botc-scripts')
  .where({
    status: db.command.or([
      db.command.eq(null),
      db.command.eq(undefined),
      db.command.exists(false)
    ])
  })
  .update({
    status: 1
  })
```

## 相关文件

- 📄 `botc-admin/uniCloud-aliyun/cloudfunctions/admin-script/index.obj.js` - 已修复
- 📄 `botc-admin/BATCH_IMPORT_FIX.md` - 本文档

## 下一步

1. ✅ 修复代码已完成
2. ⏳ **请上传 `admin-script` 云对象到云端**
3. ⏳ **重新测试批量导入功能**
4. ⏳ 如有问题，查看云函数日志进行排查

---

**修复完成！请上传云对象后重新测试批量导入功能。** 🎉
