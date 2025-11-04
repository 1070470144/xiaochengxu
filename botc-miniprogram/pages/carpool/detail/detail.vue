<template>
  <view class="page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 拼车详情 -->
    <view v-else-if="carpoolDetail" class="carpool-detail">
      <!-- 头部信息 - 渐变背景 -->
      <view class="detail-header">
        <view class="header-content">
          <view class="title-row">
            <text class="detail-title">{{ carpoolDetail.title }}</text>
            <text class="room-badge">#{{ carpoolDetail.room_number }}</text>
          </view>
          <view class="status-row">
            <view class="status-tag" :class="getStatusClass(carpoolDetail.status)">
              <text class="status-dot">●</text>
              <text class="status-label">{{ getStatusText(carpoolDetail.status) }}</text>
            </view>
            <view class="player-info">
              <text class="player-icon">👥</text>
              <text class="player-count">{{ carpoolDetail.current_players }}/{{ carpoolDetail.max_players }}人</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 基础信息卡片 - 网格布局 -->
      <view class="section-card info-grid-card">
        <view class="grid-container">
          <!-- 时间 -->
          <view class="grid-item">
            <view class="grid-icon">⏰</view>
            <view class="grid-content">
              <text class="grid-label">游戏时间</text>
              <text class="grid-value">{{ formatGameTime(carpoolDetail.game_time) }}</text>
            </view>
          </view>
          
          <!-- 地点 -->
          <view class="grid-item" @click="openMap">
            <view class="grid-icon">📍</view>
            <view class="grid-content">
              <text class="grid-label">游戏地点</text>
              <text class="grid-value">{{ carpoolDetail.location }}</text>
              <view v-if="carpoolDetail.latitude && carpoolDetail.longitude" class="map-hint">
                <text class="hint-text">点击查看地图</text>
                <text class="hint-arrow">›</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 详细地址（如果有） -->
        <view v-if="carpoolDetail.location_detail" class="detail-address">
          <view class="address-icon">🗺️</view>
          <text class="address-text">{{ carpoolDetail.location_detail }}</text>
        </view>
      </view>

      <!-- 关联剧本信息 -->
      <view v-if="carpoolDetail.script" class="section-card script-card-simple">
        <view class="section-header-inline">
          <view class="section-icon">🎭</view>
          <text class="section-title">关联剧本</text>
        </view>
        <view class="section-body">
          <view class="script-simple-content" @click="goToScript(carpoolDetail.script._id)">
            <image 
              class="script-logo" 
              :src="getScriptCover(carpoolDetail.script)"
              mode="aspectFill">
            </image>
            <text class="script-simple-name">{{ carpoolDetail.script.title }}</text>
            <text class="view-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 人员信息卡片 -->
      <view class="section-card people-card">
        <view class="section-header-inline">
          <view class="section-icon">👤</view>
          <text class="section-title">人员信息</text>
        </view>
        <view class="section-body">
          <!-- 发起人 -->
          <view class="person-row" @click="chatWithHost">
            <image class="person-avatar" :src="carpoolDetail.host.avatar || '/static/images/default-avatar.png'"></image>
            <view class="person-info">
              <view class="person-name-row">
                <text class="person-name">{{ carpoolDetail.host.nickname }}</text>
                <view class="person-badge host-badge">发起人</view>
              </view>
              <text class="person-level">Lv.{{ carpoolDetail.host.level || 1 }}</text>
            </view>
            <view class="action-link">
              <text class="link-text">私聊</text>
              <text class="link-arrow">›</text>
            </view>
          </view>
          
          <!-- 说书人 -->
          <view v-if="carpoolDetail.storyteller" class="person-row storyteller-row" @click="goToStorytellerProfile(carpoolDetail.storyteller._id)">
            <image class="person-avatar" :src="carpoolDetail.storyteller.avatar || '/static/images/default-avatar.png'"></image>
            <view class="person-info">
              <view class="person-name-row">
                <text class="person-name storyteller-highlight">{{ carpoolDetail.storyteller.nickname }}</text>
                <view class="person-badge storyteller-badge">说书人</view>
              </view>
              <text class="person-tag">认证说书人</text>
            </view>
            <view class="action-link">
              <text class="link-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 详细说明 -->
      <view v-if="carpoolDetail.description" class="section-card">
        <view class="section-header-inline">
          <view class="section-icon">📋</view>
          <text class="section-title">详细说明</text>
        </view>
        <view class="section-body">
          <text class="content-text">{{ carpoolDetail.description }}</text>
        </view>
      </view>

      <!-- 玩家要求 -->
      <view v-if="carpoolDetail.requirements" class="section-card">
        <view class="section-header-inline">
          <view class="section-icon">✓</view>
          <text class="section-title">玩家要求</text>
        </view>
        <view class="section-body">
          <text class="content-text">{{ carpoolDetail.requirements }}</text>
        </view>
      </view>

      <!-- 联系方式（只有报名成功后才显示） -->
      <view v-if="showContactInfo" class="section-card">
        <view class="section-header-inline">
          <view class="section-icon">📞</view>
          <text class="section-title">联系方式</text>
        </view>
        <view class="section-body">
          <view v-if="carpoolDetail.contact_wechat" class="contact-item" @click="copyContact(carpoolDetail.contact_wechat)">
            <view class="contact-label-box">
              <text class="contact-icon">💬</text>
              <text class="contact-label">微信号</text>
            </view>
            <text class="contact-value">{{ carpoolDetail.contact_wechat }}</text>
            <text class="copy-hint">点击复制</text>
          </view>
          <view v-if="carpoolDetail.contact_phone" class="contact-item" @click="callPhone(carpoolDetail.contact_phone)">
            <view class="contact-label-box">
              <text class="contact-icon">📱</text>
              <text class="contact-label">手机号</text>
            </view>
            <text class="contact-value">{{ carpoolDetail.contact_phone }}</text>
            <text class="copy-hint">点击拨打</text>
          </view>
        </view>
      </view>

      <!-- 参与成员 -->
      <view class="section-card members-card-new">
        <view class="section-header-inline">
          <view class="section-icon">👥</view>
          <text class="section-title">参与成员</text>
          <view class="member-count-badge">
            <text>{{ carpoolDetail.current_players }}/{{ carpoolDetail.max_players }}</text>
          </view>
        </view>
        <view class="section-body">
          <view v-if="carpoolDetail.members && carpoolDetail.members.length > 0" class="members-grid">
            <view v-for="member in carpoolDetail.members" :key="member._id" class="member-card">
              <image class="member-avatar-large" :src="member.user.avatar || '/static/images/default-avatar.png'"></image>
              <view class="member-details">
                <text class="member-name-text">{{ member.user.nickname }}</text>
                <text class="member-level-text">Lv.{{ member.user.level || 1 }}</text>
                <view class="member-status-tag" :class="getMemberStatusClass(member.status)">
                  <text>{{ getMemberStatusText(member.status) }}</text>
                </view>
              </view>
              <text v-if="member.message" class="member-msg-text">{{ member.message }}</text>
            </view>
          </view>
          <view v-else class="empty-members">
            <text class="empty-icon">👤</text>
            <text class="empty-text">暂无其他成员</text>
          </view>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="bottom-action-bar">
        <button v-if="!isHost && !hasApplied && carpoolDetail.status === 1" 
                class="action-button action-primary" 
                @click="showApplyModal">
          <text class="button-text">立即报名</text>
        </button>
        
        <button v-else-if="hasApplied && !isConfirmed" 
                class="action-button action-secondary" 
                @click="quitCarpool">
          <text class="button-text">取消报名</text>
        </button>
        
        <button v-else-if="isHost" 
                class="action-button action-manage" 
                @click="manageRoom">
          <text class="button-text">管理房间</text>
        </button>
        
        <view v-else class="action-status">
          <text class="status-info-text">{{ getActionText() }}</text>
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
import Auth from '@/utils/auth.js'

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
    // 初始化 carpool 云对象
    this.carpoolObj = uniCloud.importObject('carpool', {
      customUI: true
    })
    
    if (options.id) {
      this.carpoolId = options.id
      this.getCurrentUser()
      this.loadCarpoolDetail()
      
      // 记录浏览历史
      if (Auth.isLogin()) {
        this.recordHistory()
      }
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
        const result = await this.carpoolObj.getDetail(this.carpoolId)

        if (result.code === 0) {
          this.carpoolDetail = result.data
          this.analyzeUserStatus()
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.carpoolDetail.title
          })
        } else {
          throw new Error(result.message)
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

    // 记录浏览历史
    async recordHistory() {
      try {
        await uniCloud.callFunction({
          name: 'history-add',
          data: {
            target_type: 'carpool',
            target_id: this.carpoolId,
            token: Auth.getToken()
          }
        })
        console.log('✅ 浏览历史记录成功')
      } catch (error) {
        console.error('记录浏览历史失败：', error)
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
        const result = await this.carpoolObj.apply(
          this.carpoolId,
          this.applyMessage.trim()
        )

        if (result.code === 0) {
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
          throw new Error(result.message)
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
              
              const result = await this.carpoolObj.cancelApply(this.carpoolId)

              if (result.code === 0) {
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
    },

    // 获取剧本封面（优先使用用户上传图片，其次生成艺术字）
    getScriptCover(script) {
      // 1. 优先使用用户上传的图片
      if (script.user_images && script.user_images.length > 0) {
        // 随机选择一张用户上传的图片
        const randomIndex = Math.floor(Math.random() * script.user_images.length)
        return script.user_images[randomIndex]
      }
      
      // 2. 生成艺术字缩略图（使用剧本名称）
      return this.generateTitleImage(script.title || '未命名')
    },
    
    // 生成艺术字缩略图（使用 Canvas 或 SVG）
    generateTitleImage(title) {
      // 取标题前2-4个字
      const displayText = title.length > 4 ? title.substring(0, 4) : title
      
      // 生成渐变色配置
      const colors = [
        ['#667eea', '#764ba2'],  // 紫色渐变
        ['#f093fb', '#f5576c'],  // 粉红渐变
        ['#4facfe', '#00f2fe'],  // 蓝色渐变
        ['#43e97b', '#38f9d7'],  // 绿色渐变
        ['#fa709a', '#fee140'],  // 橙粉渐变
        ['#30cfd0', '#330867'],  // 蓝紫渐变
        ['#a8edea', '#fed6e3'],  // 薄荷粉渐变
        ['#ff9a9e', '#fecfef'],  // 柔粉渐变
      ]
      
      // 根据标题生成固定的颜色索引（同一标题总是相同颜色）
      const hash = this.hashCode(title)
      const colorPair = colors[Math.abs(hash) % colors.length]
      
      // 生成 SVG 艺术字
      const svg = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#grad-${Date.now()})" />
  <text x="50%" y="50%" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        fill="white" 
        font-size="${title.length <= 2 ? '56' : '48'}" 
        font-weight="bold" 
        font-family="Arial, sans-serif"
        stroke="rgba(0,0,0,0.2)"
        stroke-width="1">
    ${displayText}
  </text>
</svg>`.trim()
      
      // 转换为 base64
      const base64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
      return base64
    },
    
    // 生成字符串哈希值（确保同一标题总是得到相同的颜色）
    hashCode(str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return hash
    },

    // 打开地图查看位置
    openMap() {
      if (!this.carpoolDetail) {
        return
      }

      const latitude = this.carpoolDetail.latitude
      const longitude = this.carpoolDetail.longitude

      // 如果没有经纬度，提示用户
      if (!latitude || !longitude) {
        uni.showToast({
          title: '该拼车未设置地图位置',
          icon: 'none',
          duration: 2000
        })
        return
      }

      console.log('=== 打开地图 ===')
      console.log('位置名称:', this.carpoolDetail.location)
      console.log('详细地址:', this.carpoolDetail.location_detail)
      console.log('纬度:', latitude)
      console.log('经度:', longitude)

      // 检查当前平台
      // #ifdef H5
      // H5环境 - 显示地址信息
      uni.showModal({
        title: '游戏地点',
        content: `${this.carpoolDetail.location}\n\n${this.carpoolDetail.location_detail || ''}\n\n纬度: ${latitude}\n经度: ${longitude}\n\nH5环境暂不支持打开地图，请在微信小程序或App中查看`,
        showCancel: false,
        confirmText: '知道了'
      })
      return
      // #endif

      // #ifdef MP-WEIXIN || APP-PLUS
      // 微信小程序或App环境 - 打开地图
      uni.openLocation({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: this.carpoolDetail.location,
        address: this.carpoolDetail.location_detail || this.carpoolDetail.location,
        scale: 15, // 缩放级别（5-18），默认18
        success: () => {
          console.log('✅ 地图打开成功')
        },
        fail: (err) => {
          console.error('❌ 打开地图失败:', err)
          uni.showToast({
            title: '打开地图失败',
            icon: 'none'
          })
        }
      })
      // #endif
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
/* 页面背景 - 温暖米色调 */
.page {
  background: #FAF9F7;
  min-height: 100vh;
  padding-bottom: 160rpx;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.carpool-detail {
  min-height: 100vh;
}

/* === 头部信息区域 === */
.detail-header {
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
  padding: 48rpx 32rpx 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 99, 71, 0.15);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.detail-title {
  flex: 1;
  font-size: 40rpx;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.3;
  letter-spacing: 1rpx;
}

.room-badge {
  font-size: 24rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.15);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  line-height: 1;
  white-space: nowrap;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10rpx);
}

.status-dot {
  font-size: 16rpx;
  line-height: 1;
}

.status-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1;
}

/* 状态样式 */
.status-recruiting {
  background: rgba(127, 176, 105, 0.3);
}

.status-recruiting .status-dot {
  color: #7FB069;
  animation: pulse 2s ease-in-out infinite;
}

.status-full {
  background: rgba(232, 184, 97, 0.3);
}

.status-full .status-dot {
  color: #E8B861;
}

.status-confirmed {
  background: rgba(93, 173, 226, 0.3);
}

.status-confirmed .status-dot {
  color: #5DADE2;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 10rpx 16rpx;
  border-radius: 16rpx;
  backdrop-filter: blur(10rpx);
}

.player-icon {
  font-size: 24rpx;
  line-height: 1;
}

.player-count {
  font-size: 26rpx;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1;
}

/* === 通用卡片样式 === */
.section-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  margin: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 99, 71, 0.08);
  border: 1rpx solid rgba(139, 99, 71, 0.06);
  overflow: hidden;
}

.section-header-inline {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 24rpx 20rpx;
  border-bottom: 1rpx solid #F5F0EB;
}

.section-icon {
  font-size: 32rpx;
  line-height: 1;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #5D4E37;
  line-height: 1;
  flex: 1;
}

.section-body {
  padding: 24rpx;
}

/* === 基础信息网格 === */
.info-grid-card {
  margin-top: -20rpx;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  padding: 24rpx;
}

.grid-item {
  display: flex;
  gap: 12rpx;
  background: #FAF8F5;
  padding: 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(160, 120, 90, 0.08);
}

.grid-icon {
  font-size: 32rpx;
  line-height: 1;
}

.grid-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.grid-label {
  font-size: 24rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1;
}

.grid-value {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.4;
}

.map-hint {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-top: 8rpx;
}

.map-hint .hint-text {
  font-size: 22rpx;
  font-weight: 500;
  color: #A0785A;
  line-height: 1;
}

.map-hint .hint-arrow {
  font-size: 24rpx;
  font-weight: 300;
  color: #A0785A;
  line-height: 1;
}

.grid-item:active {
  background: #F5F0EB;
  transform: scale(0.98);
  transition: all 0.2s;
}

.detail-address {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #FAF8F5 0%, #F5F0EB 100%);
  border-top: 1rpx solid rgba(160, 120, 90, 0.08);
}

.address-icon {
  font-size: 28rpx;
  line-height: 1;
  margin-top: 2rpx;
}

.address-text {
  flex: 1;
  font-size: 26rpx;
  font-weight: 400;
  color: #6B5744;
  line-height: 1.5;
}

/* === 剧本卡片（简化版） === */
.script-simple-content {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #FAF8F5;
  border-radius: 12rpx;
  border: 1rpx solid rgba(160, 120, 90, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.script-simple-content:active {
  background: #F5F0EB;
  transform: scale(0.98);
}

.script-logo {
  width: 88rpx;
  height: 88rpx;
  border-radius: 12rpx;
  border: 2rpx solid rgba(160, 120, 90, 0.1);
  flex-shrink: 0;
}

.script-logo-placeholder {
  width: 88rpx;
  height: 88rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #F5F0EB 0%, #E8E0D5 100%);
  border: 2rpx solid rgba(160, 120, 90, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.placeholder-icon {
  font-size: 48rpx;
  opacity: 0.4;
  line-height: 1;
}

.script-simple-name {
  flex: 1;
  font-size: 32rpx;
  font-weight: 700;
  color: #8B6F47;
  line-height: 1.3;
}

.view-arrow {
  font-size: 40rpx;
  font-weight: 300;
  color: #A0785A;
  line-height: 1;
}

/* === 人员信息卡片 === */
.person-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
}

.person-row + .person-row {
  border-top: 1rpx solid #F5F0EB;
  padding-top: 20rpx;
}

.person-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  border: 2rpx solid #F0EBE6;
  flex-shrink: 0;
}

.storyteller-row .person-avatar {
  border-color: rgba(160, 120, 90, 0.2);
}

.person-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.person-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.person-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1A1A1A;
  line-height: 1;
}

.storyteller-highlight {
  color: #8B6F47;
}

.person-badge {
  font-size: 22rpx;
  font-weight: 500;
  padding: 6rpx 10rpx;
  border-radius: 8rpx;
  line-height: 1;
}

.host-badge {
  color: #7FB069;
  background: rgba(127, 176, 105, 0.12);
}

.storyteller-badge {
  color: #8B6F47;
  background: rgba(160, 120, 90, 0.12);
}

.person-level {
  font-size: 24rpx;
  font-weight: 500;
  color: #D4A86A;
  background: rgba(212, 168, 106, 0.15);
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  line-height: 1;
  align-self: flex-start;
}

.person-tag {
  font-size: 24rpx;
  font-weight: 400;
  color: #8B6F47;
  line-height: 1;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.link-text {
  font-size: 26rpx;
  font-weight: 500;
  color: #A0785A;
  line-height: 1;
}

.link-arrow {
  font-size: 32rpx;
  font-weight: 300;
  color: #A0785A;
  line-height: 1;
}

/* === 内容文本 === */
.content-text {
  font-size: 28rpx;
  font-weight: 400;
  color: #1A1A1A;
  line-height: 1.7;
  white-space: pre-line;
}

/* === 联系方式卡片 === */
.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background: #FAF8F5;
  border-radius: 12rpx;
  border: 1rpx solid rgba(160, 120, 90, 0.08);
  margin-bottom: 16rpx;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.contact-label-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.contact-icon {
  font-size: 32rpx;
  line-height: 1;
}

.contact-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #6B5744;
  line-height: 1;
}

.contact-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #A0785A;
  line-height: 1;
  flex: 1;
  text-align: center;
}

.copy-hint {
  font-size: 24rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1;
}

/* === 参与成员卡片 === */
.member-count-badge {
  background: rgba(160, 120, 90, 0.12);
  color: #A0785A;
  font-size: 24rpx;
  font-weight: 600;
  padding: 8rpx 12rpx;
  border-radius: 10rpx;
  line-height: 1;
}

.members-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.member-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 20rpx;
  background: #FAF8F5;
  border-radius: 12rpx;
  border: 1rpx solid rgba(160, 120, 90, 0.08);
}

.member-avatar-large {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  border: 2rpx solid #F0EBE6;
  margin-bottom: 4rpx;
}

.member-details {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.member-name-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  line-height: 1;
}

.member-level-text {
  font-size: 22rpx;
  font-weight: 500;
  color: #D4A86A;
  background: rgba(212, 168, 106, 0.15);
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  line-height: 1;
}

.member-status-tag {
  font-size: 22rpx;
  font-weight: 500;
  padding: 6rpx 10rpx;
  border-radius: 8rpx;
  line-height: 1;
  margin-left: auto;
}

.member-applied {
  background: rgba(232, 184, 97, 0.15);
  color: #E8B861;
}

.member-confirmed {
  background: rgba(127, 176, 105, 0.15);
  color: #7FB069;
}

.member-msg-text {
  font-size: 24rpx;
  font-weight: 400;
  color: #6B5744;
  line-height: 1.5;
}

.empty-members {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 60rpx 20rpx;
}

.empty-icon {
  font-size: 64rpx;
  opacity: 0.3;
  line-height: 1;
}

.empty-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1;
}

/* === 底部操作栏 === */
.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(139, 99, 71, 0.06);
  box-shadow: 0 -4rpx 20rpx rgba(139, 99, 71, 0.08);
  z-index: 100;
}

.action-button {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(160, 120, 90, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 16rpx rgba(160, 120, 90, 0.2);
}

.action-primary {
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
}

.action-secondary {
  background: linear-gradient(135deg, #E8B861 0%, #D4A856 100%);
  box-shadow: 0 8rpx 24rpx rgba(232, 184, 97, 0.25);
}

.action-manage {
  background: linear-gradient(135deg, #7FB069 0%, #8BC34A 100%);
  box-shadow: 0 8rpx 24rpx rgba(127, 176, 105, 0.25);
}

.button-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 2rpx;
  line-height: 1;
}

.action-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
}

.status-info-text {
  font-size: 28rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1.5;
}

/* === 报名弹窗 === */
.apply-popup {
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 60vh;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #F5F0EB;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #5D4E37;
  line-height: 1;
}

.popup-close {
  font-size: 48rpx;
  font-weight: 300;
  color: #BFBFBF;
  line-height: 1;
}

.popup-body {
  padding: 32rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #5D4E37;
  line-height: 1;
}

.apply-textarea {
  width: 100%;
  min-height: 180rpx;
  padding: 20rpx;
  background: #FAF8F5;
  border: 1rpx solid rgba(160, 120, 90, 0.15);
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #1A1A1A;
  box-sizing: border-box;
}

.popup-footer {
  padding: 20rpx 32rpx 32rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
  border-radius: 44rpx;
  border: none;
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  box-shadow: 0 8rpx 24rpx rgba(160, 120, 90, 0.3);
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
</style>
