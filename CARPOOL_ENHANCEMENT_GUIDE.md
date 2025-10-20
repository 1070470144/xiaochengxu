# 拼车功能完善 - 部署指南

## 📦 新增的云函数

### 1. carpool-confirm-member（确认/拒绝成员）
**功能**: 发起人可以确认或拒绝报名者

**参数**:
```javascript
{
  carpoolId: '拼车ID',
  memberId: '报名记录ID',
  action: 'confirm'  // 'confirm' 确认 或 'reject' 拒绝
}
```

**返回**:
```javascript
{
  code: 0,
  message: 'success',
  data: {
    action: 'confirm',
    isFull: false,      // 是否已满员
    currentPlayers: 5   // 当前人数
  }
}
```

### 2. carpool-remove-member（移除成员）
**功能**: 发起人可以移除已确认的成员

**参数**:
```javascript
{
  carpoolId: '拼车ID',
  memberId: '报名记录ID'
}
```

### 3. carpool-update-status（更新拼车状态）
**功能**: 发起人更新拼车状态

**参数**:
```javascript
{
  carpoolId: '拼车ID',
  newStatus: 3  // 0-已取消，1-招募中，2-已满员，3-已确认，4-已结束
}
```

---

## 🔄 拼车状态流转

### 状态定义（按 speckit 规范）

| 状态值 | 状态名称 | 说明 |
|-------|---------|------|
| 0 | 已取消 | 发起人取消了拼车 |
| 1 | 招募中 | 正在招募成员 |
| 2 | 已满员 | 人数已满，不再接受新报名 |
| 3 | 已确认 | 发起人确认成团，准备游戏 |
| 4 | 已结束 | 游戏已完成 |

### 状态流转图

```
创建拼车
    ↓
【招募中(1)】 ←─┐
    ↓           │
报名人数达到    │ 移除成员
    ↓           │
【已满员(2)】 ──┘
    ↓
发起人确认
    ↓
【已确认(3)】
    ↓
游戏完成
    ↓
【已结束(4)】

任何状态 → 发起人取消 → 【已取消(0)】
```

---

## 👥 成员状态定义

### opendb-botc-carpool-members 表

| 状态值 | 状态名称 | 说明 |
|-------|---------|------|
| 0 | 已退出 | 成员主动退出或被移除 |
| 1 | 已报名 | 已报名，等待确认 |
| 2 | 已确认 | 发起人已确认 |
| 3 | 已拒绝 | 发起人拒绝报名 |

---

## 🚀 部署步骤

### Step 1: 上传云函数
```
右键 carpool-confirm-member → 上传部署
右键 carpool-remove-member → 上传部署
右键 carpool-update-status → 上传部署
```

### Step 2: 测试云函数

#### 测试确认成员
```javascript
uniCloud.callFunction({
  name: 'carpool-confirm-member',
  data: {
    carpoolId: '拼车ID',
    memberId: '报名记录ID',
    action: 'confirm'
  }
});
```

#### 测试移除成员
```javascript
uniCloud.callFunction({
  name: 'carpool-remove-member',
  data: {
    carpoolId: '拼车ID',
    memberId: '报名记录ID'
  }
});
```

#### 测试更新状态
```javascript
uniCloud.callFunction({
  name: 'carpool-update-status',
  data: {
    carpoolId: '拼车ID',
    newStatus: 3  // 已确认
  }
});
```

---

## 📱 前端集成示例

### 1. 拼车详情页（发起人视角）

