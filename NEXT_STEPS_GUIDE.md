# 下一步开发指南

## 🎯 立即要做的事情

### 第一步：部署新创建的云函数（30分钟）

#### 1. 排行榜系统（4个云函数）
在 HBuilderX 中：
```
右键 script-ranking-hot → 上传部署
右键 script-ranking-new → 上传部署
右键 script-ranking-download → 上传部署
右键 script-ranking-rating → 上传部署
```

#### 2. 用户等级系统（3个云函数）
```
右键 user-add-exp → 上传部署
右键 user-level-info → 上传部署
右键 user-daily-login → 上传部署
```

#### 3. 拼车功能（3个云函数）
```
右键 carpool-confirm-member → 上传部署
右键 carpool-remove-member → 上传部署
右键 carpool-update-status → 上传部署
```

#### 4. JSON链接功能（1个云函数）
```
右键 script-json-get → 上传部署
```

**重要**: 上传 `script-json-get` 后，需要在 uniCloud 控制台配置 HTTP 访问！

---

### 第二步：更新数据库字段（15分钟）

#### 方法1：通过 uniCloud Web控制台
1. 打开 uniCloud 控制台
2. 选择「云数据库」
3. 找到 `uni-id-users` 表
4. 点击「表结构」
5. 添加字段：
   - `level` - Number - 默认值: 1
   - `exp` - Number - 默认值: 0
   - `login_count` - Number - 默认值: 0
   - `last_login_at` - Date

#### 方法2：使用云函数批量更新（推荐）
创建临时云函数 `temp-update-user-fields`：

```javascript
'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  try {
    // 为所有用户添加默认字段
    const result = await db.collection('uni-id-users')
      .where({
        level: dbCmd.exists(false)
      })
      .update({
        level: 1,
        exp: 0,
        login_count: 0
      });
    
    console.log('更新结果:', result);
    
    return { 
      success: true,
      updated: result.updated 
    };
  } catch (error) {
    console.error('更新失败:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};
```

上传并运行一次，然后删除此云函数。

---

### 第三步：测试云函数（30分钟）

#### 测试排行榜
```javascript
// 在 HBuilderX 或小程序中测试
uniCloud.callFunction({
  name: 'script-ranking-hot',
  data: {
    page: 1,
    pageSize: 10,
    period: 'all'
  }
}).then(res => {
  console.log('热门排行:', res.result);
});
```

#### 测试等级系统
```javascript
// 测试获取等级信息
uniCloud.callFunction({
  name: 'user-level-info'
}).then(res => {
  console.log('等级信息:', res.result);
});

// 测试增加经验值
uniCloud.callFunction({
  name: 'user-add-exp',
  data: {
    expType: 'COMMENT'
  }
}).then(res => {
  console.log('增加经验:', res.result);
});
```

#### 测试拼车功能
```javascript
// 测试确认成员
uniCloud.callFunction({
  name: 'carpool-confirm-member',
  data: {
    carpoolId: '拼车ID',
    memberId: '报名ID',
    action: 'confirm'
  }
}).then(res => {
  console.log('确认结果:', res.result);
});
```

#### 测试JSON链接
1. 配置 HTTP 访问（重要）
2. 测试URL：`https://你的spaceId.bja.bspapp.com/http/script-json-get?script_id=剧本ID`

---

### 第四步：前端集成（2-3小时）

#### 1. App.vue 添加自动签到
参考 `USER_LEVEL_SYSTEM_GUIDE.md` 中的代码示例

#### 2. 用户中心显示等级
在 `pages/user/profile/profile.vue` 中添加等级显示组件

#### 3. 剧本列表接入排行榜
更新 `pages/script/ranking/ranking.vue`，调用新的排行榜云函数

#### 4. 拼车详情添加成员管理
更新 `pages/carpool/detail/detail.vue`，添加确认/拒绝/移除功能

---

## 📅 本周工作计划（Week 1）

### 周一（今天）
- [x] 创建排行榜系统云函数
- [x] 创建用户等级系统云函数
- [x] 创建拼车功能完善云函数
- [x] 编写部署文档

