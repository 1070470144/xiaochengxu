<template>
  <view class="shop-list-page">
    <!-- 顶部筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item" @click="showCityPicker">
        <text>{{ selectedCity || '全部城市' }}</text>
        <uni-icons type="arrowdown" size="14" color="#666" />
      </view>
      <view class="filter-item" @click="showSortPicker">
        <text>{{ sortText }}</text>
        <uni-icons type="arrowdown" size="14" color="#666" />
      </view>
    </view>

    <!-- 店铺列表 -->
    <scroll-view 
      class="shops-scroll"
      scroll-y
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="shops-list">
        <view 
          v-for="shop in shopsList" 
          :key="shop._id"
          class="shop-card"
          @click="goToDetail(shop._id)"
        >
          <!-- 店铺图片 -->
          <view class="shop-image">
            <image 
              :src="shop.shop_logo || shop.shop_images[0] || '/static/logo.png'" 
              mode="aspectFill"
            />
            <view v-if="shop.is_recommend" class="recommend-tag">推荐</view>
          </view>

          <!-- 店铺信息 -->
          <view class="shop-info">
            <view class="shop-header">
              <text class="shop-name">{{ shop.shop_name }}</text>
              <view class="shop-rating">
                <text class="rating-score">{{ shop.rating.toFixed(1) }}</text>
                <uni-icons type="star-filled" size="14" color="#FFB400" />
              </view>
            </view>

            <view class="shop-location">
              <uni-icons type="location" size="14" color="#999" />
              <text>{{ shop.city }} {{ shop.district }}</text>
            </view>

            <view class="shop-facilities">
              <text 
                v-for="(facility, index) in shop.facilities.slice(0, 4)" 
                :key="index"
                class="facility-tag"
              >
                {{ facility }}
              </text>
            </view>

            <view class="shop-stats">
              <text class="stat-item">{{ shop.table_count }}桌</text>
              <text class="stat-divider">|</text>
              <text class="stat-item">¥{{ shop.avg_price }}/人</text>
              <text class="stat-divider">|</text>
              <text class="stat-item">{{ shop.review_count }}评价</text>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="loading-status">
          <text v-if="loading">加载中...</text>
          <text v-else-if="!hasMore">没有更多了</text>
          <text v-else-if="shopsList.length === 0">暂无店铺</text>
        </view>
      </view>
    </scroll-view>

    <!-- 申请认证按钮 -->
    <view class="fab-button" @click="goToApply">
      <uni-icons type="plusempty" size="28" color="#fff" />
      <text class="fab-text">申请认证</text>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'ShopList',
  
  data() {
    return {
      shopsList: [],
      page: 1,
      pageSize: 10,
      loading: false,
      refreshing: false,
      hasMore: true,
      selectedCity: '',
      sortBy: 'recommend',
      sortText: '推荐排序'
    }
  },
  
  onLoad() {
    // 初始化 Shop 云对象
    this.shopObj = uniCloud.importObject('shop', { customUI: true })
    this.loadShops()
  },
  
  methods: {
    async loadShops(loadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const result = await this.shopObj.getList({
          page: this.page,
          pageSize: this.pageSize,
          city: this.selectedCity || undefined,
          sortBy: this.sortBy
        })
        
        if (result.code === 0) {
          const newShops = result.data.list
          
          if (loadMore) {
            this.shopsList = [...this.shopsList, ...newShops]
          } else {
            this.shopsList = newShops
          }
          
          this.hasMore = result.data.hasMore
        }
        
      } catch (error) {
        console.error('加载店铺失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    
    showCityPicker() {
      uni.showActionSheet({
        itemList: ['全部城市', '北京市', '上海市', '广州市', '深圳市', '成都市', '杭州市'],
        success: (res) => {
          const cities = ['', '北京市', '上海市', '广州市', '深圳市', '成都市', '杭州市']
          this.selectedCity = cities[res.tapIndex]
          this.page = 1
          this.hasMore = true
          this.loadShops()
        }
      })
    },
    
    showSortPicker() {
      uni.showActionSheet({
        itemList: ['推荐排序', '评分最高', '最新入驻'],
        success: (res) => {
          const sorts = [
            { value: 'recommend', text: '推荐排序' },
            { value: 'rating', text: '评分最高' },
            { value: 'newest', text: '最新入驻' }
          ]
          this.sortBy = sorts[res.tapIndex].value
          this.sortText = sorts[res.tapIndex].text
          this.page = 1
          this.hasMore = true
          this.loadShops()
        }
      })
    },
    
    onRefresh() {
      this.refreshing = true
      this.page = 1
      this.hasMore = true
      this.loadShops()
    },
    
    loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      this.loadShops(true)
    },
    
    goToDetail(shopId) {
      uni.navigateTo({
        url: `/pages/shop/detail/detail?id=${shopId}`
      })
    },
    
    goToApply() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      
      uni.navigateTo({
        url: '/pages/shop/apply/apply'
      })
    }
  }
}
</script>

<style scoped>
.shop-list-page {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  background: #fff;
  display: flex;
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: #666;
}

.shops-scroll {
  flex: 1;
  overflow-y: auto;
}

.shops-list {
  padding: 20rpx;
}

.shop-card {
  background: #fff;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
}

.shop-image {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
}

.shop-image image {
  width: 100%;
  height: 100%;
}

.recommend-tag {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
}

.shop-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.shop-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.shop-rating {
  display: flex;
  align-items: center;
  gap: 5rpx;
}

.rating-score {
  font-size: 28rpx;
  font-weight: bold;
  color: #FFB400;
}

.shop-location {
  display: flex;
  align-items: center;
  gap: 5rpx;
  margin-bottom: 10rpx;
}

.shop-location text {
  font-size: 24rpx;
  color: #999;
}

.shop-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.facility-tag {
  padding: 4rpx 12rpx;
  background: #f0f0f0;
  color: #666;
  font-size: 22rpx;
  border-radius: 4rpx;
}

.shop-stats {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.stat-item {
  font-size: 24rpx;
  color: #666;
}

.stat-divider {
  color: #ddd;
}

.loading-status {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 26rpx;
}

.fab-button {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 110rpx;
  height: 110rpx;
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.4);
}

.fab-text {
  font-size: 20rpx;
  color: #fff;
  margin-top: 5rpx;
}
</style>

