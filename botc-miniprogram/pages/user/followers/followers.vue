<template>
  <view class="page">
    <!-- 粉丝列表 -->
    <view v-if="followersList.length > 0" class="user-list">
      <view 
        v-for="item in followersList" 
        :key="item.user_id" 
        class="user-item">
        <view class="user-info" @click="goToUserProfile(item.user_id)">
          <image class="avatar" :src="item.avatar || '/static/logo.png'" mode="aspectFill"></image>
          <view class="info-content">
            <view class="nickname-row">
              <text class="nickname">{{ item.nickname }}</text>
              <text v-if="item.is_mutual" class="mutual-tag">互相关注</text>
            </view>
            <view class="meta">
              <text class="level">Lv.{{ item.level }}</text>
              <text class="time">关注于 {{ formatTime(item.followed_at) }}</text>
            </view>
          </view>
        </view>
        <view class="action">
          <button 
            v-if="item.is_mutual"
            class="mutual-btn" 
            @click="handleUnfollow(item.user_id)">
            互相关注
          </button>
          <button 
            v-else
            class="follow-btn" 
            @click="handleFollow(item.user_id)">
            回关
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <image class="empty-icon" src="/static/empty.png" mode="aspectFit"></image>
      <text class="empty-text">暂无粉丝</text>
      <text class="empty-hint">快去发布优质内容吸引粉丝吧</text>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore && followersList.length > 0" class="load-more">
      <text v-if="!loading">上拉加载更多</text>
      <text v-else>加载中...</text>
    </view>

    <!-- 没有更多 -->
    <view v-if="!hasMore && followersList.length > 0" class="no-more">
      <text>没有更多了</text>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  data() {
    return {
      followersList: [],
      page: 1,
      pageSize: 20,
      total: 0,
      loading: false,
      hasMore: true
    }
  },

  onLoad() {
    this.loadFollowersList()
  },

  onPullDownRefresh() {
    this.page = 1
    this.hasMore = true
    this.followersList = []
    this.loadFollowersList()
  },

  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.page++
      this.loadFollowersList()
    }
  },

  methods: {
    // 加载粉丝列表
    async loadFollowersList() {
      if (this.loading) return

      this.loading = true
      
      try {
        const result = await uniCloud.callFunction({
          name: 'user-followers-list',
          data: {
            token: Auth.getToken(),
            page: this.page,
            page_size: this.pageSize
          }
        })

        if (result.result.code === 0) {
          const { list, total } = result.result.data
          
          if (this.page === 1) {
            this.followersList = list
          } else {
            this.followersList = [...this.followersList, ...list]
          }
          
          this.total = total
          this.hasMore = this.followersList.length < total
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('加载粉丝列表失败：', error)
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },

    // 关注
    async handleFollow(userId) {
      try {
        const result = await uniCloud.callFunction({
          name: 'user-follow',
          data: {
            token: Auth.getToken(),
            target_user_id: userId,
            action: 'follow'
          }
        })

        if (result.result.code === 0) {
          uni.showToast({
            title: '关注成功',
            icon: 'success'
          })
          
          // 更新列表中的互关状态
          const item = this.followersList.find(f => f.user_id === userId)
          if (item) {
            item.is_mutual = true
          }
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('关注失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      }
    },

    // 取消关注
    async handleUnfollow(userId) {
      uni.showModal({
        title: '提示',
        content: '确定要取消关注吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await uniCloud.callFunction({
                name: 'user-follow',
                data: {
                  token: Auth.getToken(),
                  target_user_id: userId,
                  action: 'unfollow'
                }
              })

              if (result.result.code === 0) {
                uni.showToast({
                  title: '已取消关注',
                  icon: 'success'
                })
                
                // 更新列表中的互关状态
                const item = this.followersList.find(f => f.user_id === userId)
                if (item) {
                  item.is_mutual = false
                }
              } else {
                throw new Error(result.result.message)
              }
            } catch (error) {
              console.error('取消关注失败：', error)
              uni.showToast({
                title: error.message || '操作失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },

    // 跳转到用户主页
    goToUserProfile(userId) {
      uni.navigateTo({
        url: `/pages/user/other-profile/other-profile?userId=${userId}`
      })
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = Date.now()
      const diff = now - date.getTime()
      
      const minute = 60 * 1000
      const hour = 60 * minute
      const day = 24 * hour
      const month = 30 * day
      
      if (diff < minute) {
        return '刚刚'
      } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前'
      } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前'
      } else if (diff < month) {
        return Math.floor(diff / day) + '天前'
      } else {
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0')
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20rpx;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  border: 3rpx solid #f0f0f0;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.nickname-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.nickname {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mutual-tag {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  white-space: nowrap;
}

.meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.level {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.time {
  color: #999;
}

.action {
  margin-left: 20rpx;
}

.mutual-btn,
.follow-btn {
  border: none;
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.mutual-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.follow-btn {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.mutual-btn:active,
.follow-btn:active {
  opacity: 0.8;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  width: 320rpx;
  height: 320rpx;
  margin-bottom: 40rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.empty-hint {
  font-size: 28rpx;
  color: #999;
}

/* 加载状态 */
.load-more,
.no-more {
  text-align: center;
  padding: 40rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>