### 周二
- [ ] 部署所有云函数
- [ ] 更新数据库字段
- [ ] 测试所有云函数
- [ ] 修复发现的问题

### 周三
- [ ] 前端集成：App.vue 自动签到
- [ ] 前端集成：用户中心等级显示
- [ ] 测试等级升级流程

### 周四
- [ ] 前端集成：剧本排行榜
- [ ] 前端集成：拼车成员管理
- [ ] 整体功能测试

### 周五
- [ ] Bug修复
- [ ] 性能优化
- [ ] 准备下周Web后台开发

---

## 📊 未来2周计划

### Week 2: Web管理后台基础搭建
- [ ] 搭建 Vue 3 + Element Plus 项目
- [ ] 实现管理员登录
- [ ] 实现仪表盘数据统计
- [ ] 实现剧本管理（列表、审核）

### Week 3: Web管理后台功能完善
- [ ] 实现用户管理
- [ ] 实现评论管理
- [ ] 实现拼车管理
- [ ] 实现说书人认证审核

---

## 🎯 里程碑

### Milestone 1: 核心功能完成（本周）
**目标**: 部署所有新功能并完成前端集成
**验收标准**:
- [ ] 11个云函数全部部署成功
- [ ] 排行榜数据正确显示
- [ ] 等级系统正常运作
- [ ] 拼车状态管理完善

### Milestone 2: Web管理后台（2周后）
**目标**: 完成Web管理后台基础功能
**验收标准**:
- [ ] 管理员可以登录
- [ ] 可以查看数据统计
- [ ] 可以审核剧本
- [ ] 可以管理用户

### Milestone 3: 小程序上线（3-4周后）
**目标**: 小程序提交微信审核
**验收标准**:
- [ ] 所有核心功能完成
- [ ] 通过全面测试
- [ ] 性能优化完成
- [ ] 内容审核机制到位

---

## ⚠️ 注意事项

### 1. 数据库字段更新
**重要**: 必须先更新数据库字段，再使用等级系统功能！

### 2. HTTP访问配置
`script-json-get` 云函数需要在 uniCloud 控制台启用 HTTP 访问

### 3. 测试数据准备
建议准备一些测试数据：
- 至少 10 个测试剧本
- 至少 5 个测试用户
- 至少 2 个测试拼车

### 4. 版本控制
建议在部署前：
```bash
git add .
git commit -m "feat: 添加排行榜、等级系统和拼车功能完善"
git push
```

---

## 📚 参考文档

开发过程中请参考以下文档：

1. **PROJECT_STATUS_AND_PLAN.md**
   - 项目整体状态
   - 开发计划
   - 功能清单

2. **RANKING_SYSTEM_DEPLOYMENT_GUIDE.md**
   - 排行榜部署
   - 前端集成示例
   - API 使用说明

3. **USER_LEVEL_SYSTEM_GUIDE.md**
   - 等级系统部署
   - 等级配置说明
   - 升级动画效果

4. **CARPOOL_ENHANCEMENT_GUIDE.md**
   - 拼车功能部署
   - 状态流转图
   - 前端集成示例

5. **speckit.constitution**
   - 项目开发规范
   - 技术栈说明
   - 数据库设计

---

## 🐛 常见问题

### Q1: 云函数上传失败
**A**: 检查网络连接，确保 HBuilderX 已登录 DCloud 账号

### Q2: 等级系统不生效
**A**: 确认数据库字段已添加，检查 `uni-id-users` 表结构

### Q3: 排行榜数据不准确
**A**: 检查剧本数据是否完整，确认 status=1 的剧本数量

### Q4: HTTP 访问404
**A**: 检查是否在 uniCloud 控制台启用了 HTTP 访问

---

## 💪 加油鼓励

你已经完成了项目的 **82%**！

还剩下：
- Web 管理后台
- 小程序优化和测试
- 提交审核

预计再花 **3-4周** 就可以上线了！

按照这个指南一步步来，你一定可以的！🚀

---

## 📞 需要帮助？

如果遇到问题：
1. 先查看相关文档
2. 检查云函数日志
3. 使用 console.log 调试
4. 查看 uniCloud 控制台错误信息

祝开发顺利！✨

