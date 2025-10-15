<template>
  <view class="page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 剧本详情 -->
    <view v-else-if="scriptDetail" class="script-detail">
      <!-- 头部信息 -->
      <view class="script-header">
        <view class="header-content">
          <text class="script-title">{{ scriptDetail.title }}</text>
          <text v-if="scriptDetail.subtitle" class="script-subtitle">{{ scriptDetail.subtitle }}</text>
          
          <view class="script-rating flex-center">
            <text class="rating-score">⭐{{ scriptDetail.rating || '0.0' }}</text>
            <text class="rating-count">({{ scriptDetail.rating_count || 0 }}人评价)</text>
          </view>
        </view>
      </view>

      <!-- 基础信息卡片 -->
      <view class="info-card card">
        <view class="card-body">
          <view class="info-row">
            <text class="info-label">作者：</text>
            <text class="info-value">{{ scriptDetail.author || '未知' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">人数：</text>
            <text class="info-value">{{ scriptDetail.player_count || '未知' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">时长：</text>
            <text class="info-value">{{ scriptDetail.duration ? scriptDetail.duration + '分钟' : '未知' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">难度：</text>
            <text class="info-value difficulty" :class="getDifficultyClass(scriptDetail.difficulty)">
              {{ getDifficultyText(scriptDetail.difficulty) }}
            </text>
          </view>
          <view class="info-row">
            <text class="info-label">统计：</text>
            <text class="info-value">
              {{ scriptDetail.view_count || 0 }}次浏览 · {{ scriptDetail.download_count || 0 }}次下载
            </text>
          </view>
        </view>
      </view>

      <!-- 剧本描述 -->
      <view class="desc-card card">
        <view class="card-header">
          <text class="card-title">剧本介绍</text>
        </view>
        <view class="card-body">
          <text class="script-desc">{{ scriptDetail.description || '暂无介绍' }}</text>
        </view>
      </view>

      <!-- 标签 -->
      <view v-if="scriptDetail.tags && scriptDetail.tags.length > 0" class="tags-card card">
        <view class="card-header">
          <text class="card-title">标签</text>
        </view>
        <view class="card-body">
          <view class="tags">
            <text v-for="tag in scriptDetail.tags" :key="tag" class="tag">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <button class="action-btn btn-secondary" @click="shareScript">分享</button>
        <button class="action-btn btn-secondary" @click="favoriteScript">
          {{ isFavorite ? '取消收藏' : '收藏' }}
        </button>
        <button class="action-btn btn-primary" @click="downloadScript">下载剧本</button>
      </view>

      <!-- 相关帖子 -->
      <view class="posts-section">
        <view class="section-header">
          <text class="section-title">💬 相关讨论</text>
          <view class="more-btn" @click="goToCreatePost">
            <text>发帖</text>
            <uni-icons type="right" size="14" color="#8B4513" />
          </view>
        </view>
        
        <view v-if="relatedPosts.length > 0" class="posts-list">
          <view 
            v-for="post in relatedPosts" 
            :key="post._id"
            class="post-item"
            @click="goToPostDetail(post._id)"
          >
            <view class="post-user">
              <text 
                class="post-username clickable" 
                @click.stop="handleUserClick(post.user_id, post.user)"
              >
                {{ post.user ? post.user.nickname : '匿名用户' }}
              </text>
              <text class="post-time">{{ formatTime(post.created_at) }}</text>
            </view>
            <text class="post-content">{{ post.content }}</text>
            <view class="post-stats">
              <text class="stat-item">👁 {{ post.view_count || 0 }}</text>
              <text class="stat-item">❤️ {{ post.like_count || 0 }}</text>
              <text class="stat-item">💬 {{ post.comment_count || 0 }}</text>
            </view>
          </view>
        </view>
        
        <view v-else class="no-posts">
          <text>暂无相关讨论，快来发表第一个帖子吧~</text>
        </view>
      </view>

      <!-- 评论区 -->
      <view class="comment-section">
        <view class="comment-header card-header">
          <text class="card-title">用户评价</text>
          <button 
            class="comment-btn btn-outline" 
            :class="{ 'btn-disabled': hasReviewed }"
            @click="showCommentModal"
          >
            {{ hasReviewed ? '已评价' : '写评价' }}
          </button>
        </view>

        <!-- 评论列表 -->
        <view v-if="commentList.length > 0" class="comment-list">
          <view v-for="comment in commentList" :key="comment._id" class="comment-item card">
            <view class="card-body">
              <view class="comment-header-info flex-between">
                <view class="user-info">
                  <text 
                    class="user-name clickable" 
                    @click="handleUserClick(comment.user_id, comment.user)"
                  >
                    {{ comment.user ? comment.user.nickname : '匿名用户' }}
                  </text>
                  <view v-if="comment.rating" class="comment-rating">
                    <text class="rating-stars">{{ getStars(comment.rating) }}</text>
                  </view>
                </view>
                <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
              </view>
              <text class="comment-content">{{ comment.content }}</text>
            </view>
          </view>
        </view>

        <view v-else class="no-comment">
          <text class="no-comment-text">暂无评价，来写第一个吧~</text>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-state">
      <text class="error-text">剧本加载失败</text>
      <button class="retry-btn btn-primary" @click="loadScriptDetail">重新加载</button>
    </view>

    <!-- 评论弹窗 -->
    <uni-popup ref="commentPopup" type="bottom">
      <view class="comment-popup">
        <view class="popup-header">
          <text class="popup-title">写评价</text>
          <text class="popup-close" @click="closeCommentModal">×</text>
        </view>
        <view class="popup-body">
          <view class="rating-section">
            <text class="rating-label">评分：</text>
            <uni-rate v-model="commentRating" :size="18" :margin="8" />
          </view>
          <view class="content-section">
            <textarea 
              v-model="commentContent"
              placeholder="分享你的游戏体验..."
              maxlength="500"
              class="comment-textarea">
            </textarea>
          </view>
        </view>
        <view class="popup-footer">
          <button class="submit-btn btn-primary" @click="submitComment" :loading="submitting">提交评价</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'
import UserAction from '@/utils/user-action.js'

export default {
  name: 'ScriptDetail',
  
  data() {
    return {
      scriptId: '',
      scriptDetail: null,
      commentList: [],
      loading: false,
      isFavorite: false,
      
      // 评论相关
      commentRating: 0,
      commentContent: '',
      submitting: false,
      hasReviewed: false,  // 是否已评论
      currentUserId: '',    // 当前用户ID
      
      // 相关帖子
      relatedPosts: []
    }
  },

  onLoad(options) {
    if (options.id) {
      this.scriptId = options.id
      
      // 获取当前用户ID
      const userInfo = Auth.getUserInfo()
      console.log('📱 完整的 userInfo：', userInfo)
      
      if (userInfo) {
        // 尝试多种可能的字段
        this.currentUserId = userInfo.uid || userInfo._id || userInfo.id || userInfo.userId
        console.log('✅ 当前用户ID：', this.currentUserId)
      } else {
        console.log('❌ userInfo 为空')
      }
      
      this.loadScriptDetail()
      this.loadComments()
      this.loadRelatedPosts()
      
      // 记录浏览历史
      console.log('🔍 检查登录状态，Auth.isLogin():', Auth.isLogin())
      console.log('🔍 scriptId:', this.scriptId)
      if (Auth.isLogin()) {
        console.log('✅ 已登录，开始记录浏览历史')
        this.recordHistory()
        this.checkFavoriteStatus()
      } else {
        console.log('❌ 未登录，跳过浏览历史记录')
      }
    }
  },

  methods: {
    // 加载剧本详情
    async loadScriptDetail() {
      this.loading = true
      
      try {
        // 获取用户token（用于验证是否可以查看待审核剧本）
        const token = uni.getStorageSync('uni_id_token') || uni.getStorageSync('userInfo')?._id || ''
        
        const result = await uniCloud.callFunction({
          name: 'script-detail',
          data: { 
            id: this.scriptId,
            token: token  // 传递token，用于权限验证
          }
        })

        if (result.result.code === 0) {
          this.scriptDetail = result.result.data
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.scriptDetail.title
          })
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('加载剧本详情失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 加载评论
    async loadComments() {
      try {
        const db = uniCloud.database()
        
        // 第一步：查询评价列表
        const reviewsResult = await db.collection('botc-script-reviews')
          .where({
            script_id: this.scriptId,
            status: 1
          })
          .orderBy('created_at', 'desc')
          .limit(20)
          .get()
        
        console.log('查询评价结果：', reviewsResult)
        
        // 兼容不同的数据结构
        const reviews = reviewsResult.result?.data || reviewsResult.data || []
        
        console.log('📝 评论列表数量：', reviews.length)
        console.log('📝 评论列表详情：', reviews)
        
        // ⭐ 重要：先检查当前用户是否已评论（必须在任何 return 之前）
        if (this.currentUserId) {
          console.log('🔍 开始检查是否已评论...')
          console.log('🔍 当前用户ID：', this.currentUserId, '类型：', typeof this.currentUserId)
          
          // 打印所有评论的 user_id
          reviews.forEach((review, index) => {
            console.log(`🔍 评论${index + 1} user_id：`, review.user_id, '类型：', typeof review.user_id)
          })
          
          this.hasReviewed = reviews.some(review => {
            const match = review.user_id === this.currentUserId
            if (match) {
              console.log('✅ 找到匹配的评论！')
            }
            return match
          })
          console.log('🎯 最终结果 - 当前用户是否已评论：', this.hasReviewed)
        } else {
          console.log('❌ currentUserId 为空，跳过检查')
        }
        
        if (reviews.length === 0) {
          this.commentList = []
          return
        }
        
        // 第二步：获取所有用户ID
        const userIds = [...new Set(reviews.map(r => r.user_id).filter(id => id))]
        
        if (userIds.length === 0) {
          // 没有用户ID，直接使用匿名用户
          this.commentList = reviews.map(review => ({
            _id: review._id,
            content: review.content,
            rating: review.rating,
            like_count: review.like_count,
            created_at: review.created_at,
            user: {
              nickname: '匿名用户',
              avatar: ''
            }
          }))
          return
        }
        
        // 第三步：查询用户信息
        const usersResult = await db.collection('uni-id-users')
          .where({
            _id: db.command.in(userIds)
          })
          .field('_id,nickname,avatar')
          .get()
        
        console.log('查询用户结果：', usersResult)
        
        // 兼容不同的数据结构
        const users = usersResult.result?.data || usersResult.data || []
        
        const usersMap = {}
        users.forEach(user => {
          usersMap[user._id] = user
        })
        
        // 第四步：合并数据
        this.commentList = reviews.map(review => ({
          _id: review._id,
          content: review.content,
          rating: review.rating,
          like_count: review.like_count,
          created_at: review.created_at,
          user: usersMap[review.user_id] || {
            nickname: '匿名用户',
            avatar: ''
          }
        }))
      } catch (error) {
        console.error('加载评论失败：', error)
        this.commentList = []
      }
    },
    
    // 加载相关帖子
    async loadRelatedPosts() {
      try {
        const db = uniCloud.database()
        
        // 第一步：查询帖子列表
        const postsResult = await db.collection('botc-posts')
          .where({
            script_id: this.scriptId,
            status: 1
          })
          .orderBy('created_at', 'desc')
          .limit(5)
          .get()
        
        const posts = postsResult.result?.data || postsResult.data || []
        
        if (posts.length === 0) {
          this.relatedPosts = []
          return
        }
        
        // 第二步：获取所有用户ID
        const userIds = [...new Set(posts.map(p => p.user_id).filter(id => id))]
        
        if (userIds.length === 0) {
          this.relatedPosts = posts
          return
        }
        
        // 第三步：查询用户信息
        const usersResult = await db.collection('uni-id-users')
          .where({
            _id: db.command.in(userIds)
          })
          .field('_id,nickname,avatar')
          .get()
        
        const users = usersResult.result?.data || usersResult.data || []
        
        const usersMap = {}
        users.forEach(user => {
          usersMap[user._id] = user
        })
        
        // 第四步：合并数据
        this.relatedPosts = posts.map(post => ({
          ...post,
          user: usersMap[post.user_id] || {
            nickname: '匿名用户',
            avatar: ''
          }
        }))
      } catch (error) {
        console.error('加载相关帖子失败：', error)
        this.relatedPosts = []
      }
    },
    
    // 发帖
    goToCreatePost() {
      uni.navigateTo({
        url: '/pages/community/create/create'
      })
    },
    
    // 查看帖子详情
    goToPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/community/detail/detail?id=${postId}`
      })
    },

    // 下载剧本
    async downloadScript() {
      try {
        uni.showLoading({ title: '准备下载...' })
        
        const result = await uniCloud.callFunction({
          name: 'script-download',
          data: { id: this.scriptId }
        })

        if (result.result.code === 0) {
          const { json_url, json_data } = result.result.data
          
          if (json_url) {
            // 如果有文件URL，直接下载文件
            uni.downloadFile({
              url: json_url,
              success: (res) => {
                uni.showToast({
                  title: '下载成功',
                  icon: 'success'
                })
              }
            })
          } else if (json_data) {
            // 如果有JSON数据，保存到本地
            const jsonString = JSON.stringify(json_data, null, 2)
            uni.setClipboardData({
              data: jsonString,
              success: () => {
                uni.showToast({
                  title: '剧本数据已复制到剪贴板',
                  icon: 'success'
                })
              }
            })
          }
        }
      } catch (error) {
        console.error('下载失败：', error)
        uni.showToast({
          title: '下载失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    // 分享剧本
    shareScript() {
      // 小程序分享功能会自动调用onShareAppMessage
    },

    // 记录浏览历史
    async recordHistory() {
      console.log('📝 开始记录浏览历史...')
      console.log('📝 target_type: script')
      console.log('📝 target_id:', this.scriptId)
      console.log('📝 token:', Auth.getToken())
      
      try {
        const result = await uniCloud.callFunction({
          name: 'history-add',
          data: {
            target_type: 'script',
            target_id: this.scriptId,
            token: Auth.getToken()
          }
        })
        console.log('✅ 浏览历史记录成功，返回结果：', result)
      } catch (error) {
        console.error('❌ 记录浏览历史失败：', error)
      }
    },

    // 检查收藏状态
    async checkFavoriteStatus() {
      try {
        const db = uniCloud.database()
        const result = await db.collection('botc-favorites')
          .where({
            user_id: this.currentUserId,
            target_type: 'script',
            target_id: this.scriptId
          })
          .get()
        
        this.isFavorite = result.data && result.data.length > 0
        console.log('✅ 收藏状态：', this.isFavorite)
      } catch (error) {
        console.error('检查收藏状态失败：', error)
      }
    },

    // 收藏剧本
    async favoriteScript() {
      // 检查登录
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }

      try {
        const functionName = this.isFavorite ? 'favorite-remove' : 'favorite-add'
        
        const result = await uniCloud.callFunction({
          name: functionName,
          data: { 
            target_type: 'script',
            target_id: this.scriptId,
            token: Auth.getToken()
          }
        })

        if (result.result.code === 0) {
          this.isFavorite = !this.isFavorite
          uni.showToast({
            title: this.isFavorite ? '收藏成功' : '取消收藏',
            icon: 'success'
          })
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('收藏操作失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      }
    },

    // 显示评论弹窗
    showCommentModal() {
      // 检查是否已登录
      if (!Auth.isLogin()) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          Auth.toLogin()
        }, 1500)
        return
      }
      
      // 检查是否已评论
      if (this.hasReviewed) {
        uni.showModal({
          title: '提示',
          content: '您已经评价过该剧本了，每个剧本只能评价一次哦~',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }
      
      this.$refs.commentPopup.open()
    },

    // 关闭评论弹窗
    closeCommentModal() {
      this.$refs.commentPopup.close()
    },

    // 提交评价
    async submitComment() {
      if (this.commentRating === 0) {
        uni.showToast({
          title: '请选择评分',
          icon: 'none'
        })
        return
      }

      if (!this.commentContent.trim()) {
        uni.showToast({
          title: '请输入评价内容',
          icon: 'none'
        })
        return
      }

      this.submitting = true

      try {
        const result = await uniCloud.callFunction({
          name: 'script-review-create',
          data: {
            scriptId: this.scriptId,
            content: this.commentContent.trim(),
            rating: this.commentRating,
            token: Auth.getToken()
          }
        })

        if (result.result.code === 0) {
          uni.showToast({
            title: '评价成功',
            icon: 'success'
          })
          
          // 标记已评论
          this.hasReviewed = true
          
          // 清空表单
          this.commentRating = 0
          this.commentContent = ''
          this.closeCommentModal()
          
          // 重新加载评论
          this.loadComments()
          
          // 重新加载剧本详情（更新评分）
          this.loadScriptDetail()
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('提交评价失败：', error)
        uni.showToast({
          title: '提交失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },

    // 工具方法
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}/${date.getDate()}`
    },

    getDifficultyClass(difficulty) {
      const classMap = {
        1: 'difficulty-easy',
        2: 'difficulty-normal',
        3: 'difficulty-hard',
        4: 'difficulty-expert'
      }
      return classMap[difficulty] || 'difficulty-unknown'
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

    getStars(rating) {
      return '⭐'.repeat(rating)
    },
    
    // 处理用户点击事件
    handleUserClick(userId, userInfo = {}) {
      console.log('handleUserClick triggered:', userId, userInfo)
      if (!userId) {
        console.warn('userId is empty in handleUserClick')
        return
      }
      UserAction.showUserMenu(userId, userInfo)
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.scriptDetail ? `血染钟楼剧本：${this.scriptDetail.title}` : '血染钟楼剧本分享',
      path: `/pages/script/detail/detail?id=${this.scriptId}`
    }
  }
}
</script>

<style scoped>
/* 页面背景 */
.page {
  background: linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%);
  min-height: 100vh;
}

/* 头部区域 - 立体渐变卡片 */
.script-header {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #D2691E 100%);
  color: white;
  padding: 50rpx 30rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(139, 69, 19, 0.3);
}

.script-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: shine 3s infinite;
}

@keyframes shine {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10%, 10%); }
}

.script-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.script-subtitle {
  display: block;
  font-size: 28rpx;
  opacity: 0.95;
  margin-bottom: 25rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.script-rating {
  margin-top: 25rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10rpx);
  padding: 20rpx 30rpx;
  border-radius: 50rpx;
  display: inline-block;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
}

.rating-score {
  font-size: 36rpx;
  font-weight: bold;
  margin-right: 15rpx;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
}

.rating-count {
  font-size: 26rpx;
  opacity: 0.9;
}

/* 信息卡片 - 立体效果 */
.info-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transform: translateZ(0);
  transition: all 0.3s ease;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 25rpx;
  padding: 15rpx;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 12rpx;
  border-left: 4rpx solid #8B4513;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 28rpx;
  color: #666666;
  font-weight: 600;
  width: 120rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
  font-weight: 500;
}

/* 难度标签 - 3D效果 */
.difficulty {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  color: white !important;
  font-weight: bold;
  font-size: 24rpx !important;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2),
              inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.2);
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.difficulty-easy { 
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}
.difficulty-normal { 
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}
.difficulty-hard { 
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
}
.difficulty-expert { 
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
}
.difficulty-unknown { 
  background: linear-gradient(135deg, #d9d9d9 0%, #e8e8e8 100%);
  color: #666666 !important; 
}

/* 描述卡片 */
.desc-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.script-desc {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.8;
  white-space: pre-line;
}

/* 标签卡片 */
.tags-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.tag {
  font-size: 24rpx;
  color: #8B4513;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(139, 69, 19, 0.15) 100%);
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  border: 2rpx solid rgba(139, 69, 19, 0.2);
  box-shadow: 0 2rpx 8rpx rgba(139, 69, 19, 0.1);
  transition: all 0.3s ease;
}

/* 操作栏 - 正常排列 */
.action-bar {
  display: flex;
  padding: 25rpx 20rpx;
  gap: 20rpx;
  background: white;
  margin: 30rpx 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.action-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 20rpx rgba(139, 69, 19, 0.3);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
}

.action-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.2);
}

/* 相关帖子区 */
.posts-section {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 5rpx;
  font-size: 26rpx;
  color: #8B4513;
  padding: 8rpx 16rpx;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 20rpx;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.post-item {
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border-left: 4rpx solid #8B4513;
  transition: all 0.3s ease;
}

.post-item:active {
  transform: translateX(4rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.post-user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.post-username {
  font-size: 26rpx;
  color: #8B4513;
  font-weight: 600;
}

.post-time {
  font-size: 22rpx;
  color: #999;
}

.post-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 15rpx;
}

.post-stats {
  display: flex;
  gap: 30rpx;
}

.stat-item {
  font-size: 24rpx;
  color: #666;
}

.no-posts {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

/* 评论区 - 立体卡片 */
.comment-section {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
}

.comment-header .card-title {
  flex: 1;
}

.comment-header .comment-btn {
  margin-left: auto;
  flex-shrink: 0;
}

/* 评价按钮 - 立体按钮 */
.comment-btn {
  font-size: 26rpx;
  padding: 12rpx 24rpx;
  height: auto;
  line-height: auto;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.3);
  transition: all 0.3s ease;
}

.comment-btn:active {
  transform: scale(0.95);
}

/* 已评价状态 */
.comment-btn.btn-disabled {
  background: #f5f5f5;
  color: #999999;
  border-color: #e8e8e8;
  box-shadow: none;
  cursor: not-allowed;
}

.comment-btn.btn-disabled:active {
  transform: none;
}

.comment-list {
  margin-top: 25rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 评论卡片 - 3D效果 */
.comment-item {
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border-left: 4rpx solid #8B4513;
  transition: all 0.3s ease;
}

.comment-item:hover {
  transform: translateX(4rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.comment-header-info {
  margin-bottom: 15rpx;
}

.user-name {
  font-size: 28rpx;
  color: #8B4513;
  font-weight: 600;
}

.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.clickable:active {
  opacity: 0.6;
}

.comment-rating {
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%);
  border-radius: 12rpx;
  display: inline-block;
}

.rating-stars {
  font-size: 22rpx;
}

.comment-time {
  font-size: 24rpx;
  color: #999999;
}

.comment-content {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  padding: 12rpx 0;
}

.no-comment {
  text-align: center;
  padding: 80rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.no-comment-text {
  display: block;
  margin-bottom: 10rpx;
}

/* 弹窗样式 - 毛玻璃效果 */
.comment-popup {
  background: white;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 80vh;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 35rpx 30rpx;
  border-bottom: none;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  border-radius: 32rpx 32rpx 0 0;
}

.popup-title {
  font-size: 34rpx;
  font-weight: bold;
}

.popup-close {
  font-size: 44rpx;
  color: white;
  opacity: 0.9;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.popup-body {
  padding: 35rpx 30rpx;
}

/* 评分区域 - 立体卡片 */
.rating-section {
  display: flex;
  align-items: center;
  margin-bottom: 35rpx;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  padding: 25rpx;
  border-radius: 16rpx;
  border: 2rpx solid rgba(139, 69, 19, 0.1);
}

.rating-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-right: 25rpx;
}

/* 输入框 - 3D效果 */
.comment-textarea {
  width: 100%;
  min-height: 240rpx;
  padding: 25rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
  background: white;
  box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.comment-textarea:focus {
  border-color: #8B4513;
  box-shadow: 0 0 0 4rpx rgba(139, 69, 19, 0.1),
              inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 弹窗底部 */
.popup-footer {
  padding: 25rpx 30rpx 35rpx;
  border-top: none;
  background: linear-gradient(180deg, transparent 0%, #fafafa 100%);
}

/* 提交按钮 - 3D渐变按钮 */
.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  box-shadow: 0 6rpx 20rpx rgba(139, 69, 19, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.2);
}

/* 加载和错误状态 */
.loading-container, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
  gap: 20rpx;
}

.error-text {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 40rpx;
}

.retry-btn {
  width: 200rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
}
</style>
