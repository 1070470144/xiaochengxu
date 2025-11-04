<template>
  <view class="shop-apply-page">
    <view class="apply-header">
      <text class="header-title">店铺认证申请</text>
      <text class="header-desc">认证后可展示店铺信息，吸引更多玩家</text>
    </view>

    <form @submit="submitApplication">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="item-label"><text class="required">*</text>店铺名称</text>
          <input 
            class="item-input" 
            v-model="formData.shopName"
            placeholder="请输入店铺名称"
            maxlength="50"
          />
        </view>

        <view class="form-item">
          <text class="item-label">店铺Logo</text>
          <view class="upload-area">
            <view v-if="formData.shopLogo" class="logo-preview">
              <image :src="formData.shopLogo" mode="aspectFill" />
              <view class="delete-btn" @click="deleteLogo">
                <uni-icons type="closeempty" size="20" color="#fff" />
              </view>
            </view>
            <view v-else class="upload-btn" @click="uploadLogo">
              <uni-icons type="camera" size="40" color="#999" />
              <text>上传Logo</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="item-label">店铺图片</text>
          <view class="images-grid">
            <view 
              v-for="(img, index) in formData.shopImages" 
              :key="index"
              class="image-item"
            >
              <image :src="img" mode="aspectFill" />
              <view class="delete-btn" @click="deleteImage(index)">
                <uni-icons type="closeempty" size="16" color="#fff" />
              </view>
            </view>
            <view 
              v-if="formData.shopImages.length < 9" 
              class="upload-btn-small"
              @click="uploadImages"
            >
              <uni-icons type="camera" size="30" color="#999" />
            </view>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="form-section">
        <view class="section-title">联系方式</view>
        
        <view class="form-item">
          <text class="item-label"><text class="required">*</text>联系电话</text>
          <input 
            class="item-input" 
            v-model="formData.contactPhone"
            type="number"
            placeholder="请输入联系电话"
            maxlength="11"
          />
        </view>

        <view class="form-item">
          <text class="item-label">联系人</text>
          <input 
            class="item-input" 
            v-model="formData.contactPerson"
            placeholder="请输入联系人姓名"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="item-label">微信号</text>
          <input 
            class="item-input" 
            v-model="formData.contactWechat"
            placeholder="请输入微信号"
            maxlength="50"
          />
        </view>
      </view>

      <!-- 店铺地址 -->
      <view class="form-section">
        <view class="section-title">店铺地址</view>
        
        <view class="form-item" @click="chooseLocation">
          <text class="item-label"><text class="required">*</text>所在地区</text>
          <view class="item-value">
            <text v-if="formData.province">{{ formData.province }} {{ formData.city }} {{ formData.district }}</text>
            <text v-else class="placeholder">请选择地区</text>
            <uni-icons type="forward" size="16" color="#999" />
          </view>
        </view>

        <view class="form-item">
          <text class="item-label"><text class="required">*</text>详细地址</text>
          <input 
            class="item-input" 
            v-model="formData.address"
            placeholder="请输入详细地址"
            maxlength="200"
          />
        </view>
      </view>

      <!-- 店铺信息 -->
      <view class="form-section">
        <view class="section-title">店铺信息</view>
        
        <view class="form-item">
          <text class="item-label">营业时间</text>
          <input 
            class="item-input" 
            v-model="formData.businessHours"
            placeholder="例如：周一至周日 10:00-22:00"
            maxlength="100"
          />
        </view>

        <view class="form-item">
          <text class="item-label">桌数</text>
          <input 
            class="item-input" 
            v-model.number="formData.tableCount"
            type="number"
            placeholder="请输入桌数"
          />
        </view>

        <view class="form-item">
          <text class="item-label">人均消费</text>
          <input 
            class="item-input" 
            v-model.number="formData.avgPrice"
            type="number"
            placeholder="请输入人均消费（元）"
          />
        </view>

        <view class="form-item">
          <text class="item-label">店铺设施</text>
          <view class="facilities-selector">
            <view 
              v-for="facility in allFacilities" 
              :key="facility"
              class="facility-tag"
              :class="{ selected: formData.facilities.includes(facility) }"
              @click="toggleFacility(facility)"
            >
              {{ facility }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="item-label">店铺介绍</text>
          <textarea 
            class="item-textarea" 
            v-model="formData.description"
            placeholder="请介绍您的店铺特色、环境、服务等"
            maxlength="1000"
            :show-confirm-bar="false"
          />
          <view class="char-count">{{ formData.description.length }}/1000</view>
        </view>
      </view>

      <!-- 资质认证 -->
      <view class="form-section">
        <view class="section-title">资质认证</view>
        
        <view class="form-item">
          <text class="item-label"><text class="required">*</text>营业执照</text>
          <view class="license-upload">
            <view v-if="formData.licenseImage" class="license-preview">
              <image :src="formData.licenseImage" mode="aspectFill" />
              <view class="delete-btn" @click="deleteLicense">
                <uni-icons type="closeempty" size="20" color="#fff" />
              </view>
            </view>
            <view v-else class="upload-license" @click="uploadLicense">
              <uni-icons type="camera" size="40" color="#999" />
              <text>上传营业执照</text>
              <text class="upload-tip">请上传清晰的营业执照照片</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="item-label">执照号码</text>
          <input 
            class="item-input" 
            v-model="formData.licenseNumber"
            placeholder="请输入营业执照号码"
          />
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button 
          class="submit-btn"
          form-type="submit"
          :disabled="submitting"
        >
          {{ submitting ? '提交中...' : '提交申请' }}
        </button>
        <view class="submit-tip">
          提交后我们会在3个工作日内完成审核
        </view>
      </view>
    </form>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'ShopApply',
  
  data() {
    return {
      formData: {
        shopName: '',
        shopLogo: '',
        shopImages: [],
        contactPhone: '',
        contactPerson: '',
        contactWechat: '',
        province: '',
        city: '',
        district: '',
        address: '',
        businessHours: '',
        tableCount: '',
        avgPrice: '',
        facilities: [],
        description: '',
        licenseImage: '',
        licenseNumber: ''
      },
      allFacilities: [
        'WiFi', '空调', '投影', '音响', 
        '桌游', '饮料', '零食', '停车位',
        '包间', '休息区'
      ],
      submitting: false
    }
  },
  
  onLoad() {
    // 初始化 Shop 云对象
    this.shopObj = uniCloud.importObject('shop', { customUI: true })
  },
  
  methods: {
    // 上传Logo
    uploadLogo() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          await this.uploadFile(res.tempFilePaths[0], 'logo')
        }
      })
    },
    
    // 删除Logo
    deleteLogo() {
      this.formData.shopLogo = ''
    },
    
    // 上传店铺图片
    uploadImages() {
      const maxCount = 9 - this.formData.shopImages.length
      
      uni.chooseImage({
        count: maxCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          uni.showLoading({ title: '上传中...' })
          
          for (let i = 0; i < res.tempFilePaths.length; i++) {
            await this.uploadFile(res.tempFilePaths[i], 'images')
          }
          
          uni.hideLoading()
        }
      })
    },
    
    // 删除图片
    deleteImage(index) {
      this.formData.shopImages.splice(index, 1)
    },
    
    // 上传营业执照
    uploadLicense() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          await this.uploadFile(res.tempFilePaths[0], 'license')
        }
      })
    },
    
    // 删除营业执照
    deleteLicense() {
      this.formData.licenseImage = ''
    },
    
    // 上传文件
    async uploadFile(filePath, type) {
      uni.showLoading({ title: '上传中...' })
      
      try {
        const uploadResult = await uniCloud.uploadFile({
          filePath: filePath,
          cloudPath: `shops/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`
        })
        
        if (type === 'logo') {
          this.formData.shopLogo = uploadResult.fileID
        } else if (type === 'images') {
          this.formData.shopImages.push(uploadResult.fileID)
        } else if (type === 'license') {
          this.formData.licenseImage = uploadResult.fileID
        }
        
      } catch (error) {
        console.error('上传失败：', error)
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 选择地区
    chooseLocation() {
      // 简化版本，使用选择器
      uni.showActionSheet({
        itemList: ['北京市', '上海市', '广州市', '深圳市', '成都市', '杭州市', '其他'],
        success: (res) => {
          const cities = ['北京市', '上海市', '广州市', '深圳市', '成都市', '杭州市', '其他']
          this.formData.province = cities[res.tapIndex]
          this.formData.city = cities[res.tapIndex]
          this.formData.district = ''
        }
      })
    },
    
    // 切换设施
    toggleFacility(facility) {
      const index = this.formData.facilities.indexOf(facility)
      if (index > -1) {
        this.formData.facilities.splice(index, 1)
      } else {
        this.formData.facilities.push(facility)
      }
    },
    
    // 提交申请
    async submitApplication() {
      // 验证必填项
      if (!this.formData.shopName) {
        uni.showToast({ title: '请输入店铺名称', icon: 'none' })
        return
      }
      
      if (!this.formData.contactPhone) {
        uni.showToast({ title: '请输入联系电话', icon: 'none' })
        return
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.formData.contactPhone)) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      
      if (!this.formData.province || !this.formData.address) {
        uni.showToast({ title: '请填写完整地址', icon: 'none' })
        return
      }
      
      if (!this.formData.licenseImage) {
        uni.showToast({ title: '请上传营业执照', icon: 'none' })
        return
      }
      
      this.submitting = true
      
      try {
        const result = await this.shopObj.apply(this.formData)
        
        if (result.code === 0) {
          uni.showToast({
            title: '提交成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          throw new Error(result.message)
        }
        
      } catch (error) {
        console.error('提交失败：', error)
        uni.showToast({
          title: error.message || '提交失败',
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
.shop-apply-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.apply-header {
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
  padding: 40rpx 30rpx;
  color: #fff;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.header-desc {
  font-size: 24rpx;
  opacity: 0.9;
}

.form-section {
  background: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 25rpx;
  padding-left: 15rpx;
  border-left: 4rpx solid #8B4513;
}

.form-item {
  margin-bottom: 30rpx;
}

.item-label {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

.required {
  color: #f44336;
  margin-right: 5rpx;
}

.item-input {
  width: 100%;
  height: 70rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.item-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

.item-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.upload-area {
  margin-top: 15rpx;
}

.logo-preview,
.license-preview {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
  overflow: hidden;
}

.logo-preview image,
.license-preview image {
  width: 100%;
  height: 100%;
}

.upload-btn,
.upload-license {
  width: 200rpx;
  height: 200rpx;
  background: #f5f5f5;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-btn text,
.upload-license text {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.upload-tip {
  font-size: 22rpx !important;
  color: #ccc !important;
  margin-top: 5rpx !important;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15rpx;
  margin-top: 15rpx;
}

.image-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
}

.image-item image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.upload-btn-small {
  width: 100%;
  padding-bottom: 100%;
  background: #f5f5f5;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.delete-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.facilities-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-top: 15rpx;
}

.facility-tag {
  padding: 10rpx 20rpx;
  background: #f5f5f5;
  color: #666;
  font-size: 26rpx;
  border-radius: 40rpx;
  border: 1rpx solid #f5f5f5;
}

.facility-tag.selected {
  background: #FFF3E0;
  color: #8B4513;
  border-color: #8B4513;
}

.submit-section {
  padding: 30rpx;
}

.submit-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 40rpx;
  border: none;
  margin-bottom: 15rpx;
}

.submit-btn[disabled] {
  opacity: 0.6;
}

.submit-tip {
  text-align: center;
  font-size: 24rpx;
  color: #999;
}
</style>

