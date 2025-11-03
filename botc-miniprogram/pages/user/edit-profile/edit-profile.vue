<template>
  <view class="page">
    <view class="container">
      <!-- 头像设置 -->
      <view class="avatar-section card">
        <view class="section-title">头像</view>
        <view class="avatar-content" @click="chooseAvatar">
          <image class="avatar-preview" :src="formData.avatar || '/static/logo.png'" mode="aspectFill"></image>
          <view class="avatar-actions">
            <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
              <text class="btn-icon">📷</text>
              <text class="btn-text">选择头像</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="info-section card">
        <view class="section-title">基本信息</view>
        
        <!-- 昵称 -->
        <view class="form-item">
          <text class="item-label">昵称</text>
          <input 
            class="item-input" 
            v-model="formData.nickname" 
            placeholder="请输入昵称"
            maxlength="20"
            @blur="onNicknameBlur">
          </input>
        </view>

        <!-- 手机号（只读） -->
        <view class="form-item">
          <text class="item-label">手机号</text>
          <text class="item-value readonly">{{ formatMobile(userInfo.mobile) }}</text>
        </view>

        <!-- 性别 -->
        <view class="form-item" @click="showGenderPicker">
          <text class="item-label">性别</text>
          <text class="item-value" :class="{ placeholder: formData.gender === 0 }">
            {{ genderText }}
          </text>
          <text class="item-arrow">></text>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view class="submit-section">
        <button class="submit-btn btn-primary" @click="saveProfile" :loading="submitting">
          保存修改
        </button>
      </view>
    </view>

    <!-- 性别选择弹窗 -->
    <view v-if="showGender" class="gender-modal" @click="hideGenderPicker">
      <view class="gender-content" @click.stop>
        <view class="gender-title">选择性别</view>
        <view class="gender-list">
          <view 
            class="gender-item" 
            v-for="item in genderOptions" 
            :key="item.value"
            :class="{ active: formData.gender === item.value }"
            @click="selectGender(item.value)">
            <text>{{ item.label }}</text>
            <text v-if="formData.gender === item.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'
import { getUserCloudObject } from '@/common/userCloudObject.js'

