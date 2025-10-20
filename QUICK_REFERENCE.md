# 快速参考卡片

## 📦 本次新增内容速查

### 新增云函数（11个）
| 云函数名称 | 功能 | 文档 |
|-----------|------|------|
| script-ranking-hot | 热门排行榜 | RANKING_SYSTEM_DEPLOYMENT_GUIDE.md |
| script-ranking-new | 最新排行榜 | RANKING_SYSTEM_DEPLOYMENT_GUIDE.md |
| script-ranking-download | 下载排行榜 | RANKING_SYSTEM_DEPLOYMENT_GUIDE.md |
| script-ranking-rating | 评分排行榜 | RANKING_SYSTEM_DEPLOYMENT_GUIDE.md |
| user-add-exp | 增加经验值 | USER_LEVEL_SYSTEM_GUIDE.md |
| user-level-info | 获取等级信息 | USER_LEVEL_SYSTEM_GUIDE.md |
| user-daily-login | 每日登录 | USER_LEVEL_SYSTEM_GUIDE.md |
| carpool-confirm-member | 确认/拒绝成员 | CARPOOL_ENHANCEMENT_GUIDE.md |
| carpool-remove-member | 移除成员 | CARPOOL_ENHANCEMENT_GUIDE.md |
| carpool-update-status | 更新拼车状态 | CARPOOL_ENHANCEMENT_GUIDE.md |
| script-json-get | 获取JSON（HTTP） | SCRIPT_JSON_LINK_FEATURE.md |

### 新增文档（6个）
1. **PROJECT_STATUS_AND_PLAN.md** - 项目状态报告
2. **RANKING_SYSTEM_DEPLOYMENT_GUIDE.md** - 排行榜部署
3. **USER_LEVEL_SYSTEM_GUIDE.md** - 等级系统
4. **CARPOOL_ENHANCEMENT_GUIDE.md** - 拼车功能
5. **DEVELOPMENT_SUMMARY.md** - 开发总结
6. **NEXT_STEPS_GUIDE.md** - 下一步指南

---

## ⚡ 快速部署命令

### 1. 排行榜（4个）
```
script-ranking-hot
script-ranking-new
script-ranking-download
script-ranking-rating
```

### 2. 等级系统（3个）
```
user-add-exp
user-level-info
user-daily-login
```

### 3. 拼车功能（3个）
```
carpool-confirm-member
carpool-remove-member
carpool-update-status
```

### 4. JSON链接（1个）
```
script-json-get ⚠️ 需要配置HTTP访问
```

---

## 🗄️ 数据库字段速查

### uni-id-users 表需要添加
```javascript
level: 1,              // 用户等级
exp: 0,                // 经验值
login_count: 0,        // 登录次数
last_login_at: Date    // 最后登录时间
```

### 批量更新SQL（临时云函数）
```javascript
db.collection('uni-id-users')
  .where({ level: dbCmd.exists(false) })
  .update({ level: 1, exp: 0, login_count: 0 })
```

---

## 📊 等级系统速查

### 等级配置
| 等级 | 名称 | 经验 |
|------|------|------|
| 1 | 初来乍到 | 0 |
| 2 | 略知一二 | 100 |
| 3 | 初窥门径 | 300 |
| 4 | 渐入佳境 | 600 |
| 5 | 驾轻就熟 | 1000 |
| 6 | 炉火纯青 | 1500 |
| 7 | 登峰造极 | 2200 |
| 8 | 出神入化 | 3000 |
| 9 | 无与伦比 | 4000 |
| 10 | 传奇玩家 | 5500 |

### 经验获取
| 操作 | 经验 | 类型 |
|------|------|------|
| 每日登录 | +5 | LOGIN |
| 上传剧本 | +20 | UPLOAD_SCRIPT |
| 发表评论 | +10 | COMMENT |
| 分享内容 | +5 | SHARE |
| 创建拼车 | +10 | CREATE_CARPOOL |
| 评价说书人 | +5 | REVIEW |

---

## 🔄 拼车状态速查

### 状态值
| 值 | 状态 | 说明 |
|----|------|------|
| 0 | 已取消 | 发起人取消 |
| 1 | 招募中 | 正在招募 |
| 2 | 已满员 | 人数已满 |
| 3 | 已确认 | 准备游戏 |
| 4 | 已结束 | 游戏完成 |

### 成员状态
| 值 | 状态 | 说明 |
|----|------|------|
| 0 | 已退出 | 主动退出或被移除 |
| 1 | 已报名 | 等待确认 |
| 2 | 已确认 | 发起人已确认 |
| 3 | 已拒绝 | 发起人拒绝 |

---

## 🎯 排行榜算法

### 热度算法
```
热度分数 = 浏览量×0.3 + 下载量×0.4 + 评分×20 + 收藏×0.3
```

### 排行榜类型
- **hot** - 热门排行（按热度分数）
- **new** - 最新排行（按创建时间）
- **download** - 下载排行（按下载量）
- **rating** - 评分排行（按平均评分，需≥5个评分）

---

## 🧪 测试命令

### 测试热门排行
```javascript
uniCloud.callFunction({
  name: 'script-ranking-hot',
  data: { page: 1, pageSize: 10, period: 'all' }
})
```

### 测试增加经验
```javascript
uniCloud.callFunction({
  name: 'user-add-exp',
  data: { expType: 'COMMENT' }
})
```

### 测试获取等级
```javascript
uniCloud.callFunction({
  name: 'user-level-info'
})
```

### 测试确认成员
```javascript
uniCloud.callFunction({
  name: 'carpool-confirm-member',
  data: { 
    carpoolId: 'xxx', 
    memberId: 'yyy', 
    action: 'confirm' 
  }
})
```

---

## 📈 项目完成度

**当前**: 82%

| 模块 | 完成度 |
|------|--------|
| 用户系统 | 95% |
| 剧本系统 | 98% |
| 社交功能 | 85% |
| 拼车功能 | 95% |
| 说书人系统 | 70% |
| 百科功能 | 90% |
| 排行榜 | 95% |
| Web后台 | 0% |

---

## ⏭️ 下一步

1. **本周**: 部署云函数 + 前端集成
2. **下周**: 开始Web管理后台
3. **2-3周后**: 小程序提交审核

---

## 🔗 重要链接

- [项目状态](PROJECT_STATUS_AND_PLAN.md)
- [开发总结](DEVELOPMENT_SUMMARY.md)
- [下一步指南](NEXT_STEPS_GUIDE.md)
- [Speckit规范](speckit.constitution)

---

**最后更新**: 2025-10-20

