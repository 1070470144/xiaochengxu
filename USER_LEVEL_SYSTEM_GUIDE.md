# 用户等级系统 - 完整实现指南

## 📦 新增的云函数

### 1. user-add-exp（增加经验值）
**功能**: 用户执行操作后增加经验值，自动计算等级升级

**参数**:
```javascript
{
  expType: 'LOGIN',      // 经验类型
  customExp: 20          // 自定义经验值（可选）
}
```

**经验类型**:
- `LOGIN` - 每日首次登录 (+5经验)
- `UPLOAD_SCRIPT` - 上传剧本 (+20经验)
- `COMMENT` - 发表评论 (+10经验)
- `SHARE` - 分享内容 (+5经验)
- `CREATE_CARPOOL` - 创建拼车 (+10经验)
- `REVIEW` - 评价说书人 (+5经验)

### 2. user-level-info（获取等级信息）
**功能**: 获取用户详细的等级信息，包括升级进度和特权

**参数**:
```javascript
{
  userId: 'xxx'  // 用户ID（可选，默认当前用户）
}
```

### 3. user-daily-login（每日登录）
**功能**: 每日首次登录自动签到并获得经验值

---

## 🎮 等级配置（按 speckit 规范）

| 等级 | 名称 | 所需经验 | 图标 |
|------|------|---------|------|
| 1 | 初来乍到 | 0 | 🌱 |
| 2 | 略知一二 | 100 | 🌿 |
| 3 | 初窥门径 | 300 | 🍀 |
| 4 | 渐入佳境 | 600 | 🌳 |
| 5 | 驾轻就熟 | 1000 | 🌲 |
| 6 | 炉火纯青 | 1500 | ⭐ |
| 7 | 登峰造极 | 2200 | 🌟 |
| 8 | 出神入化 | 3000 | 💫 |
| 9 | 无与伦比 | 4000 | ✨ |
| 10 | 传奇玩家 | 5500 | 👑 |

---

## 🎁 等级特权

### 等级 1+
- ✅ 可以上传剧本
- ✅ 可以评论和评分

### 等级 3+
- ✅ 可以创建拼车房间
- ✅ 评论优先显示

### 等级 5+
- ✅ 可以申请说书人认证
- ✅ 个人主页更多展示位

### 等级 7+
- ✅ 精选剧本推荐权重+50%
- ✅ 专属等级头像框

### 等级 10
- ✅ 传奇玩家标识
- ✅ 所有特权全部解锁

---

## 🗄️ 数据库字段更新

需要在 `uni-id-users` 表添加以下字段：

```javascript
{
  level: 1,              // 用户等级，默认1
  exp: 0,                // 经验值，默认0
  login_count: 0,        // 登录次数
  last_login_at: Date    // 最后登录时间
}
```

### 更新方式

#### 方式1: 通过 uniCloud Web控制台
1. 进入 uniCloud 控制台
2. 选择「云数据库」
3. 找到 `uni-id-users` 表
4. 点击「表结构」
5. 添加字段：
   - `level` - Number - 默认值 1
   - `exp` - Number - 默认值 0  
   - `login_count` - Number - 默认值 0
   - `last_login_at` - Date

#### 方式2: 通过云函数批量更新
创建临时云函数执行一次：

```javascript
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 为所有用户添加默认字段
  await db.collection('uni-id-users')
    .where({
      level: dbCmd.exists(false)
    })
    .update({
      level: 1,
      exp: 0,
      login_count: 0
    });
  
  return { success: true };
};
```

---

## 🚀 部署步骤

### Step 1: 更新数据库字段
按照上面的方式更新 `uni-id-users` 表结构

### Step 2: 上传云函数
```
右键 user-add-exp → 上传部署
右键 user-level-info → 上传部署
右键 user-daily-login → 上传部署
```

### Step 3: 测试云函数

#### 测试增加经验值
```javascript
uniCloud.callFunction({
  name: 'user-add-exp',
  data: {
    expType: 'COMMENT'
  }
}).then(res => {
  console.log(res.result);
  // { expAdded: 10, currentExp: 10, currentLevel: 1, levelUp: false }
});
```

#### 测试获取等级信息
```javascript
uniCloud.callFunction({
  name: 'user-level-info'
}).then(res => {
  console.log(res.result.data);
});
```

#### 测试每日登录
```javascript
uniCloud.callFunction({
  name: 'user-daily-login'
}).then(res => {
  console.log(res.result);
  // { isFirstLoginToday: true, expGained: 5 }
});
```

---

## 📱 前端集成

### 1. 在 App.vue 中添加自动签到

```vue
<script>
export default {
  onLaunch: function() {
    console.log('App Launch');
    
    // 自动每日签到
    this.dailyLogin();
  },
  
  methods: {
    async dailyLogin() {
      try {
        const res = await uniCloud.callFunction({
          name: 'user-daily-login'
        });
        
        if (res.result.code === 0) {
          const data = res.result.data;
          
          // 如果是今日首次登录，显示提示
          if (data.isFirstLoginToday && data.expGained > 0) {
            uni.showToast({
              title: `签到成功！+${data.expGained}经验`,
              icon: 'success'
            });
            
            // 如果升级了，显示升级提示
            if (data.expData && data.expData.levelUp) {
              setTimeout(() => {
                uni.showModal({
                  title: '恭喜升级！',
                  content: `您已升至 ${data.expData.levelName}`,
                  showCancel: false
                });
              }, 1500);
            }
          }
        }
      } catch (error) {
        console.error('签到失败:', error);
      }
    }
  }
};
</script>
```

### 2. 在用户中心显示等级信息

