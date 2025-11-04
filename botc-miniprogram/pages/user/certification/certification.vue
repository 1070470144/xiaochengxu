<template>
  <view class="certification-page">
    <!-- 头部说明 -->
    <view class="header-card">
      <text class="header-title">🎭 说书人认证</text>
      <text class="header-desc">成为认证说书人，展示你的专业水平</text>
    </view>

    <!-- 当前认证状态 -->
    <view v-if="certificationInfo" class="status-card">
      <view class="status-header">
        <text class="status-title">当前认证状态</text>
        <view class="status-badge" :class="getStatusClass(certificationInfo.status)">
          {{ getStatusText(certificationInfo.status) }}
        </view>
      </view>
      
      <!-- 已认证 -->
      <view v-if="certificationInfo.status === 'approved'" class="approved-info">
        <view class="cert-level">
          <text class="level-icon">{{ getLevelIcon(certificationInfo.level) }}</text>
          <text class="level-name">{{ getLevelName(certificationInfo.level) }}</text>
        </view>
        <text class="cert-time">认证时间：{{ formatTime(certificationInfo.approved_at) }}</text>
        <button class="revoke-btn" @click="showRevokeConfirm">撤销认证</button>
      </view>
      
      <!-- 审核中 -->
      <view v-else-if="certificationInfo.status === 'pending'" class="pending-info">
        <view class="pending-status">
          <view class="status-icon">⏳</view>
          <view class="status-content">
            <text class="pending-text">正在审核您的{{ getLevelName(certificationInfo.level) }}申请</text>
            <text class="apply-time">申请时间：{{ formatTime(certificationInfo.created_at) }}</text>
          </view>
        </view>
        <button class="cancel-btn" @click="showCancelConfirm">
          <text class="btn-icon">✕</text>
          <text class="btn-text">取消申请</text>
        </button>
      </view>
      
      <!-- 被拒绝 -->
      <view v-else-if="certificationInfo.status === 'rejected'" class="rejected-info">
        <view class="rejected-status">
          <view class="status-icon rejected-icon">✕</view>
          <view class="status-content">
            <text class="rejected-text">您的申请未通过</text>
            <text class="reject-reason">拒绝原因：{{ certificationInfo.reject_reason || '不符合认证条件' }}</text>
          </view>
        </view>
        <button class="reapply-btn" @click="handleReapply">
          <text class="btn-icon">🔄</text>
          <text class="btn-text">重新申请</text>
        </button>
      </view>
    </view>

    <!-- 认证级别选择 -->
    <view v-if="!certificationInfo || certificationInfo.status === 'rejected'" class="level-section">
      <text class="section-title">选择认证级别</text>
      
      <view class="level-cards">
        <!-- 一星认证 -->
        <view 
          class="level-card"
          :class="{ active: selectedLevel === 1 }"
          @click="selectLevel(1)"
        >
          <view class="card-header-level">
            <text class="level-icon-large">⭐</text>
            <text class="level-title">一星说书人</text>
          </view>
          <view class="level-desc">
            <text class="desc-text">初级说书人认证，展示你的说书人身份</text>
          </view>
          <view class="level-benefits">
            <text class="benefit-title">认证权益：</text>
            <text class="benefit-item">• 说书人榜单展示</text>
            <text class="benefit-item">• 一星认证标识</text>
            <text class="benefit-item">• 优先推荐权</text>
          </view>
        </view>
        
        <!-- 二星认证 -->
        <view 
          class="level-card"
          :class="{ active: selectedLevel === 2 }"
          @click="selectLevel(2)"
        >
          <view class="card-header-level">
            <text class="level-icon-large">⭐⭐</text>
            <text class="level-title">二星说书人</text>
          </view>
          <view class="level-desc">
            <text class="desc-text">高级说书人认证，获得更多曝光和推荐</text>
            <text class="desc-note">通过二星认证后自动获得一星认证</text>
          </view>
          <view class="level-benefits">
            <text class="benefit-title">认证权益：</text>
            <text class="benefit-item">• 一星全部权益</text>
            <text class="benefit-item">• 二星认证标识</text>
            <text class="benefit-item">• 榜单优先排序</text>
            <text class="benefit-item">• 专属推荐位</text>
            <text class="benefit-item">• 官方重点推荐</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 上传证明材料 -->
    <view v-if="selectedLevel && (!certificationInfo || certificationInfo.status === 'rejected')" class="upload-section">
      <text class="section-title">上传认证照片</text>
      <text class="upload-desc">请上传能证明您说书人身份的照片，如工作照、活动照等（1-3张）</text>
      
      <view class="upload-grid">
        <view 
          v-for="(img, index) in uploadedImages" 
          :key="index"
          class="upload-item"
        >
          <image class="upload-image" :src="img" mode="aspectFill" @click="previewImage(index)"></image>
          <view class="delete-btn" @click="deleteImage(index)">×</view>
        </view>
        
        <view 
          v-if="uploadedImages.length < 3"
          class="upload-placeholder"
          @click="chooseImage"
        >
          <text class="upload-icon">+</text>
          <text class="upload-text">上传图片</text>
        </view>
      </view>
    </view>

    <!-- 申请说明 -->
    <view v-if="selectedLevel && (!certificationInfo || certificationInfo.status === 'rejected')" class="description-section">
      <text class="section-title">申请说明</text>
      <textarea 
        class="description-input"
        v-model="description"
        placeholder="请简要说明您的说书人经历、创作成果等（选填）"
        maxlength="500"
      />
      <text class="char-count">{{ description.length }}/500</text>
    </view>

    <!-- 提交按钮 -->
    <view v-if="selectedLevel && (!certificationInfo || certificationInfo.status === 'rejected')" class="submit-section">
      <button class="submit-btn" @click="submitApplication" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交申请' }}
      </button>
    </view>

    <!-- 认证说明 -->
    <view class="info-section">
      <text class="info-title">📋 认证说明</text>
      <view class="info-content">
        <text class="info-item">• 审核时间：1-3个工作日</text>
        <text class="info-item">• 请上传真实的说书人身份照片</text>
        <text class="info-item">• 通过二星认证将自动获得一星认证</text>
        <text class="info-item">• 虚假材料将被永久取消认证资格</text>
        <text class="info-item">• 违规行为将被取消认证</text>
      </view>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'Certification',
  
  data() {
    return {
      certificationInfo: null,
      selectedLevel: 0,
      uploadedImages: [],
      description: '',
      submitting: false,
      loading: false
    }
  },
  
  onLoad() {
    // 初始化 system 云对象
    this.systemObj = uniCloud.importObject('system', { customUI: true })
    this.checkLogin()
  },
  
  onShow() {
    this.checkLogin()
  },
  
  methods: {
    // 检查登录状态
    checkLogin() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return false
      }
      
      // 已登录，加载认证信息
      this.loadCertificationInfo()
      return true
    },
    
    // 加载认证信息
    async loadCertificationInfo() {
      if (this.loading) return
      this.loading = true
      
      try {
        const result = await this.systemObj.manageCertification('get')
        
        if (result.code === 0) {
          this.certificationInfo = result.data
        }
      } catch (error) {
        console.error('加载认证信息失败：', error)
      } finally {
        this.loading = false
      }
    },
    
    // 选择认证级别
    selectLevel(level) {
      this.selectedLevel = level
    },
    
    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 3 - this.uploadedImages.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.uploadImages(res.tempFilePaths)
        }
      })
    },
    
    // 上传图片到云存储
    async uploadImages(tempPaths) {
      uni.showLoading({ title: '上传中...' })
      
      try {
        for (let path of tempPaths) {
          const result = await uniCloud.uploadFile({
            filePath: path,
            cloudPath: `certification/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
          })
          
          this.uploadedImages.push(result.fileID)
        }
        
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        console.error('上传失败：', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 删除图片
    deleteImage(index) {
      this.uploadedImages.splice(index, 1)
    },
    
    // 预览图片
    previewImage(index) {
      uni.previewImage({
        urls: this.uploadedImages,
        current: index
      })
    },
    
    // 提交申请
    async submitApplication() {
      if (!this.selectedLevel) {
        uni.showToast({ title: '请选择认证级别', icon: 'none' })
        return
      }
      
      if (this.uploadedImages.length === 0) {
        uni.showToast({ title: '请至少上传一张证明材料', icon: 'none' })
        return
      }
      
      this.submitting = true
      
      try {
        const result = await this.systemObj.manageCertification('apply', {
          level: this.selectedLevel,
          images: this.uploadedImages,
          description: this.description
        })
        
        if (result.code === 0) {
          uni.showToast({ title: '申请提交成功', icon: 'success' })
          
          // 重置表单
          this.selectedLevel = 0
          this.uploadedImages = []
          this.description = ''
          
          // 刷新认证信息
          setTimeout(() => {
            this.loadCertificationInfo()
          }, 1000)
        } else {
          uni.showToast({ 
            title: result.result.message || '申请失败', 
            icon: 'none' 
          })
        }
      } catch (error) {
        console.error('提交申请失败：', error)
        uni.showToast({ title: '提交失败', icon: 'none' })
      } finally {
        this.submitting = false
      }
    },
    
    // 显示撤销确认
    showRevokeConfirm() {
      uni.showModal({
        title: '撤销认证',
        content: '确定要撤销认证吗？撤销后将失去所有认证权益',
        success: (res) => {
          if (res.confirm) {
            this.revokeCertification()
          }
        }
      })
    },
    
    // 撤销认证
    async revokeCertification() {
      try {
        const result = await this.systemObj.manageCertification('revoke')
        
        if (result.code === 0) {
          uni.showToast({ title: '已撤销认证', icon: 'success' })
          this.loadCertificationInfo()
        } else {
          uni.showToast({ 
            title: result.message || '撤销失败', 
            icon: 'none' 
          })
        }
      } catch (error) {
        console.error('撤销认证失败：', error)
        uni.showToast({ title: '撤销失败', icon: 'none' })
      }
    },
    
    // 显示取消申请确认
    showCancelConfirm() {
      uni.showModal({
        title: '取消申请',
        content: '确定要取消申请吗？',
        success: (res) => {
          if (res.confirm) {
            this.revokeCertification()
          }
        }
      })
    },
    
    // 清除状态（重新申请）
    clearStatus() {
      this.certificationInfo = null
      this.selectedLevel = 0
      this.uploadedImages = []
      this.description = ''
    },
    
    // 处理重新申请
    async handleReapply() {
      // 检查是否有之前的申请记录
      if (!this.certificationInfo || !this.certificationInfo.level) {
        uni.showToast({
          title: '申请信息不完整',
          icon: 'none'
        })
        return
      }
      
      // 确认对话框
      uni.showModal({
        title: '确认重新申请',
        content: `确定要重新申请${this.getLevelName(this.certificationInfo.level)}认证吗？`,
        confirmColor: '#8B4513',
        success: async (res) => {
          if (res.confirm) {
            // 保留之前的申请等级和图片
            const level = this.certificationInfo.level
            const images = this.certificationInfo.images || []
            
            // 重新选择等级
            this.selectedLevel = level
            
            // 如果有之前的图片，提示用户
            if (images.length > 0) {
              uni.showToast({
                title: '请重新上传认证图片',
                icon: 'none',
                duration: 2000
              })
            }
            
            // 清除拒绝状态，显示申请表单
            this.certificationInfo = null
            this.uploadedImages = []
            
            // 滚动到表单区域
            setTimeout(() => {
              uni.pageScrollTo({
                scrollTop: 200,
                duration: 300
              })
            }, 100)
          }
        }
      })
    },
    
    // 获取状态文本
    getStatusText(status) {
      const map = {
        pending: '审核中',
        approved: '已认证',
        rejected: '已拒绝'
      }
      return map[status] || '未知'
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      return `status-${status}`
    },
    
    // 获取级别图标
    getLevelIcon(level) {
      return level === 1 ? '⭐' : '⭐⭐'
    },
    
    // 获取级别名称
    getLevelName(level) {
      return level === 1 ? '一星说书人' : '二星说书人'
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.certification-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx 0 40rpx;
}

/* 头部卡片 */
.header-card {
  margin: 0 20rpx 20rpx;
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.3);
}

.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 15rpx;
}

.header-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 状态卡片 */
.status-card {
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.status-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.status-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.status-pending {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.status-approved {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.status-rejected {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

/* 已认证信息 */
.approved-info {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.cert-level {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.level-icon {
  font-size: 40rpx;
}

.level-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.cert-time {
  font-size: 26rpx;
  color: #999;
}

.revoke-btn {
  margin-top: 10rpx;
  padding: 20rpx;
  background: #f44336;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

/* 审核中信息 */
.pending-info {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.pending-status {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 25rpx;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 193, 7, 0.05) 100%);
  border-radius: 16rpx;
  border-left: 4rpx solid #ff9800;
}

.status-icon {
  font-size: 48rpx;
  line-height: 1;
}

.status-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.pending-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.apply-time {
  font-size: 24rpx;
  color: #666;
}

.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 2rpx solid #ddd;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #666;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.cancel-btn:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, #e8e8e8 0%, #ddd 100%);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 32rpx;
  font-weight: bold;
  color: #999;
}

.btn-text {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

/* 被拒绝信息 */
.rejected-info {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.rejected-status {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 25rpx;
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(229, 57, 53, 0.05) 100%);
  border-radius: 16rpx;
  border-left: 4rpx solid #f44336;
}

.rejected-icon {
  color: #f44336;
}

.rejected-text {
  font-size: 28rpx;
  color: #f44336;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.reject-reason {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.reapply-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  border: none;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.2);
  transition: all 0.3s ease;
}

.reapply-btn:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, #704010 0%, #8B4513 100%);
  box-shadow: 0 2rpx 6rpx rgba(139, 69, 19, 0.3);
}

.reapply-btn .btn-icon {
  font-size: 32rpx;
  color: #fff;
}

.reapply-btn .btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

/* 级别选择区 */
.level-section {
  margin: 0 20rpx 20rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding: 0 10rpx;
}

.level-cards {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.level-card {
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  border: 3rpx solid #e8e8e8;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.level-card.active {
  border-color: #8B4513;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.2);
}

.card-header-level {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 25rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.level-icon-large {
  font-size: 48rpx;
}

.level-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.level-desc {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 25rpx;
  padding: 20rpx;
  background: rgba(139, 69, 19, 0.03);
  border-radius: 12rpx;
  border-left: 4rpx solid #8B4513;
}

.desc-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.desc-note {
  font-size: 24rpx;
  color: #8B4513;
  line-height: 1.5;
}

.level-benefits {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.05) 0%, rgba(160, 82, 45, 0.05) 100%);
  border-radius: 12rpx;
}

.benefit-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 8rpx;
}

.benefit-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

/* 上传区域 */
.upload-section {
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.upload-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 25rpx;
  line-height: 1.6;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.upload-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12rpx;
  overflow: hidden;
}

.upload-image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  color: #fff;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.upload-placeholder {
  aspect-ratio: 1;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  background: #fafafa;
}

.upload-icon {
  font-size: 48rpx;
  color: #999;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

/* 申请说明 */
.description-section {
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.description-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 12rpx;
  font-size: 26rpx;
  line-height: 1.6;
  margin-bottom: 10rpx;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999;
}

/* 提交按钮 */
.submit-section {
  margin: 0 20rpx 20rpx;
}

.submit-btn {
  width: 100%;
  padding: 28rpx;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: #fff;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.3);
}

.submit-btn[disabled] {
  opacity: 0.6;
}

/* 认证说明 */
.info-section {
  margin: 0 20rpx;
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.info-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.info-item {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}
</style>