```vue
<template>
  <view class="carpool-detail">
    <!-- 拼车信息 -->
    <view class="carpool-info">
      <text class="title">{{ carpool.title }}</text>
      <view class="status-badge" :class="'status-' + carpool.status">
        {{ getStatusText(carpool.status) }}
      </view>
    </view>
    
    <!-- 报名成员列表（发起人可见） -->
    <view v-if="isHost" class="members-section">
      <text class="section-title">报名成员 ({{ members.length }})</text>
      
      <view 
        v-for="member in members" 
        :key="member._id"
        class="member-item">
        <image :src="member.user_avatar" class="avatar" />
        <view class="member-info">
          <text class="name">{{ member.user_nickname }}</text>
          <text class="status">{{ getMemberStatusText(member.status) }}</text>
        </view>
        
        <!-- 操作按钮 -->
        <view class="member-actions">
          <button 
            v-if="member.status === 1"
            class="btn-confirm"
            @click="confirmMember(member._id)">
            确认
          </button>
          <button 
            v-if="member.status === 1"
            class="btn-reject"
            @click="rejectMember(member._id)">
            拒绝
          </button>
          <button 
            v-if="member.status === 2"
            class="btn-remove"
            @click="removeMember(member._id)">
            移除
          </button>
        </view>
      </view>
    </view>
    
    <!-- 发起人操作 -->
    <view v-if="isHost" class="host-actions">
      <button 
        v-if="carpool.status === 2"
        class="btn-primary"
        @click="confirmCarpool">
        确认成团
      </button>
      <button 
        v-if="carpool.status === 3"
        class="btn-primary"
        @click="finishCarpool">
        完成游戏
      </button>
      <button 
        v-if="carpool.status <= 2"
        class="btn-danger"
        @click="cancelCarpool">
        取消拼车
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      carpoolId: '',
      carpool: {},
      members: [],
      isHost: false
    };
  },
  
  onLoad(options) {
    this.carpoolId = options.id;
    this.loadCarpoolDetail();
    this.loadMembers();
  },
  
  methods: {
    async loadCarpoolDetail() {
      // 加载拼车详情逻辑
      const res = await uniCloud.callFunction({
        name: 'carpool-detail',
        data: { carpoolId: this.carpoolId }
      });
      
      if (res.result.code === 0) {
        this.carpool = res.result.data;
        // 判断是否是发起人
        const userInfo = uni.getStorageSync('userInfo');
        this.isHost = this.carpool.host_id === userInfo._id;
      }
    },
    
    async loadMembers() {
      // 加载报名成员列表
      const res = await uniCloud.callFunction({
        name: 'carpool-applied-list',
        data: { carpoolId: this.carpoolId }
      });
      
      if (res.result.code === 0) {
        this.members = res.result.data.list;
      }
    },
    
    // 确认成员
    async confirmMember(memberId) {
      uni.showModal({
        title: '确认',
        content: '确定要同意该成员的报名吗？',
        success: async (res) => {
          if (res.confirm) {
            const result = await uniCloud.callFunction({
              name: 'carpool-confirm-member',
              data: {
                carpoolId: this.carpoolId,
                memberId: memberId,
                action: 'confirm'
              }
            });
            
            if (result.result.code === 0) {
              uni.showToast({
                title: '确认成功',
                icon: 'success'
              });
              
              // 刷新列表
              this.loadCarpoolDetail();
              this.loadMembers();
              
              // 如果满员，提示
              if (result.result.data.isFull) {
                setTimeout(() => {
                  uni.showModal({
                    title: '已满员',
                    content: '拼车已满员，可以确认成团了',
                    showCancel: false
                  });
                }, 1500);
              }
            } else {
              uni.showToast({
                title: result.result.message,
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 拒绝成员
    async rejectMember(memberId) {
      uni.showModal({
        title: '拒绝',
        content: '确定要拒绝该成员的报名吗？',
        success: async (res) => {
          if (res.confirm) {
            const result = await uniCloud.callFunction({
              name: 'carpool-confirm-member',
              data: {
                carpoolId: this.carpoolId,
                memberId: memberId,
                action: 'reject'
              }
            });
            
            if (result.result.code === 0) {
              uni.showToast({
                title: '已拒绝',
                icon: 'success'
              });
              this.loadMembers();
            } else {
              uni.showToast({
                title: result.result.message,
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 移除成员
    async removeMember(memberId) {
      uni.showModal({
        title: '移除',
        content: '确定要移除该成员吗？',
        success: async (res) => {
          if (res.confirm) {
            const result = await uniCloud.callFunction({
              name: 'carpool-remove-member',
              data: {
                carpoolId: this.carpoolId,
                memberId: memberId
              }
            });
            
            if (result.result.code === 0) {
              uni.showToast({
                title: '移除成功',
                icon: 'success'
              });
              this.loadCarpoolDetail();
              this.loadMembers();
            } else {
              uni.showToast({
                title: result.result.message,
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 确认成团
    async confirmCarpool() {
      uni.showModal({
        title: '确认成团',
        content: '确定要确认成团吗？确认后将准备开始游戏。',
        success: async (res) => {
          if (res.confirm) {
            const result = await uniCloud.callFunction({
              name: 'carpool-update-status',
              data: {
                carpoolId: this.carpoolId,
                newStatus: 3  // 已确认
              }
            });
            
            if (result.result.code === 0) {
              uni.showToast({
                title: '已确认成团',
                icon: 'success'
              });
              this.loadCarpoolDetail();
            } else {
              uni.showToast({
                title: result.result.message,
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 完成游戏
    async finishCarpool() {
      uni.showModal({
        title: '完成游戏',
        content: '游戏已完成了吗？',
        success: async (res) => {
          if (res.confirm) {
            const result = await uniCloud.callFunction({
              name: 'carpool-update-status',
              data: {
                carpoolId: this.carpoolId,
                newStatus: 4  // 已结束
              }
            });
            
            if (result.result.code === 0) {
              uni.showToast({
                title: '游戏已结束',
                icon: 'success'
              });
              this.loadCarpoolDetail();
            } else {
              uni.showToast({
                title: result.result.message,
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 取消拼车
    async cancelCarpool() {
      uni.showModal({
        title: '取消拼车',
        content: '确定要取消这个拼车吗？此操作不可撤销。',
        confirmColor: '#ff4d4f',
        success: async (res) => {
          if (res.confirm) {
            const result = await uniCloud.callFunction({
              name: 'carpool-update-status',
              data: {
                carpoolId: this.carpoolId,
                newStatus: 0  // 已取消
              }
            });
            
            if (result.result.code === 0) {
              uni.showToast({
                title: '已取消',
                icon: 'success'
              });
              setTimeout(() => {
                uni.navigateBack();
              }, 1500);
            } else {
              uni.showToast({
                title: result.result.message,
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        0: '已取消',
        1: '招募中',
        2: '已满员',
        3: '已确认',
        4: '已结束'
      };
      return statusMap[status] || '未知';
    },
    
    // 获取成员状态文本
    getMemberStatusText(status) {
      const statusMap = {
        0: '已退出',
        1: '待确认',
        2: '已确认',
        3: '已拒绝'
      };
      return statusMap[status] || '未知';
    }
  }
};
</script>

<style scoped>
.carpool-detail {
  padding: 40rpx;
}

.status-badge {
  display: inline-block;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: white;
}

.status-badge.status-0 { background: #999; }
.status-badge.status-1 { background: #52c41a; }
.status-badge.status-2 { background: #faad14; }
.status-badge.status-3 { background: #1890ff; }
.status-badge.status-4 { background: #666; }

.members-section {
  margin-top: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin-right: 20rpx;
}

.member-info {
  flex: 1;
}

.member-actions {
  display: flex;
  gap: 10rpx;
}

.btn-confirm {
  background: #52c41a;
  color: white;
  border: none;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.btn-reject,
.btn-remove {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.host-actions {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}
</style>
```

---

## ✅ 验证清单

- [ ] 3个云函数全部上传成功
- [ ] 发起人可以确认报名
- [ ] 发起人可以拒绝报名
- [ ] 发起人可以移除成员
- [ ] 满员后状态自动更新
- [ ] 发起人可以确认成团
- [ ] 发起人可以标记游戏完成
- [ ] 发起人可以取消拼车
- [ ] 状态流转逻辑正确

---

## 🎉 完成！

拼车功能已完善！现在拼车流程更加完整，发起人可以管理成员和状态。

祝开发顺利！🚀