```vue
<template>
  <view class="user-level">
    <!-- 等级头像 -->
    <view class="level-header">
      <image class="avatar" :src="userInfo.avatar" />
      <view class="level-badge">
        <text class="level-icon">{{ levelInfo.currentLevelIcon }}</text>
        <text class="level-num">Lv.{{ levelInfo.currentLevel }}</text>
      </view>
    </view>
    
    <!-- 等级信息 -->
    <view class="level-info">
      <text class="level-name">{{ levelInfo.currentLevelName }}</text>
      <text class="exp-text">{{ levelInfo.currentExp }} / {{ levelInfo.nextLevelExp }} 经验</text>
    </view>
    
    <!-- 进度条 -->
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: levelInfo.progress + '%' }"></view>
    </view>
    <text class="progress-text">距离下一级还需 {{ levelInfo.expToNext }} 经验</text>
    
    <!-- 特权列表 -->
    <view class="privileges">
      <text class="privileges-title">🎁 等级特权</text>
      <view class="privilege-list">
        <view 
          v-for="(privilege, index) in levelInfo.privileges" 
          :key="index"
          class="privilege-item">
          <text class="privilege-icon">✓</text>
          <text class="privilege-text">{{ privilege }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {},
      levelInfo: {}
    };
  },
  
  onLoad() {
    this.loadLevelInfo();
  },
  
  methods: {
    async loadLevelInfo() {
      try {
        const res = await uniCloud.callFunction({
          name: 'user-level-info'
        });
        
        if (res.result.code === 0) {
          this.levelInfo = res.result.data;
          this.userInfo = {
            avatar: res.result.data.avatar,
            nickname: res.result.data.nickname
          };
        }
      } catch (error) {
        console.error('获取等级信息失败:', error);
      }
    }
  }
};
</script>

<style scoped>
.user-level {
  padding: 40rpx;
}

.level-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
}

.level-badge {
  margin-left: 20rpx;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
}

.level-icon {
  font-size: 32rpx;
  margin-right: 10rpx;
}

.level-num {
  color: white;
  font-weight: bold;
  font-size: 28rpx;
}

.level-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 20rpx;
}

.level-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.exp-text {
  font-size: 26rpx;
  color: #666;
}

.progress-bar {
  height: 20rpx;
  background: #f0f0f0;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  font-size: 24rpx;
  color: #999;
}

.privileges {
  margin-top: 40rpx;
}

.privileges-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.privilege-list {
  background: #f8f8f8;
  border-radius: 20rpx;
  padding: 30rpx;
}

.privilege-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.privilege-icon {
  color: #52c41a;
  font-size: 28rpx;
  margin-right: 10rpx;
}

.privilege-text {
  font-size: 28rpx;
  color: #666;
}
</style>
```

### 3. 在其他操作中增加经验

#### 上传剧本后
```javascript
async uploadScript() {
  // ... 上传剧本逻辑
  
  // 增加经验值
  await uniCloud.callFunction({
    name: 'user-add-exp',
    data: { expType: 'UPLOAD_SCRIPT' }
  });
}
```

#### 发表评论后
```javascript
async submitComment() {
  // ... 提交评论逻辑
  
  // 增加经验值
  const expRes = await uniCloud.callFunction({
    name: 'user-add-exp',
    data: { expType: 'COMMENT' }
  });
  
  // 如果升级了，显示提示
  if (expRes.result.data.levelUp) {
    uni.showModal({
      title: '恭喜升级！',
      content: `您已升至 ${expRes.result.data.levelName}`,
      showCancel: false
    });
  }
}
```

#### 创建拼车后
```javascript
async createCarpool() {
  // ... 创建拼车逻辑
  
  // 增加经验值
  await uniCloud.callFunction({
    name: 'user-add-exp',
    data: { expType: 'CREATE_CARPOOL' }
  });
}
```

---

## 🎨 升级动画效果

### 升级弹窗组件

```vue
<template>
  <view v-if="show" class="level-up-modal" @click="close">
    <view class="modal-content" @click.stop>
      <view class="level-up-animation">
        <text class="level-icon animated">{{ levelIcon }}</text>
        <text class="level-text">恭喜升级！</text>
        <text class="new-level">{{ newLevelName }}</text>
        <text class="exp-text">+{{ expGained }} 经验</text>
      </view>
      <button class="close-btn" @click="close">太棒了！</button>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    show: Boolean,
    levelIcon: String,
    newLevelName: String,
    expGained: Number
  },
  
  methods: {
    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.level-up-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 30rpx;
  padding: 60rpx 40rpx;
  width: 80%;
  max-width: 600rpx;
}

.level-up-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.level-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.level-icon.animated {
  animation: bounce 0.8s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20rpx); }
}

.level-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.new-level {
  font-size: 48rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20rpx;
}

.exp-text {
  font-size: 28rpx;
  color: #52c41a;
  margin-bottom: 40rpx;
}

.close-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 60rpx;
}
</style>
```

---

## ✅ 验证清单

- [ ] 3个云函数全部上传成功
- [ ] 数据库字段添加完成
- [ ] 每日签到功能正常
- [ ] 增加经验值逻辑正确
- [ ] 等级升级计算准确
- [ ] 前端显示等级信息
- [ ] 升级提示正常显示
- [ ] 等级特权正确展示

---

## 📈 未来扩展

### 1. 任务系统
创建每日任务、周任务，完成获得额外经验

### 2. 成就系统
达成特定成就获得称号和经验

### 3. 排行榜
显示等级排行榜、经验排行榜

### 4. VIP 系统
付费 VIP 获得经验加成

---

## 🎉 完成！

用户等级系统已创建完成！现在用户可以通过各种操作获得经验，升级解锁更多特权。

祝开发顺利！🚀

