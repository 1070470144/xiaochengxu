# 📋 说书人榜单修复 - 部署指南

## ✅ 问题已解决

已认证的说书人现在可以正常出现在榜单中。

---

## 🚀 部署步骤

### 步骤1：上传管理端云函数

```
右键 botc-admin/uniCloud-aliyun/cloudfunctions/certification-admin
→ 上传部署
→ 等待上传完成
```

**作用**：今后新认证的说书人会自动初始化统计数据

---

### 步骤2：上传小程序端云函数

```
右键 botc-miniprogram/uniCloud-aliyun/cloudfunctions/user-follow
→ 上传部署

右键 botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-upload
→ 上传部署

右键 botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-delete
→ 上传部署

右键 botc-miniprogram/uniCloud-aliyun/cloudfunctions/wiki-ranking-storytellers
→ 上传部署

右键 botc-miniprogram/uniCloud-aliyun/cloudfunctions/storyteller-calculate-heat
→ 上传部署
```

**作用**：
- `user-follow` - 关注时自动同步粉丝数
- `script-upload` - 上传剧本时自动统计
- `script-delete` - 删除剧本时自动统计
- `wiki-ranking-storytellers` - 榜单查询（已优化）
- `storyteller-calculate-heat` - 热度计算（新功能）

---

### 步骤3：配置定时任务（重要！）

**⚠️ 必须配置，否则热度榜将始终为空！**

#### 方法A：通过 HBuilderX（推荐）

```
1. 右键 storyteller-calculate-heat → 管理定时触发器
2. 点击"新增触发器"
3. 配置：
   - 触发器名称：每日计算说书人热度
   - Cron 表达式：0 3 * * *
   - 时区：Asia/Shanghai
   - 启用：✅
4. 点击"确定"
```

#### 方法B：通过 Web 控制台

```
1. 打开 uniCloud Web 控制台
2. 进入 "云函数" → "storyteller-calculate-heat"
3. 切换到 "定时触发" 标签
4. 点击 "新增触发器"
5. 配置：
   - Cron 表达式：0 3 * * *
   - 时区：Asia/Shanghai
   - 启用：✅
6. 保存
```

**Cron 说明**：`0 3 * * *` = 每天凌晨3点执行

**详细配置指南**：请查看 `botc-miniprogram/HEAT_SCORE_AUTO_CALCULATE_SETUP.md`

---

## 🧪 测试验证

### 测试1：查看榜单

1. 打开小程序
2. 进入 **工具** → **榜单** → **说书人榜**
3. 确认能看到已认证的说书人 ✅

### 测试2：测试关注功能

1. 关注一个认证说书人
2. 刷新榜单，确认排名变化 ✅

### 测试3：测试剧本上传

1. 认证说书人上传剧本
2. 查看榜单，确认统计更新 ✅

### 测试4：手动运行热度计算

```
右键 storyteller-calculate-heat → 云端运行
查看返回结果，确认热度已更新 ✅
```

---

## 📊 修复内容总结

| 功能 | 状态 | 说明 |
|------|------|------|
| **粉丝数同步** | ✅ | 关注/取消关注时自动更新 |
| **剧本数统计** | ✅ | 上传/删除剧本时自动更新 |
| **热度计算** | ✅ | 综合多维度计算热度分数 |
| **认证初始化** | ✅ | 审核通过时自动初始化数据 |
| **榜单查询** | ✅ | 修复字段名称错误 |

---

## 💡 使用说明

### 粉丝榜

- **条件**：粉丝数 > 0
- **排序**：按粉丝数降序
- **实时更新**：关注时自动同步

### 热度榜

- **条件**：热度分数 > 0
- **排序**：按热度分数降序
- **更新频率**：每天凌晨自动计算（如果配置了定时任务）

### 热度计算公式

```
热度分数 = 粉丝数 × 10 + 剧本数 × 50 + 下载量 × 1 + 评分 × 20
```

---

## 📝 注意事项

### 1. 已认证但数据未初始化的用户

如果有用户在修复前已经认证，但 `storyteller_stats.fans_count` 还是 0：

**手动修复方法**：
1. 打开 uniCloud Web 控制台
2. 进入 "云数据库" → `uni-id-users`
3. 找到该用户
4. 编辑 `storyteller_stats.fans_count`，改为与 `followers_count` 相同的值
5. 保存

### 2. 定时任务首次运行

定时任务配置后不会立即执行，会在下次触发时间运行。

如果需要立即计算热度：
```
右键 storyteller-calculate-heat → 云端运行
```

### 3. 榜单缓存

榜单数据可能有缓存，如果没有立即看到变化：
- 重新进入榜单页面
- 或切换其他标签页再切回来

---

## 🎯 完成检查清单

- [ ] ✅ 上传 certification-admin 云函数
- [ ] ✅ 上传 user-follow 云函数
- [ ] ✅ 上传 script-upload 云函数
- [ ] ✅ 上传 script-delete 云函数
- [ ] ✅ 上传 wiki-ranking-storytellers 云函数
- [ ] ✅ 上传 storyteller-calculate-heat 云函数
- [ ] ✅ 配置定时任务（可选）
- [ ] ✅ 测试榜单显示
- [ ] ✅ 测试关注功能
- [ ] ✅ 测试剧本上传

---

**修复完成时间**：2025-10-27  
**状态**：✅ 已完成  
**详细文档**：见 `botc-miniprogram/STORYTELLER_STATS_SYSTEM.md`

**部署完成后，说书人榜单将正常工作！** 🎉
