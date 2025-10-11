<template>
  <view class="uni-container">
    <uni-card :is-shadow="false" is-full>
      <text class="uni-h6">店铺认证审核</text>
    </uni-card>
    
    <view class="uni-container">
      <!-- 筛选条件 -->
      <view class="uni-stat--x flex">
        <view class="uni-stat__select">
          <uni-stat-tabs label="审核状态" type="box" mode="verify_status" 
            :current="where.verify_status" 
            @change="changeVerifyStatus" 
            :tabs="verifyStatusTabs" />
        </view>
        <view class="uni-stat__select">
          <uni-data-select v-model="where.city" :localdata="cityList" 
            placeholder="选择城市" clear @change="search" />
        </view>
      </view>
      
      <!-- 数据表格 -->
      <uni-table ref="table" :loading="loading" border stripe type="selection"
        @selection-change="selectionChange" :emptyText="error || '暂无数据'">
        <uni-tr>
          <uni-th align="center" width="50">序号</uni-th>
          <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'shop_name')">店铺名称</uni-th>
          <uni-th align="center">店主</uni-th>
          <uni-th align="center">城市</uni-th>
          <uni-th align="center">联系电话</uni-th>
          <uni-th align="center">审核状态</uni-th>
          <uni-th align="center">申请时间</uni-th>
          <uni-th align="center" width="200">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item, index) in tableData" :key="item._id">
          <uni-td align="center">{{ index + 1 }}</uni-td>
          <uni-td align="center">{{ item.shop_name }}</uni-td>
          <uni-td align="center">
            <view>{{ item.owner_nickname || '-' }}</view>
          </uni-td>
          <uni-td align="center">{{ item.city }}</uni-td>
          <uni-td align="center">{{ item.contact_phone }}</uni-td>
          <uni-td align="center">
            <uni-tag :text="getStatusText(item.verify_status)" 
              :type="getStatusType(item.verify_status)" />
          </uni-td>
          <uni-td align="center">{{ formatTime(item.created_at) }}</uni-td>
          <uni-td align="center">
            <view class="uni-group">
              <button class="uni-button-small" type="primary" size="mini" 
                @click="viewDetail(item)">查看</button>
              <button v-if="item.verify_status === 0" class="uni-button-small" 
                type="primary" size="mini" @click="approve(item)">通过</button>
              <button v-if="item.verify_status === 0" class="uni-button-small" 
                type="warn" size="mini" @click="reject(item)">拒绝</button>
            </view>
          </uni-td>
        </uni-tr>
      </uni-table>
      
      <!-- 分页 -->
      <view class="uni-pagination-box">
        <uni-pagination show-icon :page-size="pageSize" 
          :current="pageCurrent" :total="total" 
          @change="pageChange" />
      </view>
    </view>
    
    <!-- 详情弹窗 -->
    <uni-popup ref="detailPopup" type="center">
      <view class="popup-content" v-if="currentShop">
        <view class="popup-title">店铺详情</view>
        <scroll-view style="max-height: 60vh;" scroll-y>
          <view class="detail-item">
            <text class="label">店铺名称：</text>
            <text>{{ currentShop.shop_name }}</text>
          </view>
          <view class="detail-item">
            <text class="label">店铺Logo：</text>
            <image v-if="currentShop.shop_logo" :src="currentShop.shop_logo" 
              mode="aspectFit" style="width: 100px; height: 100px;" />
          </view>
          <view class="detail-item">
            <text class="label">店铺图片：</text>
            <view class="image-list">
              <image v-for="(img, idx) in currentShop.shop_images" :key="idx" 
                :src="img" mode="aspectFit" style="width: 80px; height: 80px; margin: 5px;" />
            </view>
          </view>
          <view class="detail-item">
            <text class="label">地址：</text>
            <text>{{ currentShop.province }} {{ currentShop.city }} {{ currentShop.district }} {{ currentShop.address }}</text>
          </view>
          <view class="detail-item">
            <text class="label">联系人：</text>
            <text>{{ currentShop.contact_person }}</text>
          </view>
          <view class="detail-item">
            <text class="label">联系电话：</text>
            <text>{{ currentShop.contact_phone }}</text>
          </view>
          <view class="detail-item">
            <text class="label">微信号：</text>
            <text>{{ currentShop.contact_wechat }}</text>
          </view>
          <view class="detail-item">
            <text class="label">营业时间：</text>
            <text>{{ currentShop.business_hours }}</text>
          </view>
          <view class="detail-item">
            <text class="label">桌数：</text>
            <text>{{ currentShop.table_count }}</text>
          </view>
          <view class="detail-item">
            <text class="label">人均消费：</text>
            <text>¥{{ currentShop.avg_price }}</text>
          </view>
          <view class="detail-item">
            <text class="label">设施：</text>
            <text>{{ (currentShop.facilities || []).join('、') }}</text>
          </view>
          <view class="detail-item">
            <text class="label">店铺介绍：</text>
            <text>{{ currentShop.description }}</text>
          </view>
          <view class="detail-item">
            <text class="label">营业执照：</text>
            <image v-if="currentShop.license_image" :src="currentShop.license_image" 
              mode="aspectFit" style="width: 200px; height: 150px;" />
          </view>
        </scroll-view>
        <view class="popup-buttons">
          <button size="mini" @click="closePopup">关闭</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 拒绝弹窗 -->
    <uni-popup ref="rejectPopup" type="center">
      <view class="popup-content">
        <view class="popup-title">拒绝原因</view>
        <textarea v-model="rejectReason" placeholder="请输入拒绝原因" 
          style="width: 100%; height: 100px; border: 1px solid #ddd; padding: 10px;" />
        <view class="popup-buttons">
          <button size="mini" @click="closeRejectPopup">取消</button>
          <button size="mini" type="warn" @click="confirmReject">确认拒绝</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command

