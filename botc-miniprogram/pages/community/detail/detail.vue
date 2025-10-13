<template>
  <view class="detail-page">
    <scroll-view class="content-scroll" scroll-y>
      <!-- 帖子内容 -->
      <view v-if="post" class="post-detail">
        <!-- 用户信息 -->
        <view class="post-header">
          <image 
            class="avatar clickable" 
            :src="post.user?.avatar || '/static/default-avatar.png'"
            mode="aspectFill"
            @click="handleUserClick(post.user_id, post.user)"
          />
          <view class="user-info" @click="handleUserClick(post.user_id, post.user)">
            <view class="nickname clickable">{{ post.user?.nickname || '匿名用户' }}</view>
            <view class="time">{{ formatTime(post.created_at) }}</view>
          </view>
        </view>

        <!-- 帖子内容 -->
        <view class="post-content">
          <text class="content-text">{{ post.content }}</text>
        </view>

        <!-- 图片 -->
        <view v-if="post.images && post.images.length > 0" class="post-images">
          <view class="image-grid" :class="`grid-${Math.min(post.images.length, 3)}`">
            <image
              v-for="(img, index) in post.images"
              :key="index"
              class="post-image"
              :src="img"
              mode="aspectFill"
              @click="previewImage(post.images, index)"
            />
          </view>
        </view>

        <!-- 标签 -->
        <view v-if="post.tags && post.tags.length > 0" class="tags">
          <text v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</text>
        </view>

        <!-- 统计信息 -->
        <view class="stats">
          <text class="stat-item">{{ post.view_count || 0 }} 浏览</text>
          <text class="stat-item">{{ post.like_count || 0 }} 点赞</text>
          <text class="stat-item">{{ post.comment_count || 0 }} 评论</text>
        </view>
      </view>

      <!-- 评论列表 -->
      <view class="comments-section">
        <view class="section-title">全部评论 ({{ post?.comment_count || 0 }})</view>
        
        <view v-if="post && post.comments && post.comments.length > 0" class="comments-list">
          <view v-for="comment in post.comments" :key="comment._id" class="comment-item">
            <image 
              class="comment-avatar clickable" 
              :src="comment.user?.avatar || '/static/default-avatar.png'"
              mode="aspectFill"
              @click="handleUserClick(comment.user_id, comment.user)"
            />
            <view class="comment-content">
              <view class="comment-user">
                <text 
                  class="comment-nickname clickable" 
                  @click="handleUserClick(comment.user_id, comment.user)"
                >
                  {{ comment.user?.nickname || '匿名用户' }}
                </text>
                <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
              </view>
              <view class="comment-text">
                <text v-if="comment.reply_to_user" class="reply-to">
                  回复 @{{ comment.reply_to_user.nickname }}:
                </text>
                {{ comment.content }}
              </view>
            </view>
          </view>
        </view>
        
        <view v-else class="empty-comments">
          <text>暂无评论，快来抢沙发~</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="footer-bar">
      <view class="input-wrapper" @click="focusCommentInput">
        <input 
          class="comment-input" 
          placeholder="说点什么..."
          disabled
        />
      </view>
      
      <view class="action-btns">
        <view class="action-btn" @click="handleLike">
          <uni-icons 
            :type="post?.isLiked ? 'heart-filled' : 'heart'" 
            :size="24" 
            :color="post?.isLiked ? '#ff6b6b' : '#666'"
          />
          <text :class="{ liked: post?.isLiked }">{{ post?.like_count || 0 }}</text>
        </view>
      </view>
    </view>

    <!-- 评论输入弹窗 -->
    <view v-if="showCommentInput" class="comment-modal" @click="closeCommentInput">
      <view class="comment-modal-content" @click.stop>
        <textarea 
          v-model="commentContent"
          class="comment-textarea"
          placeholder="发表你的评论..."
          :focus="showCommentInput"
          :maxlength="500"
          auto-height
        />
        <view class="comment-footer">
          <text class="char-count">{{ commentContent.length }}/500</text>
          <button 
            class="send-btn"
            :disabled="!commentContent.trim() || commenting"
            @click="sendComment"
          >
            {{ commenting ? '发送中...' : '发送' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'
import UserAction from '@/utils/user-action.js'

export default {
  name: 'PostDetail',
  
  data() {
    return {
      postId: '',
      post: null,
      showCommentInput: false,
      commentContent: '',
      commenting: false
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.postId = options.id
      this.loadPostDetail()
    }
  },
  
  methods: {
    // 加载帖子详情
    async loadPostDetail() {
      uni.showLoading({ title: '加载中...' })
      
      try {
        const token = Auth.isLogin() ? Auth.getToken() : null
        
        const result = await uniCloud.callFunction({
          name: 'post-detail',
          data: {
            postId: this.postId,
            token: token
          }
        })
        
        if (result.result.code === 0) {
          this.post = result.result.data
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('加载帖子失败：', error)
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } finally {
        uni.hideLoading()
      }
    },
    
    // 点赞/取消点赞
    async handleLike() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      
      try {
        const token = Auth.getToken()
        
        const result = await uniCloud.callFunction({
          name: 'post-like',
          data: {
            postId: this.postId,
            token: token
          }
        })
        
        if (result.result.code === 0) {
          this.post.isLiked = result.result.data.isLiked
          this.post.like_count = result.result.data.likeCount
        }
        
      } catch (error) {
        console.error('点赞失败：', error)
      }
    },
    
    // 显示评论输入框
    focusCommentInput() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      
      this.showCommentInput = true
    },
    
    // 关闭评论输入框
    closeCommentInput() {
      this.showCommentInput = false
      this.commentContent = ''
    },
    
    // 发送评论
    async sendComment() {
      if (!this.commentContent.trim()) {
        return
      }
      
      this.commenting = true
      
      try {
        const token = Auth.getToken()
        
        const result = await uniCloud.callFunction({
          name: 'comment-create',
          data: {
            postId: this.postId,
            content: this.commentContent.trim(),
            token: token
          }
        })
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '评论成功',
            icon: 'success'
          })
          
          // 添加新评论到列表
          this.post.comments.push(result.result.data.comment)
          this.post.comment_count = (this.post.comment_count || 0) + 1
          
          this.closeCommentInput()
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('评论失败：', error)
        uni.showToast({
          title: error.message || '评论失败',
          icon: 'none'
        })
      } finally {
        this.commenting = false
      }
    },
    
    // 预览图片
    previewImage(images, current) {
      uni.previewImage({
        urls: images,
        current: current
      })
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const now = Date.now()
      const time = new Date(timestamp).getTime()
      const diff = now - time
      
      if (diff < 60000) {
        return '刚刚'
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前'
      } else if (diff < 604800000) {
        return Math.floor(diff / 86400000) + '天前'
      } else {
        const date = new Date(timestamp)
        return `${date.getMonth() + 1}-${date.getDate()}`
      }
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
  }
}
</script>

