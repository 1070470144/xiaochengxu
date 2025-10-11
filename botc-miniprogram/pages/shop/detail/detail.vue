<template>
  <view class="shop-detail-page">
    <scroll-view class="content-scroll" scroll-y>
      <view v-if="shop" class="shop-content">
        <!-- 店铺图片轮播 -->
        <swiper class="shop-swiper" :indicator-dots="true" autoplay>
          <swiper-item v-for="(img, index) in shop.shop_images" :key="index">
            <image :src="img" mode="aspectFill" />
          </swiper-item>
        </swiper>

        <!-- 店铺基本信息 -->
        <view class="shop-basic">
          <view class="shop-header">
            <text class="shop-name">{{ shop.shop_name }}</text>
            <view v-if="shop.is_recommend" class="recommend-badge">推荐</view>
          </view>
          
          <view class="shop-rating">
            <view class="rating-score">
              <text class="score-num">{{ shop.rating.toFixed(1) }}</text>
              <text class="score-text">分</text>
            </view>
            <text class="review-count">{{ shop.review_count }}条评价</text>
          </view>

          <view class="shop-address">
            <uni-icons type="location" size="18" color="#8B4513" />
            <text>{{ shop.province }} {{ shop.city }} {{ shop.district }}</text>
          </view>
          <view class="address-detail">{{ shop.address }}</view>

          <view class="shop-stats">
            <view class="stat-item">
              <text class="stat-label">营业时间</text>
              <text class="stat-value">{{ shop.business_hours || '暂无' }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">桌数</text>
              <text class="stat-value">{{ shop.table_count }}桌</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">人均</text>
              <text class="stat-value">¥{{ shop.avg_price }}</text>
            </view>
          </view>
        </view>

        <!-- 店铺设施 -->
        <view class="shop-facilities" v-if="shop.facilities && shop.facilities.length > 0">
          <view class="section-title">店铺设施</view>
          <view class="facilities-list">
            <text v-for="(facility, index) in shop.facilities" :key="index" class="facility-tag">
              {{ facility }}
            </text>
          </view>
        </view>

        <!-- 店铺介绍 -->
        <view class="shop-description" v-if="shop.description">
          <view class="section-title">店铺介绍</view>
          <text class="description-text">{{ shop.description }}</text>
        </view>

        <!-- 联系方式 -->
        <view class="shop-contact">
          <view class="section-title">联系方式</view>
          <view class="contact-item" @click="callPhone">
            <uni-icons type="phone" size="20" color="#8B4513" />
            <text>{{ shop.contact_phone }}</text>
          </view>
          <view class="contact-item" v-if="shop.contact_wechat">
            <uni-icons type="chat" size="20" color="#8B4513" />
            <text>{{ shop.contact_wechat }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="footer-bar">
      <button class="action-btn" @click="callPhone">
        <uni-icons type="phone" size="22" color="#8B4513" />
        <text>电话咨询</text>
      </button>
      <button class="action-btn primary" @click="goToCarpool">
        <uni-icons type="calendar" size="22" color="#fff" />
        <text>预约组局</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ShopDetail',
  
  data() {
    return {
      shopId: '',
      shop: null
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.shopId = options.id
      this.loadShopDetail()
    }
  },
  
  methods: {
    async loadShopDetail() {
      uni.showLoading({ title: '加载中...' })
      
      try {
        const result = await uniCloud.callFunction({
          name: 'shop-detail',
          data: {
            shopId: this.shopId
          }
        })
        
        if (result.result.code === 0) {
          this.shop = result.result.data
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('加载店铺失败：', error)
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
    
    callPhone() {
      if (!this.shop) return
      
      uni.makePhoneCall({
        phoneNumber: this.shop.contact_phone
      })
    },
    
    goToCarpool() {
      uni.navigateTo({
        url: '/pages/carpool/create/create'
      })
    }
  }
}
</script>

<style scoped>
.shop-detail-page {
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

.shop-swiper {
  width: 100%;
  height: 500rpx;
}

.shop-swiper image {
  width: 100%;
  height: 100%;
}

.shop-basic {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.shop-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.shop-name {
  flex: 1;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.recommend-badge {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  color: #fff;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.shop-rating {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.rating-score {
  margin-right: 20rpx;
}

.score-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #FFB400;
}

.score-text {
  font-size: 24rpx;
  color: #999;
}

.review-count {
  font-size: 26rpx;
  color: #999;
}

.shop-address {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.shop-address text {
  font-size: 28rpx;
  color: #333;
}

.address-detail {
  font-size: 26rpx;
  color: #999;
  margin-left: 28rpx;
  margin-bottom: 20rpx;
}

.shop-stats {
  display: flex;
  padding-top: 20rpx;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.stat-value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.shop-facilities,
.shop-description,
.shop-contact {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.facilities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.facility-tag {
  padding: 10rpx 20rpx;
  background: #f0f0f0;
  color: #666;
  font-size: 26rpx;
  border-radius: 40rpx;
}

.description-text {
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item text {
  font-size: 28rpx;
  color: #333;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 15rpx 30rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: 40rpx;
  border: 1rpx solid #8B4513;
  background: #fff;
  color: #8B4513;
  font-size: 28rpx;
}

.action-btn.primary {
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
  color: #fff;
  border: none;
}
</style>

