# 批量导入默认值已更新

## ✅ 修改完成时间
2025-11-06

## 📋 默认值修改

根据用户要求，已将批量导入剧本的默认值修改为：

### 修改前
```javascript
status: script.status !== undefined ? script.status : 1,  // 默认：已发布
player_count: script.player_count || '',                  // 默认：空字符串
duration: script.duration || null,                         // 默认：null
```

### 修改后
```javascript
status: script.status !== undefined ? script.status : 0,  // 默认：待审核
player_count: script.player_count || '7-15',               // 默认：7-15
duration: script.duration !== undefined ? script.duration : 60,  // 默认：60分钟
```

## 🎯 新的默认值配置

| 字段 | 新默认值 | 说明 |
|------|---------|------|
| `status` | `0` | 待审核（需要管理员审核后才能发布） |
| `player_count` | `'7-15'` | 7-15人（标准剧本人数范围） |
| `duration` | `60` | 60分钟（标准剧本时长） |
| `script_type` | `1` | 推理（保持不变） |
| `difficulty` | `2` | 中等（保持不变） |

## 📊 完整的默认值列表

```javascript
const scriptData = {
  // 基本信息
  title: script.title || '未命名剧本',
  subtitle: script.subtitle || '',
  author: script.author || '',
  description: script.description || '',
  
  // 分类信息
  script_type: script.script_type || 1,           // 默认：推理
  difficulty: script.difficulty || 2,              // 默认：中等
  player_count: script.player_count || '7-15',    // 默认：7-15人 ✅ 新修改
  duration: script.duration !== undefined ? script.duration : 60,  // 默认：60分钟 ✅ 新修改
  
  // 状态信息
  status: script.status !== undefined ? script.status : 0,  // 默认：待审核 ✅ 新修改
  is_featured: script.is_featured || false,
  
  // 统计信息
  view_count: 0,
  download_count: 0,
  favorite_count: 0,
  share_count: 0,
  comment_count: 0,
  rating: 0,
  rating_count: 0,
  
  // 创建者和时间
  creator_id: script.creator_id || 'admin',
  created_at: script.created_at || Date.now(),
  updated_at: Date.now()
};
```

## 💡 修改说明

### 1. 状态默认为"待审核"
**原因**：批量导入的剧本应该先经过管理员审核，确认无误后再发布。

**好处**：
- ✅ 防止未经审核的内容直接发布
- ✅ 给管理员审核和编辑的机会
- ✅ 提高内容质量控制

### 2. 玩家人数默认为"7-15"
**原因**：大多数 BOTC 剧本的玩家人数在 7-15 人之间。

**好处**：
- ✅ 符合标准剧本配置
- ✅ 减少手动填写工作
- ✅ 列表显示更完整

### 3. 时长默认为60分钟
**原因**：标准 BOTC 游戏时长约为 60 分钟。

**好处**：
- ✅ 提供合理的时长参考
- ✅ 列表显示不再是空白
- ✅ 方便用户了解游戏时长

## 🔄 使用流程

### 批量导入后的工作流程
1. **导入**：批量导入JSON文件
2. **默认值**：系统自动设置默认值
   - 状态：待审核 ⏸️
   - 玩家人数：7-15
   - 时长：60分钟
3. **审核**：管理员在列表中查看"待审核"的剧本
4. **编辑**：点击"编辑"按钮，修改或补全信息
5. **发布**：审核通过后，将状态改为"已发布" ✅

## 📝 导入后的显示效果

导入一个新剧本后，在列表中会显示：

| 字段 | 显示值 |
|------|--------|
| 类型 | 推理 |
| 难度 | 中等 |
| 玩家人数 | 7-15 ✅ |
| 时长 | 60分 ✅ |
| 状态 | 待审核 ✅ |

## 🎯 下一步操作

### 1. 上传云对象（必须）
修改完成后，必须上传云对象才能生效：

```
在 HBuilderX 中：
1. 右键点击 botc-admin/uniCloud-aliyun/cloudfunctions/admin-script
2. 选择"上传部署"
3. 等待上传完成
```

### 2. 测试批量导入
1. 打开管理端剧本管理页面
2. 点击"批量导入JSON"
3. 选择JSON文件
4. 导入完成后查看列表

### 3. 验证默认值
导入后的剧本应该显示：
- ✅ **状态**：待审核（橙色标签）
- ✅ **玩家人数**：7-15
- ✅ **时长**：60分

### 4. 审核和发布
1. 点击"预览"查看剧本详情
2. 点击"编辑"修改或补全信息
3. 点击"审核"→"通过审核"将状态改为"已发布"

## 相关文件

- 📄 `botc-admin/uniCloud-aliyun/cloudfunctions/admin-script/index.obj.js` - 已修改
- 📄 `botc-admin/BATCH_IMPORT_FIX.md` - 批量导入修复文档
- 📄 `botc-admin/BATCH_IMPORT_DEFAULT_VALUES_UPDATED.md` - 本文档

---

**修改完成！请上传云对象后重新测试批量导入功能。** 🎉

**新导入的剧本将默认为"待审核"状态，玩家人数"7-15"，时长"60分钟"。**

