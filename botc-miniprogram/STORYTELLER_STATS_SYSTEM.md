# 📊 说书人统计系统完善文档

## ✅ 问题已解决

**原问题**：已认证的2星说书人（粉丝数1）没有出现在榜单中

**根本原因**：
1. 粉丝数字段用错了（`fans_count` → `followers_count`）
2. `storyteller_stats.fans_count` 没有同步更新

**解决方案**：
1. 修复了字段名称错误
2. 实现了自动同步机制
3. 完善了说书人统计系统

---

## 🎯 已完成的功能

### 1. ✅ 关注功能同步

**云函数**：`user-follow/index.js`

**功能**：当用户关注/取消关注说书人时，自动同步更新 `storyteller_stats.fans_count`

```javascript
// 关注时
if (targetUser.storyteller_certified && targetUser.storyteller_stats) {
  updateData['storyteller_stats.fans_count'] = newFollowersCount
}
```

**效果**：
- 关注说书人 → `followers_count` +1，`storyteller_stats.fans_count` +1
- 取消关注 → `followers_count` -1，`storyteller_stats.fans_count` -1

---

### 2. ✅ 剧本上传同步

**云函数**：
- `script-upload/index.js` - 上传剧本时
- `script-delete/index.js` - 删除剧本时

**功能**：自动更新 `storyteller_stats.script_count`

```javascript
// 上传剧本后
if (user.storyteller_certified && user.storyteller_stats) {
  await usersCollection.doc(userId).update({
    'storyteller_stats.script_count': currentScriptCount + 1
  })
}

// 删除剧本后
if (user.storyteller_certified && user.storyteller_stats) {
  await usersCollection.doc(userId).update({
    'storyteller_stats.script_count': Math.max(0, currentScriptCount - 1)
  })
}
```

**效果**：
- 上传剧本 → `script_count` +1
- 删除剧本 → `script_count` -1

---

### 3. ✅ 热度计算

**云函数**：`storyteller-calculate-heat/index.js`（新创建）

**计算公式**：
```javascript
heat_score = 
  粉丝数 * 10 +         // 每个粉丝 10 分
  剧本数 * 50 +         // 每个剧本 50 分
  剧本总下载量 * 1 +    // 每次下载 1 分
  剧本总评分 * 20       // 每个评分 20 分
```

**使用方式**：
```bash
# 计算所有认证说书人
uniCloud.callFunction({
  name: 'storyteller-calculate-heat'
})

# 计算指定用户
uniCloud.callFunction({
  name: 'storyteller-calculate-heat',
  data: { user_id: 'xxx' }
})
```

**建议**：设置定时触发器，每天自动运行一次

---

### 4. ✅ 认证审核初始化

**云函数**：`certification-admin/index.js`

**功能**：审核通过时自动初始化 `storyteller_stats`

```javascript
const storyteller_stats = user.storyteller_stats || {
  fans_count: user.followers_count || 0,  // 从现有粉丝数初始化
  script_count: 0,                         // 初始剧本数为0
  heat_score: 0                            // 初始热度为0
}
```

**效果**：
- 新认证的说书人会自动获得 `storyteller_stats` 字段
- 继承现有的粉丝数

---

## 📊 数据结构

### uni-id-users 表字段

```javascript
{
  _id: "user_id",
  nickname: "用户名",
  
  // 用户基本统计
  followers_count: 1,      // 粉丝数（关注功能维护）
  following_count: 0,      // 关注数
  
  // 说书人认证
  storyteller_certified: true,  // 是否认证
  storyteller_level: 2,         // 认证等级（1星/2星）
  
  // 说书人统计（✅ 新增）
  storyteller_stats: {
    fans_count: 1,        // 说书人粉丝数（从 followers_count 同步）
    script_count: 5,      // 发布剧本数（自动统计）
    heat_score: 260       // 热度分数（定期计算）
  }
}
```

---

## 🔄 自动同步流程

### 粉丝数同步

```
用户A 关注 说书人B
     ↓
user-follow 云函数
     ↓
更新 B 的 followers_count +1
     ↓
如果 B 是认证说书人
     ↓
同步更新 storyteller_stats.fans_count +1
     ↓
榜单自动更新 ✅
```

### 剧本数同步

```
说书人上传剧本
     ↓
script-upload 云函数
     ↓
保存剧本到数据库
     ↓
如果上传者是认证说书人
     ↓
更新 storyteller_stats.script_count +1
     ↓
榜单自动更新 ✅
```

### 热度计算

