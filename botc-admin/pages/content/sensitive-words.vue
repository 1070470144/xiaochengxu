<template>
  <view class="page">
    <view class="header">
      <text class="title">敏感词管理</text>
      <button class="add-btn" type="primary" size="mini" @click="showAddDialog">添加敏感词</button>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ totalCount }}</text>
        <text class="stat-label">总词数</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ enabledCount }}</text>
        <text class="stat-label">已启用</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ disabledCount }}</text>
        <text class="stat-label">已禁用</text>
      </view>
    </view>

    <!-- 筛选区域 -->
    <view class="filter-bar">
      <picker mode="selector" :range="typeOptions" range-key="text" @change="onTypeChange">
        <view class="picker">
          类型：{{ typeOptions[typeFilter].text }}
        </view>
      </picker>
      
      <picker mode="selector" :range="statusOptions" range-key="text" @change="onStatusChange">
        <view class="picker">
          状态：{{ statusOptions[statusFilter].text }}
        </view>
      </picker>
    </view>

    <!-- 敏感词列表 -->
    <view class="word-list">
      <view v-if="loading" class="loading">
        <uni-load-more status="loading"></uni-load-more>
      </view>
      
      <view v-else-if="wordList.length === 0" class="empty">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无敏感词</text>
      </view>
      
      <view v-else v-for="item in wordList" :key="item._id" class="word-item">
        <view class="word-main">
          <view class="word-content">
            <text class="word-text">{{ item.word }}</text>
            <view class="word-tag" :class="'type-' + item.type">
              {{ getTypeText(item.type) }}
            </view>
            <view v-if="!item.enabled" class="disabled-tag">已禁用</view>
          </view>
          <text v-if="item.replacement" class="replacement">→ {{ item.replacement }}</text>
          <text class="create-time">{{ formatTime(item.created_at) }}</text>
        </view>
        
        <view class="word-actions">
          <button 
            class="action-btn toggle-btn" 
            size="mini" 
            @click="toggleStatus(item)"
          >
            {{ item.enabled ? '禁用' : '启用' }}
          </button>
          <button 
            class="action-btn delete-btn" 
            size="mini" 
            type="warn" 
            @click="deleteWord(item)"
          >
            删除
          </button>
        </view>
      </view>
    </view>

    <!-- 添加敏感词对话框 -->
    <uni-popup ref="addDialog" type="dialog">
      <view class="dialog">
        <text class="dialog-title">添加敏感词</text>
        
        <view class="form-item">
          <text class="form-label">敏感词</text>
          <input 
            class="form-input" 
            v-model="formData.word" 
            placeholder="请输入敏感词"
            maxlength="50"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">类型</text>
          <picker mode="selector" :range="typeOptions.slice(1)" range-key="text" @change="onFormTypeChange">
            <view class="form-picker">
              {{ formData.type ? getTypeText(formData.type) : '请选择类型' }}
            </view>
          </picker>
        </view>
        
        <view class="form-item">
          <text class="form-label">替换词（可选）</text>
          <input 
            class="form-input" 
            v-model="formData.replacement" 
            placeholder="如：***"
            maxlength="20"
          />
        </view>
        
        <view class="dialog-actions">
          <button class="dialog-btn cancel" size="mini" @click="closeAddDialog">取消</button>
          <button class="dialog-btn confirm" size="mini" type="primary" @click="submitAdd">确定</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  name: 'SensitiveWords',
  
  data() {
    return {
      wordList: [],
      loading: false,
      
      // 筛选
      typeFilter: 0,
      statusFilter: 0,
      typeOptions: [
        { value: 0, text: '全部类型' },
        { value: 1, text: '违禁词' },
        { value: 2, text: '广告词' },
        { value: 3, text: '联系方式' },
        { value: 4, text: '其他' }
      ],
      statusOptions: [
        { value: -1, text: '全部状态' },
        { value: 1, text: '已启用' },
        { value: 0, text: '已禁用' }
      ],
      
      // 统计
      totalCount: 0,
      enabledCount: 0,
      disabledCount: 0,
      
      // 表单
      formData: {
        word: '',
        type: 0,
        replacement: ''
      }
    }
  },
  
  onLoad() {
    this.loadWords()
  },
  
  methods: {
    // 加载敏感词列表
    async loadWords() {
      this.loading = true
      
      try {
        const db = uniCloud.database()
        let query = db.collection('botc-sensitive-words')
        
        // 类型筛选
        if (this.typeFilter > 0) {
          query = query.where({ type: this.typeFilter })
        }
        
        // 状态筛选
        if (this.statusFilter >= 0) {
          const enabled = this.statusFilter === 1
          query = query.where({ enabled: enabled })
        }
        
        const res = await query.orderBy('created_at', 'desc').get()
        this.wordList = res.data
        
        // 统计
        await this.loadStats()
        
      } catch (error) {
        console.error('加载敏感词失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 加载统计数据
    async loadStats() {
      try {
        const db = uniCloud.database()
        
        const totalRes = await db.collection('botc-sensitive-words').count()
        this.totalCount = totalRes.total
        
        const enabledRes = await db.collection('botc-sensitive-words')
          .where({ enabled: true })
          .count()
        this.enabledCount = enabledRes.total
        
        this.disabledCount = this.totalCount - this.enabledCount
        
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    },
    
    // 类型筛选
    onTypeChange(e) {
      this.typeFilter = this.typeOptions[e.detail.value].value
      this.loadWords()
    },
    
    // 状态筛选
    onStatusChange(e) {
      this.statusFilter = this.statusOptions[e.detail.value].value
      this.loadWords()
    },
    
    // 显示添加对话框
    showAddDialog() {
      this.formData = {
        word: '',
        type: 0,
        replacement: ''
      }
      this.$refs.addDialog.open()
    },
    
    // 关闭对话框
    closeAddDialog() {
      this.$refs.addDialog.close()
    },
    
    // 表单类型选择
    onFormTypeChange(e) {
      this.formData.type = this.typeOptions[e.detail.value + 1].value
    },
    
    // 提交添加
    async submitAdd() {
      if (!this.formData.word.trim()) {
        uni.showToast({ title: '请输入敏感词', icon: 'none' })
        return
      }
      
      if (!this.formData.type) {
        uni.showToast({ title: '请选择类型', icon: 'none' })
        return
      }
      
      try {
        const db = uniCloud.database()
        
        // 检查是否已存在
        const checkRes = await db.collection('botc-sensitive-words')
          .where({ word: this.formData.word.trim() })
          .get()
        
        if (checkRes.data.length > 0) {
          uni.showToast({ title: '该敏感词已存在', icon: 'none' })
          return
        }
        
        // 添加
        await db.collection('botc-sensitive-words').add({
          word: this.formData.word.trim(),
          type: this.formData.type,
          replacement: this.formData.replacement.trim() || '',
          enabled: true,
          created_at: Date.now()
        })
        
        uni.showToast({ title: '添加成功', icon: 'success' })
        this.closeAddDialog()
        this.loadWords()
        
      } catch (error) {
        console.error('添加敏感词失败:', error)
        uni.showToast({ title: '添加失败', icon: 'none' })
      }
    },
    
    // 切换启用状态
    async toggleStatus(item) {
      try {
        const db = uniCloud.database()
        await db.collection('botc-sensitive-words').doc(item._id).update({
          enabled: !item.enabled,
          updated_at: Date.now()
        })
        
        uni.showToast({ 
          title: item.enabled ? '已禁用' : '已启用', 
          icon: 'success' 
        })
        this.loadWords()
        
      } catch (error) {
        console.error('更新状态失败:', error)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    
    // 删除敏感词
    deleteWord(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除敏感词"${item.word}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const db = uniCloud.database()
              await db.collection('botc-sensitive-words').doc(item._id).remove()
              
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.loadWords()
              
            } catch (error) {
              console.error('删除敏感词失败:', error)
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    // 获取类型文本
    getTypeText(type) {
      const option = this.typeOptions.find(item => item.value === type)
      return option ? option.text : '未知'
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.add-btn {
  padding: 10rpx 24rpx;
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
  color: #1890FF;
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
.word-list {
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

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1px solid #F0F0F0;
}

.word-item:last-child {
  border-bottom: none;
}

.word-main {
  flex: 1;
}

.word-content {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.word-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.word-tag {
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 20rpx;
  color: #FFFFFF;
}

.word-tag.type-1 {
  background: #FF4D4F;
}

.word-tag.type-2 {
  background: #FF7A45;
}

.word-tag.type-3 {
  background: #FFA940;
}

.word-tag.type-4 {
  background: #999;
}

.disabled-tag {
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 20rpx;
  background: #D9D9D9;
  color: #666;
}

.replacement {
  font-size: 24rpx;
  color: #1890FF;
  margin-bottom: 4rpx;
}

.create-time {
  font-size: 22rpx;
  color: #999;
}

.word-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 8rpx 20rpx;
}

.toggle-btn {
  background: #52C41A;
  color: #FFFFFF;
}

.delete-btn {
  background: #FF4D4F;
  color: #FFFFFF;
}

/* 对话框 */
.dialog {
  padding: 32rpx;
  background: #FFFFFF;
  border-radius: 12rpx;
  width: 600rpx;
}

.dialog-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 32rpx;
  text-align: center;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.form-input,
.form-picker {
  width: 100%;
  padding: 20rpx;
  border: 1px solid #D9D9D9;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-picker {
  color: #999;
}

.dialog-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.dialog-btn {
  flex: 1;
  padding: 16rpx;
}

.dialog-btn.cancel {
  background: #F5F5F5;
  color: #666;
}
</style>

