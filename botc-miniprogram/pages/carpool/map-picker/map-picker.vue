<template>
  <view class="map-picker-container">
    <!-- 地图容器 -->
    <view class="map-wrapper">
      <div id="map-container"></div>
      
      <!-- 中心标记点 -->
      <view class="center-marker">
        <view class="marker-icon">📍</view>
      </view>
    </view>
    
    <!-- 搜索框 -->
    <view class="search-bar">
      <input 
        v-model="searchKeyword" 
        placeholder="搜索城市或地点名称（如：北京、杭州西湖）"
        @confirm="searchLocation"
        class="search-input"
      />
      <button @click="searchLocation" class="search-btn" type="primary" size="mini">搜索</button>
    </view>
    
    <!-- 附近地点列表 -->
    <view class="location-list">
      <view class="list-title">📍 附近地点</view>
      
      <scroll-view scroll-y class="list-scroll">
        <view 
          v-for="(poi, index) in nearbyPois" 
          :key="index"
          :class="['poi-item', { 'selected': selectedPoi && selectedPoi.id === poi.id }]"
          @click="selectPoi(poi)"
        >
          <view class="poi-main">
            <view class="poi-name">{{ poi.name }}</view>
            <view class="poi-address">{{ poi.address }}</view>
          </view>
          <view class="poi-distance">{{ poi.distance }}m</view>
        </view>
        
        <!-- 空状态不显示，因为会自动添加"当前位置" -->
      </scroll-view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button @click="confirmLocation" class="confirm-btn" type="primary">
        确认选择
      </button>
      <button @click="cancel" class="cancel-btn">取消</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      map: null,              // 地图实例
      marker: null,           // 标记点
      currentLat: 0,          // 当前纬度
      currentLng: 0,          // 当前经度
      searchKeyword: '',      // 搜索关键词
      nearbyPois: [],         // 附近POI列表
      selectedPoi: null,      // 选中的POI
      amapKey: 'af6b5b22b6976922403634d1ffe34a6a',  // Web端(JS API) Key
      securityJsCode: '94269db104a9eba9253cc11fb97d3227'  // 安全密钥
    }
  },

  onLoad(options) {
    console.log('地图选点页面加载', options)
    
    // 获取初始坐标
    this.currentLat = parseFloat(options.latitude) || 39.908823
    this.currentLng = parseFloat(options.longitude) || 116.397470
    
    // 检查坐标是否在中国范围
    const isInChina = (
      this.currentLat >= 18 && this.currentLat <= 54 &&
      this.currentLng >= 73 && this.currentLng <= 135
    )
    
    // 如果不在中国，显示提示
    if (!isInChina) {
      console.warn('⚠️ 当前坐标不在中国范围', this.currentLat, this.currentLng)
      setTimeout(() => {
        uni.showToast({
          title: '请使用搜索功能查找地点',
          icon: 'none',
          duration: 3000
        })
      }, 1000)
    }
    
    // 设置安全密钥（全局配置，必须在加载地图前）
    window._AMapSecurityConfig = {
      securityJsCode: this.securityJsCode
    }
    
    // 加载高德地图JS API
    this.loadAmapScript()
  },

  methods: {
    // 加载高德地图JS API
    loadAmapScript() {
      // 检查是否已经加载
      if (window.AMap) {
        this.initMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.amapKey}&plugin=AMap.PlaceSearch,AMap.Geocoder`
      script.onload = () => {
        console.log('✅ 高德地图JS API加载成功')
        this.initMap()
      }
      script.onerror = () => {
        console.error('❌ 高德地图JS API加载失败')
        uni.showToast({
          title: '地图加载失败',
          icon: 'none'
        })
      }
      document.head.appendChild(script)
    },

    // 初始化地图
    initMap() {
      console.log('初始化地图', this.currentLat, this.currentLng)
      
      this.$nextTick(() => {
        // 创建地图实例
        this.map = new AMap.Map('map-container', {
          zoom: 16,
          center: [this.currentLng, this.currentLat],
          viewMode: '3D'  // 3D视图
        })

        // 添加中心点标记
        this.marker = new AMap.Marker({
          position: [this.currentLng, this.currentLat],
          map: this.map
        })

        // 地图拖动事件
        this.map.on('moveend', () => {
          const center = this.map.getCenter()
          this.currentLng = center.lng
          this.currentLat = center.lat
          
          // 更新标记位置
          this.marker.setPosition([this.currentLng, this.currentLat])
          
          // 搜索附近POI
          this.searchNearbyPois()
        })

        // 初始搜索附近POI
        this.searchNearbyPois()
      })
    },

    // 搜索附近POI
    searchNearbyPois() {
      if (!window.AMap) return

      console.log('搜索附近POI', this.currentLat, this.currentLng)

      const placeSearch = new AMap.PlaceSearch({
        type: '',  // 兴趣点类别，空字符串代表所有类别
        pageSize: 20,
        pageIndex: 1
      })

      placeSearch.searchNearBy('', [this.currentLng, this.currentLat], 1000, (status, result) => {
        if (status === 'complete' && result.poiList) {
          console.log('✅ POI搜索成功', result.poiList.pois)
          
          this.nearbyPois = result.poiList.pois.map(poi => ({
            id: poi.id,
            name: poi.name,
            address: poi.address || poi.pname + poi.cityname + poi.adname,
            latitude: poi.location.lat,
            longitude: poi.location.lng,
            distance: Math.round(poi.distance || 0)
          }))

          // 默认选中第一个
          if (this.nearbyPois.length > 0) {
            this.selectedPoi = this.nearbyPois[0]
          }
        } else {
          console.error('❌ POI搜索失败', status, result)
          
          // 如果附近没有POI，提示用户搜索或手动确认
          if (status === 'no_data') {
            this.nearbyPois = []
            
            // 创建一个自定义POI（当前位置）
            this.selectedPoi = {
              id: 'current-location',
              name: '当前位置',
              address: `经度: ${this.currentLng.toFixed(6)}, 纬度: ${this.currentLat.toFixed(6)}`,
              latitude: this.currentLat,
              longitude: this.currentLng,
              distance: 0
            }
            
            // 添加到列表
            this.nearbyPois.push(this.selectedPoi)
          }
        }
      })
    },

    // 搜索地点
    searchLocation() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({
          title: '请输入搜索关键词',
          icon: 'none'
        })
        return
      }

      console.log('搜索地点:', this.searchKeyword)

      const placeSearch = new AMap.PlaceSearch({
        city: '全国',
        pageSize: 20
      })

      placeSearch.search(this.searchKeyword, (status, result) => {
        if (status === 'complete' && result.poiList) {
          console.log('✅ 搜索成功', result.poiList.pois)
          
          this.nearbyPois = result.poiList.pois.map(poi => ({
            id: poi.id,
            name: poi.name,
            address: poi.address || poi.pname + poi.cityname + poi.adname,
            latitude: poi.location.lat,
            longitude: poi.location.lng,
            distance: 0
          }))

          // 移动地图到第一个结果
          if (this.nearbyPois.length > 0) {
            const firstPoi = this.nearbyPois[0]
            this.map.setCenter([firstPoi.longitude, firstPoi.latitude])
            this.currentLat = firstPoi.latitude
            this.currentLng = firstPoi.longitude
            this.marker.setPosition([firstPoi.longitude, firstPoi.latitude])
            this.selectedPoi = firstPoi
          }
        } else {
          uni.showToast({
            title: '未找到相关地点',
            icon: 'none'
          })
        }
      })
    },

    // 选择POI
    selectPoi(poi) {
      console.log('选择POI:', poi)
      this.selectedPoi = poi
      
      // 移动地图到该位置
      this.map.setCenter([poi.longitude, poi.latitude])
      this.currentLat = poi.latitude
      this.currentLng = poi.longitude
      this.marker.setPosition([poi.longitude, poi.latitude])
    },

    // 确认选择
    confirmLocation() {
      // 如果没有选中的POI，使用当前地图中心点
      const finalPoi = this.selectedPoi || {
        id: 'map-center',
        name: '地图中心位置',
        address: `经度: ${this.currentLng.toFixed(6)}, 纬度: ${this.currentLat.toFixed(6)}`,
        latitude: this.currentLat,
        longitude: this.currentLng
      }

      console.log('✅ 确认选择位置:', finalPoi)

      // 如果选择的是"当前位置"且没有具体地址，提示用户
      if (finalPoi.name === '当前位置' || finalPoi.name === '地图中心位置') {
        uni.showModal({
          title: '确认位置',
          content: `您选择的位置坐标为：\n经度: ${finalPoi.longitude.toFixed(4)}\n纬度: ${finalPoi.latitude.toFixed(4)}\n\n确认使用此位置吗？\n\n建议：可以搜索具体地点名称`,
          confirmText: '确认',
          cancelText: '重新选择',
          success: (res) => {
            if (res.confirm) {
              // 通过全局事件返回数据
              uni.$emit('selectLocation', {
                name: finalPoi.name,
                address: finalPoi.address,
                latitude: finalPoi.latitude,
                longitude: finalPoi.longitude
              })
              // 返回上一页
              uni.navigateBack()
            }
          }
        })
      } else {
        // 有具体地点名称，直接返回
        uni.$emit('selectLocation', {
          name: finalPoi.name,
          address: finalPoi.address,
          latitude: finalPoi.latitude,
          longitude: finalPoi.longitude
        })
        uni.navigateBack()
      }
    },

    // 取消
    cancel() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.map-picker-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* 地图容器 */
.map-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

#map-container {
  width: 100%;
  height: 100%;
}

/* 中心标记点 */
.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 10;
}

.marker-icon {
  font-size: 40px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

/* 搜索框 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
}

.search-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 18px;
  font-size: 14px;
  margin-right: 10px;
}

.search-btn {
  height: 36px;
  line-height: 36px;
  padding: 0 16px;
  border-radius: 18px;
}

/* 地点列表 */
.location-list {
  height: 280px;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e5e5e5;
}

.list-title {
  padding: 12px 15px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.list-scroll {
  flex: 1;
  overflow-y: auto;
}

.poi-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}

.poi-item:active {
  background: #f5f5f5;
}

.poi-item.selected {
  background: #e8f4ff;
}

.poi-main {
  flex: 1;
  min-width: 0;
}

.poi-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poi-address {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poi-distance {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
  flex-shrink: 0;
}

.empty-tip {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  color: #666;
  font-size: 15px;
  margin-bottom: 8px;
}

.empty-hint {
  color: #999;
  font-size: 13px;
}

/* 底部操作栏 */
.bottom-bar {
  display: flex;
  gap: 10px;
  padding: 12px 15px;
  background: #fff;
  border-top: 1px solid #e5e5e5;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.confirm-btn,
.cancel-btn {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 500;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: none;
}
</style>

