<template>
  <view class="page">
    <!-- 欢迎横幅 -->
    <view class="welcome-banner">
      <view class="banner-content">
        <text class="banner-title">血染钟楼</text>
        <text class="banner-subtitle">Blood on the Clocktower</text>
        <text class="banner-desc">中国区玩家交流平台</text>
      </view>
      <view class="banner-decoration">🕰️</view>
    </view>
    
    <!-- 数据统计 -->
    <view class="stats-section">
      <view class="stat-item">
        <text class="stat-number">{{ stats.scriptCount }}+</text>
        <text class="stat-label">剧本</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ stats.carpoolCount }}+</text>
        <text class="stat-label">拼车</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ stats.userCount }}+</text>
        <text class="stat-label">玩家</text>
      </view>
    </view>
    
    <!-- 核心功能 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">核心功能</text>
      </view>
      <view class="function-grid-three">
        <view class="function-card-large primary" @click="goToScriptRanking">
          <view class="card-icon">📚</view>
          <text class="card-title">剧本榜单</text>
          <text class="card-desc">{{ stats.scriptCount }}+ 精选剧本</text>
          <view class="card-badge">热门</view>
        </view>
        
        <view class="function-card-large primary" @click="goToStorytellerRanking">
          <view class="card-icon">🎭</view>
          <text class="card-title">说书人榜单</text>
          <text class="card-desc">认证说书人推荐</text>
          <view class="card-badge new">推荐</view>
        </view>
        
        <view class="function-card-large highlight" @click="goToCarpoolTool">
          <view class="card-icon">🚗</view>
          <text class="card-title">拼车组局工具</text>
          <text class="card-desc">快速发起线下局</text>
          <view class="card-badge active">快捷</view>
        </view>
      </view>
    </view>
    
    <!-- 热门剧本 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">热门剧本</text>
        <text class="section-more" @click="goToScriptList">查看全部 ></text>
      </view>
      <scroll-view scroll-x class="hot-scripts">
        <view 
          v-for="script in hotScripts" 
          :key="script.id" 
          class="script-item"
          @click="goToScriptDetail(script.id)">
          <view class="script-cover">
            <text class="script-icon">📖</text>
          </view>
          <text class="script-name">{{ script.name }}</text>
          <text class="script-rating">⭐ {{ script.rating }}</text>
        </view>
      </scroll-view>
    </view>
    
    <!-- 最新拼车 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最新拼车</text>
        <text class="section-more" @click="goToCarpoolList">查看全部 ></text>
      </view>
      <view class="carpool-list">
        <view 
          v-for="carpool in latestCarpools" 
          :key="carpool.id" 
          class="carpool-item"
          @click="goToCarpoolDetail(carpool.id)">
          <view class="carpool-header">
            <text class="carpool-title">{{ carpool.title }}</text>
            <view class="status-badge recruiting">招募中</view>
          </view>
          <view class="carpool-info">
            <text class="info-text">📍 {{ carpool.location }}</text>
            <text class="info-text">👥 {{ carpool.currentPlayers }}/{{ carpool.maxPlayers }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 关于平台 -->
    <view class="about-section">
      <text class="about-title">关于血染钟楼</text>
      <text class="about-text">Blood on the Clocktower 是一款融合社交推理、角色扮演和策略思考的桌游。本平台为中国区玩家提供剧本分享、线下组局、说书人认证等一站式服务。</text>
      
      <view class="feature-list">
        <view class="feature-item">
          <text class="feature-icon">✨</text>
          <text class="feature-text">海量剧本资源库</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🤝</text>
          <text class="feature-text">便捷的线下组局</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🎯</text>
          <text class="feature-text">专业说书人认证</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'Index',
  
  data() {
    return {
      // 平台统计数据
      stats: {
        scriptCount: 50,
        carpoolCount: 20,
        userCount: 500
      },
      
      // 热门剧本（模拟数据）
      hotScripts: [
        { id: 1, name: '暗流涌动', rating: 4.8 },
        { id: 2, name: '上帝缺席', rating: 4.9 },
        { id: 3, name: '坏月亮', rating: 4.7 },
        { id: 4, name: '无神论者', rating: 4.6 }
      ],
      
      // 最新拼车（模拟数据）
      latestCarpools: [
        { 
          id: 1, 
          title: '周末上帝缺席车', 
          location: '北京朝阳区',
          currentPlayers: 8,
          maxPlayers: 15
        },
        { 
          id: 2, 
          title: '暗流涌动开车啦', 
          location: '上海浦东新区',
          currentPlayers: 5,
          maxPlayers: 12
        }
      ]
    }
  },

  onLoad() {
    console.log('血染钟楼首页加载')
    this.loadHomeData()
  },
  
  onShow() {
    // 页面显示时刷新数据
    this.refreshData()
  },
  
  methods: {
    // 加载首页数据
    async loadHomeData() {
      try {
        const res = await uniCloud.callFunction({
          name: 'home-data',
          data: {}
        })
        
        if (res.result.code === 0) {
          this.stats = res.result.data.stats
          this.hotScripts = res.result.data.hotScripts
          this.latestCarpools = res.result.data.latestCarpools
        }
      } catch (error) {
        console.error('加载首页数据失败:', error)
        // 使用默认数据
      }
    },
    
    // 刷新数据
    refreshData() {
      // 可以定期刷新统计数据
    },
    
    // 跳转到剧本榜单（剧本-查看榜单）
    goToScriptRanking() {
      uni.switchTab({
        url: '/pages/script/index/index',
        success: () => {
          // 切换到查看榜单标签
          uni.$emit('switchScriptTab', 'ranking')
        }
      })
    },
    
    // 跳转到说书人榜单（工具-榜单，默认说书人榜）
    goToStorytellerRanking() {
      uni.switchTab({
        url: '/pages/tools/index/index',
        success: () => {
          // 延迟触发，确保页面已加载
          setTimeout(() => {
            uni.$emit('openRankingFromHome')
          }, 100)
        }
      })
    },
    
    // 跳转到拼车组局工具（工具-拼车）
    goToCarpoolTool() {
      uni.switchTab({
        url: '/pages/tools/index/index',
        success: () => {
          // 延迟触发，确保页面已加载
          setTimeout(() => {
            uni.$emit('openCarpoolFromHome')
          }, 100)
        }
      })
    },
    
    // 跳转到剧本列表
    goToScriptList() {
      uni.switchTab({
        url: '/pages/script/list/list'
      })
    },
    
    // 跳转到拼车列表
    goToCarpoolList() {
      uni.switchTab({
        url: '/pages/carpool/list/list'
      })
    },
    
    // 跳转到剧本详情
    goToScriptDetail(id) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${id}`
      })
    },
    
    // 跳转到拼车详情
    goToCarpoolDetail(id) {
      uni.navigateTo({
        url: `/pages/carpool/detail/detail?id=${id}`
      })
    }
  }
}
</script>

<style scoped>
/* 页面容器 */
.page {
  padding-bottom: 40rpx;
  background-color: #F8F8F8;
  min-height: 100vh;
}

/* ========== 欢迎横幅 ========== */
.welcome-banner {
  background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
  padding: 48rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #FFFFFF;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.3;
}

.banner-subtitle {
  font-size: 24rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.banner-desc {
  font-size: 26rpx;
  font-weight: 500;
  color: #FFFFFF;
  display: block;
  line-height: 1.5;
}

.banner-decoration {
  font-size: 88rpx;
  opacity: 0.3;
  line-height: 1;
}

/* ========== 数据统计 ========== */
.stats-section {
  background: #FFFFFF;
  margin: 32rpx;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 36rpx;
  font-weight: 700;
  color: #8B4513;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.2;
}

.stat-label {
  font-size: 24rpx;
  font-weight: 400;
  color: #999999;
  display: block;
  line-height: 1.4;
}

.stat-divider {
  width: 1px;
  height: 40rpx;
  background-color: #E8E8E8;
}

/* ========== 区块 ========== */
.section {
  margin: 0 32rpx 40rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1.4;
}

.section-more {
  font-size: 26rpx;
  font-weight: 400;
  color: #8B4513;
  line-height: 1.4;
}

/* ========== 功能卡片 ========== */
.function-grid-three {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16rpx;
}

.function-card-large {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  min-height: 200rpx;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.function-card-large.primary {
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.05) 0%, rgba(210, 105, 30, 0.05) 100%);
}

.function-card-large.highlight {
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.05) 0%, rgba(82, 196, 26, 0.1) 100%);
}

.function-card-large:active {
  transform: scale(0.95);
  opacity: 0.9;
}

.card-icon {
  font-size: 56rpx;
  margin-bottom: 12rpx;
  line-height: 1;
}

.card-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.3;
}

.card-desc {
  font-size: 20rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
  text-align: center;
  padding: 0 4rpx;
}

.card-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  background: #FF6B35;
  color: #FFFFFF;
  font-size: 18rpx;
  font-weight: 500;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  line-height: 1;
}

.card-badge.new {
  background: #52C41A;
}

.card-badge.active {
  background: #1890FF;
}

/* ========== 热门剧本 ========== */
.hot-scripts {
  white-space: nowrap;
  display: flex;
}

.script-item {
  display: inline-block;
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-right: 24rpx;
  min-width: 200rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  transition: all 0.3s ease;
}

.script-item:active {
  transform: scale(0.95);
}

.script-cover {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(210, 105, 30, 0.1) 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
}

.script-icon {
  font-size: 48rpx;
}

.script-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.script-rating {
  font-size: 24rpx;
  font-weight: 400;
  color: #FF6B35;
  display: block;
  line-height: 1.4;
}

/* ========== 最新拼车 ========== */
.carpool-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.carpool-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  transition: all 0.3s ease;
}

.carpool-item:active {
  transform: scale(0.98);
  opacity: 0.95;
}

.carpool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.carpool-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  flex: 1;
  margin-right: 16rpx;
  line-height: 1.4;
}

.status-badge {
  font-size: 22rpx;
  font-weight: 500;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  color: #FFFFFF;
  background: #52C41A;
  line-height: 1;
}

.status-badge.recruiting {
  background: #52C41A;
}

.carpool-info {
  display: flex;
  gap: 32rpx;
}

.info-text {
  font-size: 24rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.4;
}

/* ========== 关于平台 ========== */
.about-section {
  background: #FFFFFF;
  margin: 0 32rpx;
  padding: 40rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
}

.about-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #8B4513;
  display: block;
  margin-bottom: 24rpx;
  line-height: 1.4;
}

.about-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 32rpx;
  display: block;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: rgba(139, 69, 19, 0.03);
  border-radius: 12rpx;
}

.feature-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
  line-height: 1;
}

.feature-text {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.4;
}
</style>