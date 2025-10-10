<template>
  <view class="page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 拼车详情 -->
    <view v-else-if="carpoolDetail" class="carpool-detail">
      <!-- 头部信息 -->
      <view class="carpool-header clock-tower-gradient">
        <view class="header-content">
          <text class="carpool-title">{{ carpoolDetail.title }}</text>
          <text class="room-number">房间号：{{ carpoolDetail.room_number }}</text>
          <view class="status-info">
            <text class="status-badge" :class="getStatusClass(carpoolDetail.status)">
              {{ getStatusText(carpoolDetail.status) }}
            </text>
            <text class="player-count">{{ carpoolDetail.current_players }}/{{ carpoolDetail.max_players }}人</text>
          </view>
        </view>
      </view>

      <!-- 基础信息卡片 -->
      <view class="info-card card">
        <view class="card-body">
          <view class="info-section">
            <view class="info-row">
              <text class="info-icon">⏰</text>
              <text class="info-label">游戏时间：</text>
              <text class="info-value">{{ formatGameTime(carpoolDetail.game_time) }}</text>
            </view>
            <view class="info-row">
              <text class="info-icon">📍</text>
              <text class="info-label">游戏地点：</text>
              <text class="info-value">{{ carpoolDetail.location }}</text>
            </view>
            <view v-if="carpoolDetail.location_detail" class="info-row">
              <text class="info-icon">🗺️</text>
              <text class="info-label">详细地址：</text>
              <text class="info-value">{{ carpoolDetail.location_detail }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 关联剧本信息 -->
      <view v-if="carpoolDetail.script" class="script-card card">
        <view class="card-header">
          <text class="card-title">关联剧本</text>
        </view>
        <view class="card-body">
          <view class="script-info" @click="goToScript(carpoolDetail.script._id)">
            <text class="script-title">{{ carpoolDetail.script.title }}</text>
            <text class="script-meta">
              {{ carpoolDetail.script.author }} · {{ carpoolDetail.script.player_count }} · 
              难度{{ getDifficultyText(carpoolDetail.script.difficulty) }}
            </text>
            <text class="script-desc">{{ carpoolDetail.script.description }}</text>
          </view>
        </view>
      </view>

      <!-- 发起人信息 -->
      <view class="host-card card">
        <view class="card-header">
          <text class="card-title">发起人</text>
        </view>
        <view class="card-body">
          <view class="user-info" @click="chatWithHost">
            <image class="user-avatar" :src="carpoolDetail.host.avatar || '/static/images/default-avatar.png'"></image>
            <view class="user-details">
              <text class="user-name">{{ carpoolDetail.host.nickname }}</text>
              <text class="user-level">Lv.{{ carpoolDetail.host.level || 1 }}</text>
            </view>
            <view class="contact-btn">
              <text class="contact-text">私聊</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 说书人信息 -->
      <view v-if="carpoolDetail.storyteller" class="storyteller-card card">
        <view class="card-header">
          <text class="card-title">说书人</text>
        </view>
        <view class="card-body">
          <view class="user-info" @click="goToStorytellerProfile(carpoolDetail.storyteller._id)">
            <image class="user-avatar" :src="carpoolDetail.storyteller.avatar || '/static/images/default-avatar.png'"></image>
            <view class="user-details">
              <text class="user-name storyteller-name">{{ carpoolDetail.storyteller.nickname }}</text>
              <text class="user-tag">认证说书人</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 详细说明 -->
      <view v-if="carpoolDetail.description" class="desc-card card">
        <view class="card-header">
          <text class="card-title">详细说明</text>
        </view>
        <view class="card-body">
          <text class="carpool-desc">{{ carpoolDetail.description }}</text>
        </view>
      </view>

      <!-- 玩家要求 -->
      <view v-if="carpoolDetail.requirements" class="requirements-card card">
        <view class="card-header">
          <text class="card-title">玩家要求</text>
        </view>
        <view class="card-body">
          <text class="requirements-text">{{ carpoolDetail.requirements }}</text>
        </view>
      </view>

      <!-- 联系方式（只有报名成功后才显示） -->
      <view v-if="showContactInfo" class="contact-card card">
        <view class="card-header">
          <text class="card-title">联系方式</text>
        </view>
        <view class="card-body">
          <view v-if="carpoolDetail.contact_wechat" class="contact-row">
            <text class="contact-label">微信号：</text>
            <text class="contact-value" @click="copyContact(carpoolDetail.contact_wechat)">
              {{ carpoolDetail.contact_wechat }}
            </text>
          </view>
          <view v-if="carpoolDetail.contact_phone" class="contact-row">
            <text class="contact-label">手机号：</text>
            <text class="contact-value" @click="callPhone(carpoolDetail.contact_phone)">
              {{ carpoolDetail.contact_phone }}
            </text>
          </view>
        </view>
      </view>

      <!-- 参与成员 -->
      <view class="members-card card">
        <view class="card-header">
          <text class="card-title">参与成员 ({{ carpoolDetail.current_players }}/{{ carpoolDetail.max_players }})</text>
        </view>
        <view class="card-body">
          <view v-if="carpoolDetail.members && carpoolDetail.members.length > 0" class="members-list">
            <view v-for="member in carpoolDetail.members" :key="member._id" class="member-item">
              <image class="member-avatar" :src="member.user.avatar || '/static/images/default-avatar.png'"></image>
              <view class="member-info">
                <text class="member-name">{{ member.user.nickname }}</text>
                <text class="member-level">Lv.{{ member.user.level || 1 }}</text>
                <text v-if="member.message" class="member-message">{{ member.message }}</text>
              </view>
              <view class="member-status">
                <text class="status-text" :class="getMemberStatusClass(member.status)">
                  {{ getMemberStatusText(member.status) }}
                </text>
              </view>
            </view>
          </view>
          <view v-else class="no-members">
            <text class="no-members-text">暂无其他成员</text>
          </view>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="action-bar">
        <button v-if="!isHost && !hasApplied && carpoolDetail.status === 1" 
                class="action-btn btn-primary" 
                @click="showApplyModal">
          报名参加
        </button>
        
        <button v-else-if="hasApplied && !isConfirmed" 
                class="action-btn btn-secondary" 
                @click="quitCarpool">
          取消报名
        </button>
        
        <button v-else-if="isHost" 
                class="action-btn btn-secondary" 
                @click="manageRoom">
          管理房间
        </button>
        
        <view v-else class="action-info">
          <text class="info-text">
            {{ getActionText() }}
          </text>
        </view>
      </view>
    </view>

    <!-- 报名弹窗 -->
    <uni-popup ref="applyPopup" type="bottom">
      <view class="apply-popup">
        <view class="popup-header">
          <text class="popup-title">报名拼车</text>
          <text class="popup-close" @click="closeApplyModal">×</text>
        </view>
        <view class="popup-body">
          <view class="form-item">
            <text class="form-label">报名留言（可选）：</text>
            <textarea 
              v-model="applyMessage"
              placeholder="介绍一下自己，提高通过率..."
              maxlength="200"
              class="apply-textarea">
            </textarea>
          </view>
        </view>
        <view class="popup-footer">
          <button class="submit-btn btn-primary" @click="submitApply" :loading="applying">
            确认报名
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  name: 'CarpoolDetail',
  
  data() {
    return {
      carpoolId: '',
      carpoolDetail: null,
      loading: false,
      applyMessage: '',
      applying: false,
      
      // 用户状态
      currentUserId: '',
      isHost: false,
      hasApplied: false,
      isConfirmed: false,
      showContactInfo: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.carpoolId = options.id
      this.getCurrentUser()
      this.loadCarpoolDetail()
    }
  },

  methods: {
    // 获取当前用户
    getCurrentUser() {
      const app = getApp()
      if (app.globalData.userInfo) {
        this.currentUserId = app.globalData.userInfo.id
      }
    },

    // 加载拼车详情
    async loadCarpoolDetail() {
      this.loading = true
      
      try {
        const result = await uniCloud.callFunction({
          name: 'carpool-detail',
          data: { id: this.carpoolId }
        })

        if (result.result.code === 0) {
          this.carpoolDetail = result.result.data
          this.analyzeUserStatus()
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.carpoolDetail.title
          })
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('加载拼车详情失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 分析用户状态
    analyzeUserStatus() {
      if (!this.carpoolDetail || !this.currentUserId) return
      
      // 是否是房主
      this.isHost = this.carpoolDetail.host_id === this.currentUserId
      
      // 是否已报名和确认状态
      if (this.carpoolDetail.members) {
        const myMember = this.carpoolDetail.members.find(m => m.user._id === this.currentUserId)
        if (myMember) {
          this.hasApplied = true
          this.isConfirmed = myMember.status === 2
          this.showContactInfo = this.isConfirmed || this.isHost
        }
      }
      
      // 房主默认能看到联系方式
      if (this.isHost) {
        this.showContactInfo = true
      }
    },

    // 显示报名弹窗
    showApplyModal() {
      // 检查登录状态
      if (!this.currentUserId) {
        uni.showModal({
          title: '提示',
          content: '请先登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/user/login/login'
              })
            }
          }
        })
        return
      }
      
      this.$refs.applyPopup.open()
    },

    // 关闭报名弹窗
    closeApplyModal() {
      this.$refs.applyPopup.close()
    },

    // 提交报名
    async submitApply() {
      this.applying = true

      try {
        const result = await uniCloud.callFunction({
          name: 'carpool-apply',
          data: {
            roomId: this.carpoolId,
            message: this.applyMessage.trim()
          }
        })

        if (result.result.code === 0) {
          uni.showToast({
            title: '报名成功',
            icon: 'success'
          })
          
          // 清空表单
          this.applyMessage = ''
          this.closeApplyModal()
          
          // 重新加载详情
          this.loadCarpoolDetail()
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('报名失败：', error)
        uni.showToast({
          title: error.message || '报名失败',
          icon: 'none'
        })
      } finally {
        this.applying = false
      }
    },

    // 退出拼车
    async quitCarpool() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出这个拼车吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '处理中...' })
              
              const result = await uniCloud.callFunction({
                name: 'carpool-quit',
                data: { roomId: this.carpoolId }
              })

              if (result.result.code === 0) {
                uni.showToast({
                  title: '已退出拼车',
                  icon: 'success'
                })
                this.loadCarpoolDetail()
              }
            } catch (error) {
              uni.showToast({
                title: '退出失败',
                icon: 'none'
              })
            } finally {
              uni.hideLoading()
            }
          }
        }
      })
    },

    // 与房主私聊
    chatWithHost() {
      if (this.carpoolDetail.host_id === this.currentUserId) {
        uni.showToast({
          title: '不能和自己私聊',
          icon: 'none'
        })
        return
      }
      
      uni.navigateTo({
        url: `/pages/community/chat/conversation/conversation?userId=${this.carpoolDetail.host_id}&nickname=${this.carpoolDetail.host.nickname}`
      })
    },

    // 管理房间
    manageRoom() {
      uni.navigateTo({
        url: `/pages/carpool/manage/manage?id=${this.carpoolId}`
      })
    },

    // 跳转到剧本详情
    goToScript(scriptId) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${scriptId}`
      })
    },

    // 跳转到说书人主页
    goToStorytellerProfile(storytellerId) {
      uni.navigateTo({
        url: `/pages/storyteller/profile/profile?id=${storytellerId}`
      })
    },

    // 复制联系方式
    copyContact(contact) {
      uni.setClipboardData({
        data: contact,
        success: () => {
          uni.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          })
        }
      })
    },

    // 拨打电话
    callPhone(phone) {
      uni.makePhoneCall({
        phoneNumber: phone
      })
    },

    // 工具方法
    formatGameTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = date - now
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      
      const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      
      let relativeTime = ''
      if (diff < 0) {
        relativeTime = '已过期'
      } else if (days === 0) {
        relativeTime = hours > 0 ? `${hours}小时后` : '即将开始'
      } else if (days === 1) {
        relativeTime = '明天'
      } else {
        relativeTime = `${days}天后`
      }
      
      return `${dateStr} ${timeStr} (${relativeTime})`
    },

    getDifficultyText(difficulty) {
      const textMap = {
        1: '简单',
        2: '中等',
        3: '困难',
        4: '专家'
      }
      return textMap[difficulty] || '未知'
    },

    getStatusClass(status) {
      const classMap = {
        1: 'status-recruiting',
        2: 'status-full',
        3: 'status-confirmed',
        4: 'status-finished'
      }
      return classMap[status] || 'status-default'
    },

    getStatusText(status) {
      const textMap = {
        1: '招募中',
        2: '已满员',
        3: '已确认',
        4: '已结束'
      }
      return textMap[status] || '未知'
    },

    getMemberStatusClass(status) {
      const classMap = {
        1: 'member-applied',
        2: 'member-confirmed'
      }
      return classMap[status] || 'member-default'
    },

    getMemberStatusText(status) {
      const textMap = {
        1: '已报名',
        2: '已确认'
      }
      return textMap[status] || '未知'
    },

    getActionText() {
      if (this.carpoolDetail.status !== 1) {
        return '拼车已结束或已确认'
      } else if (this.hasApplied && this.isConfirmed) {
        return '您已成功加入此拼车'
      } else if (this.hasApplied) {
        return '已报名，等待房主确认'
      } else if (this.carpoolDetail.current_players >= this.carpoolDetail.max_players) {
        return '人数已满'
      } else {
        return '可以报名参加'
      }
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `血染钟楼拼车：${this.carpoolDetail ? this.carpoolDetail.title : '线下组局'}`,
      path: `/pages/carpool/detail/detail?id=${this.carpoolId}`
    }
  }
}
</script>

<style scoped>
.carpool-header {
  color: white;
  padding: 40rpx 30rpx;
  text-align: center;
}

.carpool-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.room-number {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 20rpx;
}

.status-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20rpx;
}

.status-badge {
  font-size: 26rpx;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  font-weight: 500;
}

.status-recruiting { background-color: rgba(255, 255, 255, 0.2); }
.status-full { background-color: rgba(250, 173, 20, 0.2); }
.status-confirmed { background-color: rgba(24, 144, 255, 0.2); }

.player-count {
  font-size: 28rpx;
  font-weight: bold;
}

.info-card, .script-card, .host-card, .storyteller-card, .desc-card, .requirements-card, .contact-card, .members-card {
  margin: 20rpx;
}

.info-section {
  padding: 0;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 28rpx;
  width: 50rpx;
  flex-shrink: 0;
}

.info-label {
  font-size: 28rpx;
  color: #666666;
  width: 120rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
  line-height: 1.4;
}

.script-info {
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  border: 1rpx solid #e8e8e8;
}

.script-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 8rpx;
}

.script-meta {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 12rpx;
}

.script-desc {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.4;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin-right: 20rpx;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.storyteller-name {
  color: #8B4513 !important;
}

.user-level {
  font-size: 22rpx;
  color: #FF6B35;
  background-color: rgba(255, 107, 53, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
}

.user-tag {
  font-size: 22rpx;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
}

.contact-btn {
  background-color: #8B4513;
  color: white;
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.carpool-desc, .requirements-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  white-space: pre-line;
}

.contact-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.contact-label {
  font-size: 28rpx;
  color: #666666;
  width: 120rpx;
}

.contact-value {
  font-size: 28rpx;
  color: #8B4513;
  font-weight: bold;
}

.members-list {
  max-height: 400rpx;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.member-item:last-child {
  border-bottom: none;
}

.member-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  margin-right: 16rpx;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.member-level {
  font-size: 22rpx;
  color: #FF6B35;
  margin-bottom: 4rpx;
}

.member-message {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.3;
}

.member-status {
  text-align: right;
}

.status-text {
  font-size: 24rpx;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
}

.member-applied {
  background-color: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.member-confirmed {
  background-color: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.no-members {
  text-align: center;
  padding: 40rpx 0;
  color: #999999;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.action-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
}

.action-info {
  text-align: center;
  padding: 20rpx 0;
}

.info-text {
  font-size: 28rpx;
  color: #999999;
}

/* 弹窗样式 */
.apply-popup {
  background: white;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 60vh;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
}

.popup-close {
  font-size: 40rpx;
  color: #999999;
}

.popup-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 12rpx;
  display: block;
}

.apply-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.popup-footer {
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.submit-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

/* 底部安全区域 */
.action-bar {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