<style scoped>
.detail-page {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 120rpx;
}

.post-detail {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 5rpx;
}

.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.clickable:active {
  opacity: 0.6;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.post-content {
  margin-bottom: 20rpx;
}

.content-text {
  font-size: 30rpx;
  line-height: 1.8;
  color: #333;
  word-break: break-all;
}

.post-images {
  margin-bottom: 20rpx;
}

.image-grid {
  display: grid;
  gap: 10rpx;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.post-image {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
}

.grid-1 .post-image {
  height: 400rpx;
}

.tags {
  margin-bottom: 20rpx;
}

.tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #f0f0f0;
  color: #8B4513;
  font-size: 24rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
}

.stats {
  padding-top: 20rpx;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 30rpx;
}

.stat-item {
  font-size: 24rpx;
  color: #999;
}

.comments-section {
  background: #fff;
  padding: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.comments-list {
  /* 评论列表 */
}

.comment-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 15rpx;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-user {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.comment-nickname {
  font-size: 26rpx;
  color: #666;
  margin-right: 15rpx;
}

.comment-time {
  font-size: 22rpx;
  color: #999;
}

.comment-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
}

.reply-to {
  color: #8B4513;
}

.empty-comments {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 26rpx;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 15rpx 30rpx;
  display: flex;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  flex: 1;
  margin-right: 20rpx;
}

.comment-input {
  width: 100%;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
}

.action-btns {
  display: flex;
  gap: 30rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #666;
}

.action-btn text.liked {
  color: #ff6b6b;
}

.comment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.comment-modal-content {
  width: 100%;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.comment-textarea {
  width: 100%;
  min-height: 150rpx;
  font-size: 28rpx;
  line-height: 1.6;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
}

.comment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.send-btn {
  width: 120rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
  color: #fff;
  font-size: 26rpx;
  border-radius: 30rpx;
  border: none;
  line-height: 60rpx;
  padding: 0;
}

.send-btn[disabled] {
  opacity: 0.5;
}
</style>