export default {
  data() {
    return {
      where: {
        verify_status: 0
      },
      tableData: [],
      selectedRows: [],
      loading: false,
      error: '',
      pageCurrent: 1,
      pageSize: 20,
      total: 0,
      verifyStatusTabs: [
        { value: 0, text: '待审核' },
        { value: 1, text: '已通过' },
        { value: 2, text: '已拒绝' }
      ],
      cityList: [
        { value: '', text: '全部城市' },
        { value: '北京市', text: '北京市' },
        { value: '上海市', text: '上海市' },
        { value: '广州市', text: '广州市' },
        { value: '深圳市', text: '深圳市' },
        { value: '成都市', text: '成都市' },
        { value: '杭州市', text: '杭州市' }
      ],
      currentShop: null,
      rejectReason: '',
      rejectShopId: ''
    }
  },
  
  onLoad() {
    this.getList()
  },
  
  methods: {
    async getList() {
      this.loading = true
      this.error = ''
      
      try {
        const whereCondition = {}
        if (this.where.verify_status !== undefined && this.where.verify_status !== '') {
          whereCondition.verify_status = this.where.verify_status
        }
        if (this.where.city) {
          whereCondition.city = this.where.city
        }
        if (this.where.shop_name) {
          whereCondition.shop_name = new RegExp(this.where.shop_name, 'i')
        }
        
        // 查询店铺列表
        const res = await db.collection('botc-shops')
          .where(whereCondition)
          .orderBy('created_at', 'desc')
          .skip((this.pageCurrent - 1) * this.pageSize)
          .limit(this.pageSize)
          .get()
        
        // 获取所有店主ID
        const ownerIds = [...new Set(res.result.data.map(item => item.owner_id).filter(Boolean))]
        
        // 查询店主信息
        let ownerMap = {}
        if (ownerIds.length > 0) {
          const userRes = await db.collection('uni-id-users')
            .where({
              _id: db.command.in(ownerIds)
            })
            .field({ _id: true, nickname: true })
            .get()
          
          userRes.result.data.forEach(user => {
            ownerMap[user._id] = user
          })
        }
        
        // 组合数据
        this.tableData = res.result.data.map(item => ({
          ...item,
          owner_nickname: ownerMap[item.owner_id]?.nickname || '-'
        }))
        
        const countRes = await db.collection('botc-shops')
          .where(whereCondition)
          .count()
        this.total = countRes.result.total
        
      } catch (e) {
        this.error = e.message
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    
    search() {
      this.pageCurrent = 1
      this.getList()
    },
    
    filterChange(e, field) {
      if (e && typeof e === 'object') {
        this.where[field] = e.value || e
      } else {
        this.where[field] = e
      }
      this.search()
    },
    
    changeVerifyStatus(index) {
      if (typeof index === 'number' && this.verifyStatusTabs[index]) {
        this.where.verify_status = this.verifyStatusTabs[index].value
      } else {
        this.where.verify_status = index
      }
      this.search()
    },
    
    pageChange(e) {
      this.pageCurrent = e.current
      this.getList()
    },
    
    selectionChange(e) {
      this.selectedRows = e.detail.value
    },
    
    viewDetail(item) {
      this.currentShop = item
      this.$refs.detailPopup.open()
    },
    
    closePopup() {
      this.$refs.detailPopup.close()
    },
    
    async approve(item) {
      uni.showModal({
        title: '确认操作',
        content: `确定通过店铺"${item.shop_name}"的认证申请吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.collection('botc-shops').doc(item._id).update({
                verify_status: 1,
                verify_time: Date.now()
              })
              uni.showToast({ title: '审核通过', icon: 'success' })
              this.getList()
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
              console.error(e)
            }
          }
        }
      })
    },
    
    reject(item) {
      this.rejectShopId = item._id
      this.rejectReason = ''
      this.$refs.rejectPopup.open()
    },
    
    closeRejectPopup() {
      this.$refs.rejectPopup.close()
    },
    
    async confirmReject() {
      if (!this.rejectReason) {
        uni.showToast({ title: '请输入拒绝原因', icon: 'none' })
        return
      }
      
      try {
        await db.collection('botc-shops').doc(this.rejectShopId).update({
          verify_status: 2,
          reject_reason: this.rejectReason,
          verify_time: Date.now()
        })
        uni.showToast({ title: '已拒绝', icon: 'success' })
        this.closeRejectPopup()
        this.getList()
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
        console.error(e)
      }
    },
    
    getStatusText(status) {
      const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
      return map[status] || '未知'
    },
    
    getStatusType(status) {
      const map = { 0: 'warning', 1: 'success', 2: 'error' }
      return map[status] || 'default'
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.uni-container {
  padding: 15px;
}

.uni-stat--x {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.uni-stat__select {
  flex: 1;
}

.uni-group {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.uni-button-small {
  margin: 0 2px;
}

.uni-pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}

.popup-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #666;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
}

.popup-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
</style>

