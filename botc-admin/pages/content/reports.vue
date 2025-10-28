<template>
  <view class="page">
    <view class="header">
      <text class="title">举报管理</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ pendingCount }}</text>
        <text class="stat-label">待处理</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ totalCount }}</text>
        <text class="stat-label">总举报</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ handledCount }}</text>
        <text class="stat-label">已处理</text>
      </view>
    </view>

    <!-- 筛选区域 -->
    <view class="filter-bar">
      <picker mode="selector" :range="statusOptions" range-key="text" @change="onStatusChange">
        <view class="picker">
          状态：{{ statusOptions[statusFilter].text }}
        </view>
      </picker>
      
      <picker mode="selector" :range="typeOptions" range-key="text" @change="onTypeChange">
        <view class="picker">
          原因：{{ typeOptions[typeFilter].text }}
        </view>
      </picker>
    </view>

    <!-- 举报列表 -->
    <view class="report-list">
      <view v-if="loading" class="loading">
        <uni-load-more status="loading"></uni-load-more>
      </view>
      
      <view v-else-if="reportList.length === 0" class="empty">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无举报记录</text>
      </view>
      
      <view v-else v-for="item in reportList" :key="item._id" class="report-item">
        <!-- 举报信息 -->
        <view class="report-header">
          <view class="report-type-badge" :class="'type-' + item.report_type">
            {{ getReportTypeText(item.report_type) }}
          </view>
          <view class="report-status" :class="'status-' + item.status">
            {{ getStatusText(item.status) }}
          </view>
        </view>
        
        <!-- 被举报内容预览 -->
        <view class="report-content" @click="viewTarget(item)">
          <text class="content-label">被举报内容：</text>
          <text class="content-preview">{{ item.target_content || '加载中...' }}</text>
        </view>
        
        <!-- 举报详情 -->
        <view class="report-detail">
          <text v-if="item.report_reason" class="detail-text">原因：{{ item.report_reason }}</text>
          <text class="detail-text">举报人：{{ item.reporter_nickname || '匿名' }}</text>
          <text class="detail-text">时间：{{ formatTime(item.created_at) }}</text>
        </view>
        
        <!-- 操作按钮（仅待处理状态显示） -->
        <view v-if="item.status === 0" class="report-actions">
          <button 
            class="action-btn confirm-btn" 
            size="mini" 
            @click="handleReport(item, 1)"
          >
            违规-删除
          </button>
          <button 
            class="action-btn normal-btn" 
            size="mini" 
            @click="handleReport(item, 2)"
          >
            正常-驳回
          </button>
          <button 
            class="action-btn ignore-btn" 
            size="mini" 
            @click="handleReport(item, 3)"
          >
            忽略
          </button>
        </view>
        
        <!-- 处理结果 -->
        <view v-else class="handle-result">
          <text class="result-text">处理结果：{{ item.handle_result || '已处理' }}</text>
          <text class="result-time">{{ formatTime(item.handled_at) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'Reports',
  
  data() {
    return {
      reportList: [],
      loading: false,
      
      // 筛选
      statusFilter: 0,
      typeFilter: 0,
      statusOptions: [
        { value: 0, text: '待处理' },
        { value: -1, text: '全部状态' },
        { value: 1, text: '违规' },
        { value: 2, text: '正常' },
        { value: 3, text: '已忽略' }
      ],
      typeOptions: [
        { value: '', text: '全部原因' },
        { value: 'spam', text: '垃圾广告' },
        { value: 'porn', text: '色情低俗' },
        { value: 'violence', text: '暴力血腥' },
        { value: 'ad', text: '恶意营销' },
        { value: 'illegal', text: '违法违规' },
        { value: 'other', text: '其他' }
      ],
      
      // 统计
      totalCount: 0,
      pendingCount: 0,
      handledCount: 0
    }
  },
  
  onLoad() {
    this.loadReports()
  },
  
  methods: {
    // 加载举报列表
    async loadReports() {
      this.loading = true
      
      try {
        const db = uniCloud.database()
        const dbCmd = db.command
        
        // 构建查询条件
        let whereCondition = {}
        
        // 状态筛选
        if (this.statusFilter >= 0) {
          whereCondition.status = this.statusFilter
        }
        
        // 原因筛选
        if (this.typeFilter && this.typeOptions[this.typeFilter].value) {
          whereCondition.report_type = this.typeOptions[this.typeFilter].value
        }
        
        // 查询举报记录
        const res = await db.collection('botc-reports')
          .where(whereCondition)
          .orderBy('created_at', 'desc')
          .limit(50)
          .get()
        
        this.reportList = res.data
        
        // 加载被举报的内容和举报人信息
        await this.loadTargetContent()
        
        // 加载统计
        await this.loadStats()
        
      } catch (error) {
        console.error('加载举报列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 加载被举报的内容
    async loadTargetContent() {
      const db = uniCloud.database()
      
      for (let report of this.reportList) {
        try {
          if (report.target_type === 'post') {
            // 加载帖子内容
            const postRes = await db.collection('botc-posts')
              .doc(report.target_id)
              .get()
            
            if (postRes.data && postRes.data.length > 0) {
              const post = postRes.data[0]
              report.target_content = post.content
            } else {
              report.target_content = '[帖子已删除]'
            }
          }
          
          // 加载举报人昵称
          const userRes = await db.collection('uni-id-users')
            .doc(report.reporter_id)
            .field({ nickname: true })
            .get()
          
          if (userRes.data && userRes.data.length > 0) {
            report.reporter_nickname = userRes.data[0].nickname
          }
          
        } catch (error) {
          console.error('加载内容失败:', error)
          report.target_content = '[加载失败]'
        }
      }
      
      // 强制更新视图
      this.$forceUpdate()
    },
    
    // 加载统计数据
    async loadStats() {
      try {
        const db = uniCloud.database()
        
        const totalRes = await db.collection('botc-reports').count()
        this.totalCount = totalRes.total
        
        const pendingRes = await db.collection('botc-reports')
          .where({ status: 0 })
          .count()
        this.pendingCount = pendingRes.total
        
        this.handledCount = this.totalCount - this.pendingCount
        
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    },
    
    // 状态筛选
    onStatusChange(e) {
      this.statusFilter = this.statusOptions[e.detail.value].value
      this.loadReports()
    },
    
    // 原因筛选
    onTypeChange(e) {
      this.typeFilter = e.detail.value
      this.loadReports()
    },
    
    // 处理举报
    handleReport(item, status) {
      const statusText = {
        1: '确认违规并删除该内容',
        2: '确认内容正常，驳回举报',
        3: '忽略该举报'
      }
      
      uni.showModal({
        title: '确认操作',
        content: statusText[status],
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '处理中...' })
              
              const db = uniCloud.database()
              
              // 更新举报状态
              await db.collection('botc-reports').doc(item._id).update({
                status: status,
                handled_at: Date.now(),
                handle_result: statusText[status]
              })
              
              // 如果是违规，删除帖子
              if (status === 1 && item.target_type === 'post') {
                await db.collection('botc-posts').doc(item.target_id).update({
                  status: -1 // 封禁
                })
              }
              
              uni.hideLoading()
              uni.showToast({ title: '处理成功', icon: 'success' })
              this.loadReports()
              
            } catch (error) {
              console.error('处理举报失败:', error)
              uni.hideLoading()
              uni.showToast({ title: '处理失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    // 查看被举报内容
    viewTarget(item) {
      if (item.target_type === 'post') {
        // 跳转到帖子详情（可以在管理端预览）
        uni.showModal({
          title: '被举报内容',
          content: item.target_content || '内容已删除',
          showCancel: false
        })
      }
    },
    
    // 获取举报类型文本
    getReportTypeText(type) {
      const option = this.typeOptions.find(item => item.value === type)
      return option ? option.text : '未知'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const texts = ['待处理', '违规', '正常', '已忽略']
      return texts[status] || '未知'
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F5;
  padding: 20rpx;
}

/* 顶部 */
.header {
  padding: 20rpx;
  background: #FFFFFF;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

/* 统计卡片 */
.stats-card {
  display: flex;
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #FF4D4F;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.picker {
  flex: 1;
  background: #FFFFFF;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

/* 列表 */
.report-list {
  background: #FFFFFF;
  border-radius: 12rpx;
  overflow: hidden;
}

.loading,
.empty {
  padding: 80rpx 20rpx;
  text-align: center;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.report-item {
  padding: 24rpx;
  border-bottom: 1px solid #F0F0F0;
}

.report-item:last-child {
  border-bottom: none;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.report-type-badge {
  padding: 6rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  color: #FFFFFF;
}

.report-type-badge.type-spam,
.report-type-badge.type-ad {
  background: #FF7A45;
}

.report-type-badge.type-porn {
  background: #FF4D4F;
}

.report-type-badge.type-violence {
  background: #CF1322;
}

.report-type-badge.type-illegal {
  background: #820014;
}

.report-type-badge.type-other {
  background: #999;
}

.report-status {
  padding: 6rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
}

.report-status.status-0 {
  background: #FFF7E6;
  color: #FA8C16;
}

.report-status.status-1 {
  background: #FFF1F0;
  color: #FF4D4F;
}

.report-status.status-2 {
  background: #F6FFED;
  color: #52C41A;
}

.report-status.status-3 {
  background: #F0F0F0;
  color: #999;
}

.report-content {
  background: #FAFAFA;
  padding: 16rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.content-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.content-preview {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-detail {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.detail-text {
  font-size: 24rpx;
  color: #666;
}

.report-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  padding: 12rpx;
  font-size: 24rpx;
}

.confirm-btn {
  background: #FF4D4F;
  color: #FFFFFF;
}

.normal-btn {
  background: #52C41A;
  color: #FFFFFF;
}

.ignore-btn {
  background: #D9D9D9;
  color: #666;
}

.handle-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #F0F0F0;
  border-radius: 8rpx;
}

.result-text {
  font-size: 24rpx;
  color: #666;
}

.result-time {
  font-size: 22rpx;
  color: #999;
}
</style>

