<template>
  <view class="page">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <scroll-view scroll-x="true" class="filter-scroll" :show-scrollbar="false">
        <view class="filter-items">
          <text 
            v-for="category in categories" 
            :key="category.type"
            :class="['filter-item', filterStatus === category.type ? 'active' : '']"
            @click="filterStatus = category.type"
          >
            {{ category.icon }} {{ category.name }}
            <text v-if="category.count > 0" class="count-badge">{{ category.count }}</text>
          </text>
        </view>
      </scroll-view>
    </view>

    <!-- 快捷上传按钮 -->
    <view class="quick-upload">
      <button class="upload-btn" @click="goToUpload">
        <text class="upload-icon">📄</text>
        <text class="upload-text">上传新剧本</text>
      </button>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && filteredList.length === 0" class="empty-state">
      <view class="empty-icon">📚</view>
      <text class="empty-text">{{ emptyText }}</text>
      <button class="empty-btn" @click="goToUpload">立即上传</button>
    </view>

    <!-- 上传列表 -->
    <view v-else class="upload-list">
      <view 
        v-for="script in filteredList" 
        :key="script._id"
        class="upload-card card"
        @click="goToScriptDetail(script)"
      >
        <!-- 预览图 -->
        <view class="preview-section">
          <image 
            v-if="script.preview_image"
            class="preview-image" 
            :src="script.preview_image" 
            mode="aspectFit"
          />
          <view v-else class="preview-placeholder">
            <text class="placeholder-icon">📖</text>
            <text class="placeholder-text">预览图生成中...</text>
          </view>
        </view>

        <!-- 剧本信息 -->
        <view class="script-info">
          <view class="info-header">
            <text class="script-title">{{ script.title }}</text>
            <view class="status-badge" :class="getStatusClass(script.status)">
              {{ getStatusText(script.status) }}
            </view>
          </view>
          
          <text class="script-author">作者：{{ script.author }}</text>
          
          <view class="script-meta">
            <text class="meta-item">📊 {{ script.total_characters }}个角色</text>
            <text class="meta-item">👥 {{ script.player_count }}</text>
            <text class="meta-item">👁️ {{ script.view_count || 0 }}浏览</text>
          </view>

          <view class="script-footer">
            <text class="upload-time">{{ formatTime(script.created_at) }}</text>
            <view class="action-buttons">
              <text v-if="script.status === 0" class="action-btn edit" @click.stop="editScript(script)">编辑</text>
              <text class="action-btn delete" @click.stop="deleteScript(script)">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-load-more status="loading" />
    </view>

    <!-- 加载更多 -->
    <view v-if="!loading && hasMore && uploadList.length > 0" class="load-more">
      <button class="load-more-btn" @click="loadMore">加载更多</button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'MyUploads',
  
  data() {
    return {
      uploadList: [],
      loading: false,
      page: 1,
      pageSize: 10,
      hasMore: true,
      filterStatus: 'all' // all, 0(待审核), 1(已发布), 2(已拒绝)
    }
  },
  
  computed: {
    // 分类标签
    categories() {
      const totalCount = this.uploadList.length
      const pendingCount = this.uploadList.filter(item => item.status === 0).length
      const publishedCount = this.uploadList.filter(item => item.status === 1).length
      const rejectedCount = this.uploadList.filter(item => item.status === 2).length
      
      return [
        { type: 'all', name: '全部', icon: '📚', count: totalCount },
        { type: 0, name: '待审核', icon: '🟡', count: pendingCount },
        { type: 1, name: '已发布', icon: '🟢', count: publishedCount },
        { type: 2, name: '已拒绝', icon: '🔴', count: rejectedCount }
      ]
    },
    
    // 过滤后的列表
    filteredList() {
      if (this.filterStatus === 'all') {
        return this.uploadList
      }
      return this.uploadList.filter(item => item.status === this.filterStatus)
    },
    
    // 空状态提示文本
    emptyText() {
      const texts = {
        'all': '暂无上传记录',
        0: '暂无待审核的剧本',
        1: '暂无已发布的剧本',
        2: '暂无被拒绝的剧本'
      }
      return texts[this.filterStatus] || '暂无数据'
    }
  },
  
  onLoad() {
    // 初始化 script 云对象
    this.scriptObj = uniCloud.importObject('script', {
      customUI: true
    })
    this.loadMyUploads()
  },
  
  onPullDownRefresh() {
    this.page = 1
    this.hasMore = true
    this.loadMyUploads().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    // 加载我的上传
    async loadMyUploads() {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const res = await this.scriptObj.getMyUploads(this.page, this.pageSize)
        
        if (res.code === 0) {
          const data = res.data
          
          if (this.page === 1) {
            this.uploadList = data.list
          } else {
            this.uploadList = [...this.uploadList, ...data.list]
          }
          
          this.hasMore = data.hasMore
        } else {
          throw new Error(res.result.message)
        }
      } catch (error) {
        console.error('加载失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.page++
        this.loadMyUploads()
      }
    },
    
    // 跳转到上传页面
    goToUpload() {
      uni.navigateTo({
        url: '/pages/tools/upload-json/upload-json'
      })
    },
    
    // 跳转到剧本详情
    goToScriptDetail(script) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${script._id}`
      })
    },
    
    // 编辑剧本
    editScript(script) {
      uni.showModal({
        title: '编辑剧本',
        content: '功能开发中',
        showCancel: false
      })
    },
    
    // 删除剧本
    deleteScript(script) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${script.title}"吗？`,
        confirmColor: '#ef4444',
        success: async (res) => {
          if (res.confirm) {
            await this.performDelete(script)
          }
        }
      })
    },
    
    // 执行删除
    async performDelete(script) {
      try {
        const res = await this.scriptObj.delete(script._id)
        
        if (res.code === 0) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          // 从列表中移除
          this.uploadList = this.uploadList.filter(item => item._id !== script._id)
        } else {
          throw new Error(res.result.message)
        }
      } catch (error) {
        console.error('删除失败:', error)
        uni.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        })
      }
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const classes = {
        0: 'pending',
        1: 'published',
        2: 'rejected'
      }
      return classes[status] || 'pending'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const texts = {
        0: '待审核',
        1: '已发布',
        2: '已拒绝'
      }
      return texts[status] || '未知'
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      // 一分钟内
      if (diff < 60 * 1000) {
        return '刚刚'
      }
      // 一小时内
      if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前'
      }
      // 一天内
      if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
      }
      // 超过一天
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 40rpx;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-scroll {
  white-space: nowrap;
  padding: 24rpx 0;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 隐藏横向滚动条 */
.filter-scroll::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.filter-items {
  display: inline-flex;
  padding: 0 24rpx;
}

.filter-item {
  display: inline-block;
  padding: 16rpx 24rpx;
  margin-right: 16rpx;
  font-size: 28rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 16rpx;
  white-space: nowrap;
  transition: all 0.2s;
  position: relative;
}

.filter-item.active {
  background: #8b4513;
  color: #fff;
  font-weight: 500;
}

.count-badge {
  display: inline-block;
  margin-left: 8rpx;
  padding: 2rpx 10rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20rpx;
  font-size: 22rpx;
}

.filter-item.active .count-badge {
  background: rgba(255, 255, 255, 0.25);
}

/* 快捷上传 */
.quick-upload {
  padding: 24rpx;
  background: #f5f5f5;
}

.upload-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 30rpx;
  font-weight: bold;
  box-shadow: 0 6rpx 20rpx rgba(245, 87, 108, 0.25);
  border: none;
}

