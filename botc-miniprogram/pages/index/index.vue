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
        <text class="section-more" @click="refreshScripts">换一批 ></text>
      </view>
      <scroll-view scroll-x class="hot-scripts" v-if="hotScripts.length > 0">
        <view 
          v-for="script in hotScripts" 
          :key="script.id" 
          class="script-item fade-in"
          @click="goToScriptDetail(script.id)">
          <view class="script-cover">
            <text class="script-icon">📖</text>
          </view>
          <text class="script-name">{{ script.name }}</text>
          <text class="script-rating">⭐ {{ script.rating ? script.rating.toFixed(1) : '0.0' }}</text>
        </view>
      </scroll-view>
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无剧本数据</text>
      </view>
    </view>
    
    <!-- 最新拼车 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最新拼车</text>
        <text class="section-more" @click="refreshCarpools">换一批 ></text>
      </view>
      <view class="carpool-list" v-if="latestCarpools.length > 0">
        <view 
          v-for="carpool in latestCarpools" 
          :key="carpool.id" 
          class="carpool-item fade-in"
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
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">🚗</text>
        <text class="empty-text">暂无拼车信息</text>
      </view>
    </view>
    
    <!-- 社区动态 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">社区动态</text>
        <text class="section-more" @click="refreshPosts">换一批 ></text>
      </view>
      
      <!-- 帖子类型切换 -->
      <view class="post-tabs">
        <view 
          class="post-tab" 
          :class="{ active: currentPostTab === 'latest' }"
          @click="switchPostTab('latest')">
          <text class="tab-text">最新</text>
        </view>
        <view 
          class="post-tab" 
          :class="{ active: currentPostTab === 'hot' }"
          @click="switchPostTab('hot')">
          <text class="tab-text">火热</text>
        </view>
      </view>
      
      <!-- 帖子列表 - 四宫格 -->
      <view class="post-grid" v-if="currentPostList.length > 0">
        <view 
          v-for="post in currentPostList" 
          :key="post._id" 
          class="grid-item fade-in"
          @click="goToPostDetail(post._id)">
          <!-- 卡片内容 -->
          <view class="card-content">
            <!-- 封面图片 -->
            <view class="card-cover">
              <image 
                class="cover-image" 
                :src="getCoverImage(post)"
                mode="aspectFill"
              />
              <!-- 火热角标 -->
              <view v-if="currentPostTab === 'hot'" class="corner-badge hot-badge">🔥</view>
            </view>
            
            <!-- 标题和内容 -->
            <view class="card-text">
              <text class="card-title">{{ post.content }}</text>
            </view>
            
            <!-- 底部信息 -->
            <view class="card-footer">
              <!-- 用户头像 -->
              <image 
                class="mini-avatar" 
                :src="post.userAvatar || '/static/default-avatar.png'"
                mode="aspectFill"
              />
              
              <!-- 互动数据 -->
              <view class="meta-info">
                <view class="meta-item">
                  <text class="meta-icon">👁️</text>
                  <text class="meta-text">{{ formatCount(post.view_count || 0) }}</text>
                </view>
                <view class="meta-item">
                  <text class="meta-icon">❤️</text>
                  <text class="meta-text">{{ formatCount(post.like_count || 0) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无{{ currentPostTab === 'latest' ? '最新' : '火热' }}帖子</text>
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
      
      // 帖子相关
      currentPostTab: 'latest', // 当前选中的帖子标签：latest 或 hot
      latestPosts: [], // 最新帖子
      hotPosts: [], // 火热帖子
      postPage: 1, // 帖子页码
      
      // 防抖标记
      isRefreshingPosts: false,
      isRefreshingScripts: false,
      isRefreshingCarpools: false,
      
      // 热门剧本
      hotScripts: [],
      
      // 最新拼车
      latestCarpools: []
    }
  },
  
  computed: {
    // 当前显示的帖子列表
    currentPostList() {
      return this.currentPostTab === 'latest' ? this.latestPosts : this.hotPosts
    }
  },

  onLoad() {
    console.log('血染钟楼首页加载')
    // 初始化 post 云对象
    this.postObj = uniCloud.importObject('post', {
      customUI: true
    })
    this.loadHomeData()
    this.loadPosts()
    this.initScripts()
    this.initCarpools()
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
        }
      } catch (error) {
        console.error('加载首页数据失败:', error)
        // 使用默认数据
      }
    },
    
    // 加载帖子数据
    async loadPosts() {
      console.log('=== 加载首页帖子（使用云函数）===')
      
      try {
        // 使用云对象查询最新帖子
        console.log('1. 查询最新帖子...')
        const latestRes = await this.postObj.getList({
          page: 1,
          pageSize: 5,
          sortBy: 'time'
        })
        
        console.log('最新帖子返回:', latestRes)
        
        if (latestRes.code === 0) {
          this.latestPosts = latestRes.data.list.map(post => ({
            ...post,
            userName: post.user?.nickname || '匿名用户',
            userAvatar: post.user?.avatar || ''
          }))
          console.log('✅ 最新帖子加载成功，数量:', this.latestPosts.length)
        } else {
          console.error('最新帖子查询失败:', latestRes.message)
        }
        
        // 使用云对象查询火热帖子
        console.log('2. 查询火热帖子...')
        const hotRes = await this.postObj.getList({
          page: 1,
          pageSize: 5,
          sortBy: 'hot'
        })
        
        console.log('火热帖子返回:', hotRes)
        
        if (hotRes.code === 0) {
          this.hotPosts = hotRes.data.list.map(post => ({
            ...post,
            userName: post.user?.nickname || '匿名用户',
            userAvatar: post.user?.avatar || ''
          }))
          console.log('✅ 火热帖子加载成功，数量:', this.hotPosts.length)
        } else {
          console.error('火热帖子查询失败:', hotRes.message)
        }
        
        console.log('🎉 所有帖子加载完成')
        console.log('最新帖子数组长度:', this.latestPosts.length)
        console.log('火热帖子数组长度:', this.hotPosts.length)
        
      } catch (error) {
        console.error('❌ 加载帖子失败:', error)
        console.error('错误详情:', error.message)
      }
    },
    
    // 切换帖子标签
    switchPostTab(tab) {
      console.log('切换到:', tab)
      this.currentPostTab = tab
    },
    
    // 刷新帖子（换一批）- 带防抖
    refreshPosts() {
      // 防抖：如果正在刷新，直接返回
      if (this.isRefreshingPosts) {
        console.log('⚠️ 正在刷新中，请稍候')
        return
      }
      
      console.log('🔄 换一批帖子')
      this.isRefreshingPosts = true
      this.postPage++
      
      uni.showLoading({ title: '加载中...' })
      
      // 使用新的页码查询
      Promise.all([
        this.postObj.getList({
          page: this.postPage,
          pageSize: 4,
          sortBy: 'time'
        }),
        this.postObj.getList({
          page: this.postPage,
          pageSize: 4,
          sortBy: 'hot'
        })
      ]).then(([latestRes, hotRes]) => {
        if (latestRes.code === 0 && latestRes.data.list.length > 0) {
          this.latestPosts = latestRes.data.list.map(post => ({
            ...post,
            userName: post.user?.nickname || '匿名用户',
            userAvatar: post.user?.avatar || ''
          }))
        } else {
          // 没有更多数据，重置到第一页
          this.postPage = 1
          this.loadPosts()
        }
        
        if (hotRes.code === 0 && hotRes.data.list.length > 0) {
          this.hotPosts = hotRes.data.list.map(post => ({
            ...post,
            userName: post.user?.nickname || '匿名用户',
            userAvatar: post.user?.avatar || ''
          }))
        }
        
        uni.hideLoading()
        uni.showToast({ title: '换好了', icon: 'success', duration: 1000 })
        
        // 1秒后解除防抖
        setTimeout(() => {
          this.isRefreshingPosts = false
        }, 1000)
      }).catch(() => {
        uni.hideLoading()
        uni.showToast({ title: '加载失败', icon: 'none' })
        this.isRefreshingPosts = false
      })
    },
    
    // 初始化剧本数据
    async initScripts() {
      console.log('=== 初始化剧本数据 ===')
      await this.refreshScripts()
    },
    
    // 刷新剧本（换一批）- 从数据库随机查询 + 防抖（允许重复）
    async refreshScripts() {
      // 防抖：如果正在刷新，直接返回
      if (this.isRefreshingScripts) {
        console.log('⚠️ 正在刷新中，请稍候')
        return
      }
      
      console.log('🔄 换一批剧本')
      this.isRefreshingScripts = true
      
      try {
        const db = uniCloud.database()
        
        // 简化查询条件：只查询已发布的剧本，不排除已显示的
        const whereCondition = { status: 1 }
        
        console.log('剧本查询条件:', JSON.stringify(whereCondition))
        
        // 先获取总数
        console.log('开始查询剧本总数...')
        const countRes = await db.collection('botc-scripts')
          .where(whereCondition)
          .count()
        
        // 修正：uniCloud 返回的是 result.total
        const total = parseInt(countRes.result?.total || countRes.total || 0)
        
        console.log('剧本总数:', total, '类型:', typeof total)
        
        // 检查是否有数据
        if (total === 0) {
          console.warn('数据库中没有剧本')
          this.hotScripts = []
          this.isRefreshingScripts = false
          uni.showToast({ title: '暂无剧本数据', icon: 'none' })
          return
        }
        
        // 随机生成跳过的数量（必须是整数）
        // 如果总数少于4个，就显示全部
        const limitCount = Math.min(4, total)
        const maxSkip = Math.max(0, total - limitCount)
        const randomSkip = Math.floor(Math.random() * (maxSkip + 1))
        
        console.log('total:', total, 'limitCount:', limitCount, 'maxSkip:', maxSkip, 'randomSkip:', randomSkip)
        
        // 查询随机剧本
        const res = await db.collection('botc-scripts')
          .where(whereCondition)
          .field('_id,title,author,rating')
          .orderBy('rating', 'desc')
          .skip(parseInt(randomSkip))
          .limit(limitCount)
          .get()
        
        // 处理返回数据
        const scriptData = res.result?.data || res.data || []
        console.log('查询返回的剧本数据:', scriptData)
        
        if (scriptData && scriptData.length > 0) {
          this.hotScripts = scriptData.map(script => ({
            id: script._id,
            name: script.title,
            rating: script.average_rating || 0
          }))
          
          console.log('✅ 加载剧本成功:', this.hotScripts.length, '个')
        } else {
          // 查询不到数据
          this.hotScripts = []
          console.warn('未查询到剧本数据')
        }
        
        uni.showToast({ title: '换好了', icon: 'success', duration: 1000 })
        
        // 1秒后解除防抖
        setTimeout(() => {
          this.isRefreshingScripts = false
        }, 1000)
      } catch (error) {
        console.error('加载剧本失败:', error)
        this.hotScripts = []
        this.isRefreshingScripts = false
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 初始化拼车数据
    async initCarpools() {
      console.log('=== 初始化拼车数据 ===')
      await this.refreshCarpools()
    },
    
    // 刷新拼车（换一批）- 从数据库随机查询 + 防抖（允许重复）
    async refreshCarpools() {
      // 防抖：如果正在刷新，直接返回
      if (this.isRefreshingCarpools) {
        console.log('⚠️ 正在刷新中，请稍候')
        return
      }
      
      console.log('🔄 换一批拼车')
      this.isRefreshingCarpools = true
      
      try {
        const db = uniCloud.database()
        const dbCmd = db.command
        
        // 简化查询条件：只查询招募中且未过期的拼车，不排除已显示的
        const now = new Date()
        const whereCondition = { 
          status: 1,  // 招募中
          game_time: dbCmd.gt(now)  // 未过期
        }
        
        console.log('=== 拼车查询详情 ===')
        console.log('查询条件:', JSON.stringify(whereCondition))
        console.log('当前时间:', now.toLocaleString())
        
        // 先获取总数
        console.log('开始查询拼车总数...')
        const countRes = await db.collection('botc-carpool-rooms')
          .where(whereCondition)
          .count()
        
        // 修正：uniCloud 返回的是 result.total
        const total = parseInt(countRes.result?.total || countRes.total || 0)
        
        console.log('拼车总数:', total, '类型:', typeof total)
        
        // 检查是否有数据
        if (total === 0) {
          console.warn('数据库中没有未过期的拼车')
          this.latestCarpools = []
          this.isRefreshingCarpools = false
          uni.showToast({ title: '暂无拼车信息', icon: 'none' })
          return
        }
        
        // 随机生成跳过的数量（必须是整数）
        // 如果总数少于2个，就显示全部
        const limitCount = Math.min(2, total)
        const maxSkip = Math.max(0, total - limitCount)
        const randomSkip = Math.floor(Math.random() * (maxSkip + 1))
        
        console.log('total:', total, 'limitCount:', limitCount, 'maxSkip:', maxSkip, 'randomSkip:', randomSkip)
        
        // 查询随机拼车（按游戏时间升序，最近要开始的排前面）
        const res = await db.collection('botc-carpool-rooms')
          .where(whereCondition)
          .field('_id,title,location,current_players,max_players,game_time,status')
          .orderBy('game_time', 'asc')  // 按游戏时间升序，即将开始的在前
          .skip(parseInt(randomSkip))
          .limit(limitCount)
          .get()
        
        // 处理返回数据
        const carpoolData = res.result?.data || res.data || []
        console.log('查询返回的拼车数据:', carpoolData)
        
        if (carpoolData && carpoolData.length > 0) {
          this.latestCarpools = carpoolData.map(carpool => {
            // 计算游戏时间距离现在的时间差
            const gameTime = new Date(carpool.game_time)
            const timeLeft = gameTime - now
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
            const daysLeft = Math.floor(hoursLeft / 24)
            
            console.log('拼车:', carpool.title, '游戏时间:', gameTime.toLocaleString(), '剩余:', daysLeft, '天', hoursLeft % 24, '小时')
            
            return {
              id: carpool._id,
              title: carpool.title,
              location: carpool.location || '未知地点',
              currentPlayers: carpool.current_players || 0,
              maxPlayers: carpool.max_players || 10,
              gameTime: carpool.game_time,
              status: carpool.status
            }
          })
          
          console.log('✅ 加载拼车成功:', this.latestCarpools.length, '个')
        } else {
          // 查询不到数据
          this.latestCarpools = []
          console.warn('未查询到拼车数据')
        }
        
        uni.showToast({ title: '换好了', icon: 'success', duration: 1000 })
        
        // 1秒后解除防抖
        setTimeout(() => {
          this.isRefreshingCarpools = false
        }, 1000)
      } catch (error) {
        console.error('加载拼车失败:', error)
        this.latestCarpools = []
        this.isRefreshingCarpools = false
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    
    // 格式化帖子时间
    formatPostTime(timestamp) {
      if (!timestamp) return ''
      
      const now = Date.now()
      const diff = now - timestamp
      
      const minute = 60 * 1000
      const hour = 60 * minute
      const day = 24 * hour
      
      if (diff < minute) {
        return '刚刚'
      } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`
      } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`
      } else if (diff < 7 * day) {
        return `${Math.floor(diff / day)}天前`
      } else {
        const date = new Date(timestamp)
        return `${date.getMonth() + 1}-${date.getDate()}`
      }
    },
    
    // 刷新数据
    refreshData() {
      // 可以定期刷新统计数据
    },
    
    // 跳转到剧本榜单
    goToScriptRanking() {
      uni.navigateTo({
        url: '/pages/script/ranking/ranking'
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
    },
    
    // 跳转到帖子列表
    goToPostList() {
      uni.switchTab({
        url: '/pages/community/index'
      })
    },
    
    // 跳转到帖子详情
    goToPostDetail(postId) {
      console.log('跳转到帖子详情，ID:', postId)
      uni.navigateTo({
        url: `/pages/community/detail/detail?id=${postId}`
      })
    },
    
    // 获取封面图
    getCoverImage(post) {
      if (post.images && post.images.length > 0) {
        return post.images[0]
      }
      // 默认占位图
      return 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=BOTC'
    },
    
    // 格式化数字
    formatCount(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k'
      }
      return num.toString()
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
  font-weight: 500;
  color: #8B4513;
  line-height: 1.4;
  transition: all 0.3s;
}

.section-more:active {
  opacity: 0.6;
  transform: scale(0.95);
}

/* ========== 通用动画 ========== */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  min-height: 200rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  line-height: 1.5;
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

/* ========== 帖子标签切换 ========== */
.post-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.post-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  background: #FFFFFF;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(139, 69, 19, 0.06);
  transition: all 0.3s ease;
}

.post-tab.active {
  background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
}

.post-tab .tab-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #666666;
  line-height: 1.4;
}

.post-tab.active .tab-text {
  color: #FFFFFF;
}

/* ========== 帖子四宫格 ========== */
.post-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.grid-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  transition: all 0.3s ease;
}

.grid-item:active {
  transform: scale(0.95);
  opacity: 0.9;
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 封面图片 */
.card-cover {
  width: 100%;
  height: 280rpx;
  position: relative;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(210, 105, 30, 0.1) 100%);
}

.cover-image {
  width: 100%;
  height: 100%;
  display: block;
}

.corner-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  backdrop-filter: blur(10rpx);
  line-height: 1;
}

.hot-badge {
  background: rgba(255, 107, 53, 0.9);
  color: #FFFFFF;
}

/* 卡片文字 */
.card-text {
  padding: 20rpx;
  flex: 1;
}

.card-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 卡片底部 */
.card-footer {
  padding: 16rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #F0F0F0;
}

.mini-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #F0F0F0;
}

.meta-info {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.meta-icon {
  font-size: 24rpx;
  line-height: 1;
}

.meta-text {
  font-size: 22rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.4;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
  line-height: 1;
}

.empty-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
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