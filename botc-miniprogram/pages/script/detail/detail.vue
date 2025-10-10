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

      <!-- 评论区 -->
      <view class="comment-section">
        <view class="comment-header card-header">
          <text class="card-title">用户评价</text>
          <button class="comment-btn btn-outline" @click="showCommentModal">写评价</button>
        </view>

        <!-- 评论列表 -->
        <view v-if="commentList.length > 0" class="comment-list">
          <view v-for="comment in commentList" :key="comment._id" class="comment-item card">
            <view class="card-body">
              <view class="comment-header-info flex-between">
                <view class="user-info">
                  <text class="user-name">{{ comment.user ? comment.user.nickname : '匿名用户' }}</text>
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
      submitting: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.scriptId = options.id
      this.loadScriptDetail()
      this.loadComments()
    }
  },

  methods: {
    // 加载剧本详情
    async loadScriptDetail() {
      this.loading = true
      
      try {
        const result = await uniCloud.callFunction({
          name: 'script-detail',
          data: { id: this.scriptId }
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
        const result = await uniCloud.callFunction({
          name: 'comment-list',
          data: { 
            scriptId: this.scriptId,
            page: 1,
            pageSize: 10
          }
        })

        if (result.result.code === 0) {
          this.commentList = result.result.data.list
        }
      } catch (error) {
        console.error('加载评论失败：', error)
      }
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

    // 收藏剧本
    async favoriteScript() {
      try {
        const action = this.isFavorite ? 'remove' : 'add'
        
        const result = await uniCloud.callFunction({
          name: 'script-favorite',
          data: { 
            id: this.scriptId,
            action
          }
        })

        if (result.result.code === 0) {
          this.isFavorite = !this.isFavorite
          uni.showToast({
            title: this.isFavorite ? '收藏成功' : '取消收藏',
            icon: 'success'
          })
        }
      } catch (error) {
        console.error('收藏操作失败：', error)
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    },

    // 显示评论弹窗
    showCommentModal() {
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
          name: 'comment-add',
          data: {
            scriptId: this.scriptId,
            content: this.commentContent.trim(),
            rating: this.commentRating
          }
        })

        if (result.result.code === 0) {
          uni.showToast({
            title: '评价成功',
            icon: 'success'
          })
          
          // 清空表单
          this.commentRating = 0
          this.commentContent = ''
          this.closeCommentModal()
          
          // 重新加载评论
          this.loadComments()
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
.script-header {
  background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
  color: white;
  padding: 40rpx 30rpx;
  text-align: center;
}

.script-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.script-subtitle {
  display: block;
  font-size: 26rpx;
  opacity: 0.9;
  margin-bottom: 20rpx;
}

.script-rating {
  margin-top: 20rpx;
}

.rating-score {
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 10rpx;
}

.rating-count {
  font-size: 24rpx;
  opacity: 0.8;
}

.info-card {
  margin: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-row:last-child {
  margin-bottom: 0;
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
}

.difficulty {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  color: white !important;
  font-weight: bold;
  font-size: 24rpx !important;
}

.difficulty-easy { background-color: #52c41a; }
.difficulty-normal { background-color: #1890ff; }
.difficulty-hard { background-color: #faad14; }
.difficulty-expert { background-color: #f5222d; }
.difficulty-unknown { background-color: #d9d9d9; color: #666666 !important; }

.desc-card {
  margin: 20rpx;
}

.script-desc {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  white-space: pre-line;
}

.tags-card {
  margin: 20rpx;
}

.tags {
  display: flex;
  flex-wrap: wrap;
}

.tag {
  font-size: 24rpx;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  margin-right: 12rpx;
  margin-bottom: 12rpx;
}

.action-bar {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
  background: white;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
}

.comment-section {
  margin: 20rpx;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-btn {
  font-size: 26rpx;
  padding: 8rpx 16rpx;
  height: auto;
  line-height: auto;
}

.comment-list {
  margin-top: 20rpx;
}

.comment-item {
  margin-bottom: 16rpx;
}

.comment-header-info {
  margin-bottom: 12rpx;
}

.user-name {
  font-size: 26rpx;
  color: #8B4513;
  font-weight: 500;
}

.comment-rating {
  margin-top: 4rpx;
}

.rating-stars {
  font-size: 20rpx;
}

.comment-time {
  font-size: 22rpx;
  color: #999999;
}

.comment-content {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.5;
}

.no-comment {
  text-align: center;
  padding: 60rpx 0;
  color: #999999;
}

/* 弹窗样式 */
.comment-popup {
  background: white;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
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

.rating-section {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.rating-label {
  font-size: 28rpx;
  margin-right: 20rpx;
}

.comment-textarea {
  width: 100%;
  min-height: 200rpx;
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

.loading-container, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
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