.upload-icon {
  font-size: 36rpx;
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
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #ccc;
  margin-bottom: 40rpx;
}

.empty-btn {
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

/* 上传列表 */
.upload-list {
  padding: 24rpx;
}

.upload-card {
  display: flex;
  margin-bottom: 24rpx;
  padding: 24rpx;
  overflow: hidden;
}

.upload-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 预览图区域 */
.preview-section {
  width: 200rpx;
  height: 280rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  overflow: hidden;
  background: #fafafa;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.placeholder-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 22rpx;
  color: #999;
}

/* 剧本信息 */
.script-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12rpx;
}

.script-title {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  line-height: 1.4;
}

.status-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.status-badge.pending {
  background: #fff7e6;
  color: #faad14;
}

.status-badge.published {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.rejected {
  background: #fff2f0;
  color: #f5222d;
}

.script-author {
  font-size: 26rpx;
  color: #666;
}

.script-meta {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
}

.script-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.upload-time {
  font-size: 24rpx;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  border: 2rpx solid;
}

.action-btn.edit {
  color: #1890ff;
  border-color: #1890ff;
}

.action-btn.delete {
  color: #f5222d;
  border-color: #f5222d;
}

/* 加载状态 */
.loading-state {
  padding: 40rpx 0;
  text-align: center;
}

.load-more {
  padding: 20rpx 24rpx;
}

.load-more-btn {
  width: 100%;
  height: 72rpx;
  background: white;
  color: #666;
  border: 2rpx solid #e0e0e0;
  border-radius: 36rpx;
  font-size: 28rpx;
}

/* 通用卡片 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
</style>