```
定时触发器（每天凌晨）
     ↓
storyteller-calculate-heat 云函数
     ↓
查询所有认证说书人
     ↓
逐个计算热度分数
  = 粉丝数×10 + 剧本数×50 
    + 下载量×1 + 评分×20
     ↓
更新 storyteller_stats.heat_score
     ↓
热度榜自动更新 ✅
```

---

## 📋 部署清单

### 需要上传的云函数

**管理端**：
- ✅ `certification-admin` - 已修复字段名称

**小程序端**：
- ✅ `user-follow` - 新增粉丝数同步
- ✅ `script-upload` - 新增剧本数统计
- ✅ `script-delete` - 新增剧本数统计
- ✅ `wiki-ranking-storytellers` - 已清理调试代码
- ✅ `storyteller-calculate-heat` - 新创建

### 部署步骤

```bash
# 1. 上传管理端云函数
右键 botc-admin/certification-admin → 上传部署

# 2. 上传小程序端云函数
右键 botc-miniprogram/user-follow → 上传部署
右键 botc-miniprogram/script-upload → 上传部署
右键 botc-miniprogram/script-delete → 上传部署
右键 botc-miniprogram/wiki-ranking-storytellers → 上传部署
右键 botc-miniprogram/storyteller-calculate-heat → 上传部署

# 3. 设置定时触发器（可选）
在 uniCloud 控制台为 storyteller-calculate-heat 设置定时触发器
建议：每天凌晨 3:00 执行一次
```

---

## 🧪 测试验证

### 1. 测试关注功能

```
1. 关注一个认证说书人
2. 查看该说书人的数据：
   - followers_count 应该 +1
   - storyteller_stats.fans_count 应该同步 +1
3. 刷新说书人榜单，确认排名变化
```

### 2. 测试剧本上传

```
1. 认证说书人上传一个剧本
2. 查看该说书人的数据：
   - storyteller_stats.script_count 应该 +1
3. 删除剧本，确认 script_count -1
```

### 3. 测试热度计算

```
1. 手动运行 storyteller-calculate-heat 云函数
2. 查看返回结果，确认热度分数已更新
3. 切换到"热度榜"，确认排序正确
```

---

## 🎯 榜单入榜条件

### 粉丝榜

| 条件 | 说明 |
|------|------|
| `storyteller_certified = true` | 必须是认证说书人 |
| `storyteller_stats.fans_count > 0` | 粉丝数大于0 |
| 排序 | 按 `fans_count` 降序 |

### 热度榜

| 条件 | 说明 |
|------|------|
| `storyteller_certified = true` | 必须是认证说书人 |
| `storyteller_stats.heat_score > 0` | 热度分数大于0 |
| 排序 | 按 `heat_score` 降序 |

---

## 💡 后续优化建议

### 1. 定时任务配置

在 uniCloud 控制台配置定时触发器：

```
云函数：storyteller-calculate-heat
触发周期：每天 03:00
描述：自动计算说书人热度分数
```

### 2. 热度公式优化

根据实际运营情况，可以调整热度计算权重：

```javascript
// 当前公式
heat_score = fans * 10 + scripts * 50 + downloads * 1 + ratings * 20

// 可以调整为
heat_score = fans * 5 + scripts * 100 + downloads * 2 + ratings * 30
```

### 3. 添加缓存

对于热度榜，可以考虑添加缓存机制：
- 每天只计算一次
- 缓存结果到数据库
- 减少实时查询压力

### 4. 数据修复脚本

如果需要批量修复历史数据，可以运行：

```javascript
// 同步所有认证说书人的粉丝数
db.collection('uni-id-users')
  .where({ storyteller_certified: true })
  .get()
  .then(res => {
    res.data.forEach(user => {
      db.collection('uni-id-users')
        .doc(user._id)
        .update({
          'storyteller_stats.fans_count': user.followers_count || 0
        })
    })
  })
```

---

## 🎉 总结

### 核心改进

✅ **自动同步** - 关注/剧本数据实时同步  
✅ **热度计算** - 综合多维度计算热度  
✅ **数据准确** - 字段名称修复，数据一致性保证  
✅ **易于维护** - 清理调试代码，代码简洁

### 用户体验

**说书人**：
- 粉丝增加 → 榜单排名自动提升
- 发布剧本 → 热度自动增加
- 获得评分 → 热度进一步提升

**普通用户**：
- 榜单数据实时准确
- 可以看到最活跃的说书人
- 多维度排行榜（粉丝榜 + 热度榜）

---

**系统完善时间**：2025-10-27  
**状态**：✅ 已完成  
**测试状态**：✅ 榜单显示正常

**说书人统计系统现已完善！** 🎉