export default {
  name: 'EditProfile',
  
  data() {
    return {
      userInfo: {},
      userObj: null,  // 用户云对象
      formData: {
        avatar: '',
        nickname: '',
        gender: 0
      },
      showGender: false,
      genderOptions: [
        { value: 0, label: '保密' },
        { value: 1, label: '男' },
        { value: 2, label: '女' }
      ],
      submitting: false
    }
  },

  computed: {
    genderText() {
      const item = this.genderOptions.find(g => g.value === this.formData.gender)
      return item ? item.label : '请选择性别'
    }
  },

  onLoad() {
    // 初始化用户云对象
    this.userObj = getUserCloudObject()
    this.loadUserInfo()
  },

  methods: {
    // 加载用户信息
    loadUserInfo() {
      this.userInfo = Auth.getUserInfo()
      if (this.userInfo) {
        this.formData = {
          avatar: this.userInfo.avatar || '',
          nickname: this.userInfo.nickname || '',
          gender: this.userInfo.gender || 0
        }
      }
    },

    // 选择头像（微信小程序方式）
    onChooseAvatar(e) {
      const { avatarUrl } = e.detail
      this.formData.avatar = avatarUrl
    },

    // 选择头像（传统方式）
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.uploadAvatar(tempFilePath)
        }
      })
    },

    // 上传头像
    async uploadAvatar(filePath) {
      uni.showLoading({ title: '上传中...' })

      try {
        console.log('📤 开始上传头像，文件路径：', filePath)
        
        // 上传到云存储
        const result = await uniCloud.uploadFile({
          filePath: filePath,
          cloudPath: `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
        })

        console.log('✅ 头像上传成功，fileID：', result.fileID)
        this.formData.avatar = result.fileID

        uni.hideLoading()
        uni.showToast({
          title: '头像上传成功',
          icon: 'success'
        })

      } catch (error) {
        uni.hideLoading()
        console.error('❌ 上传头像失败：', error)
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    },

    // 昵称失焦验证
    onNicknameBlur() {
      if (!this.formData.nickname || this.formData.nickname.trim().length === 0) {
        uni.showToast({
          title: '昵称不能为空',
          icon: 'none'
        })
        this.formData.nickname = this.userInfo.nickname
      }
    },

    // 显示性别选择
    showGenderPicker() {
      this.showGender = true
    },

    // 隐藏性别选择
    hideGenderPicker() {
      this.showGender = false
    },

    // 选择性别
    selectGender(value) {
      this.formData.gender = value
      this.hideGenderPicker()
    },

    // 格式化手机号
    formatMobile(mobile) {
      if (!mobile) return ''
      return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },

    // 保存资料
    async saveProfile() {
      // 验证昵称
      if (!this.formData.nickname || this.formData.nickname.trim().length === 0) {
        uni.showToast({
          title: '请输入昵称',
          icon: 'none'
        })
        return
      }

      if (this.formData.nickname.length > 20) {
        uni.showToast({
          title: '昵称不能超过20个字符',
          icon: 'none'
        })
        return
      }

      this.submitting = true

      try {
        // 使用云对象更新用户信息
        const result = await this.userObj.update({
          nickname: this.formData.nickname.trim(),
          avatar: this.formData.avatar,
          gender: this.formData.gender
        })

        if (result.code === 0) {
          // 更新本地用户信息
          const updatedUserInfo = result.data
          console.log('✅ 保存成功，更新本地用户信息：', updatedUserInfo)
          uni.setStorageSync('userInfo', updatedUserInfo)

          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })

          // 通知上一个页面刷新
          const pages = getCurrentPages()
          if (pages.length > 1) {
            const prePage = pages[pages.length - 2]
            if (prePage.route === 'pages/user/profile/profile' && prePage.$vm.loadUserData) {
              // 延迟刷新，确保本地存储已更新
              setTimeout(() => {
                prePage.$vm.loadUserData()
              }, 100)
            }
          }

          // 返回上一页
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)

        } else {
          throw new Error(result.result.message)
        }

      } catch (error) {
        console.error('保存失败：', error)
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20rpx;
}

.card {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.section-title {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

/* 头像部分 */
.avatar-section {
  margin-bottom: 20rpx;
}

.avatar-content {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  margin-bottom: 30rpx;
  border: 2rpx solid #e8e8e8;
}

.avatar-btn {
  background-color: #8B4513;
  color: white;
  border: none;
  border-radius: 44rpx;
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-btn::after {
  border: none;
}

.btn-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.btn-text {
  font-size: 28rpx;
}

/* 表单项 */
.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.item-label {
  font-size: 28rpx;
  color: #333333;
  width: 140rpx;
}

.item-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  text-align: right;
}

.item-value {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  text-align: right;
}

.item-value.readonly {
  color: #999999;
}

.item-value.placeholder {
  color: #cccccc;
}

.item-arrow {
  font-size: 28rpx;
  color: #cccccc;
  margin-left: 12rpx;
}

/* 提交按钮 */
.submit-section {
  padding: 40rpx 20rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  background-color: #8B4513;
  color: white;
  border: none;
}

.submit-btn::after {
  border: none;
}

/* 性别选择弹窗 */
.gender-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.gender-content {
  background: white;
  width: 100%;
  border-radius: 20rpx 20rpx 0 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.gender-title {
  text-align: center;
  font-size: 32rpx;
  font-weight: 500;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.gender-list {
  padding: 20rpx 0;
}

.gender-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  font-size: 30rpx;
}

.gender-item:active {
  background-color: #f5f5f5;
}

.gender-item.active {
  color: #8B4513;
}

.check-icon {
  font-size: 32rpx;
  color: #8B4513;
  font-weight: bold;
}
</style>

