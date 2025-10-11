<template>
  <view class="uni-container">
    <uni-card :is-shadow="false" is-full>
      <text class="uni-h6">拼车管理</text>
    </uni-card>
    
    <view class="uni-container">
      <!-- 筛选条件 -->
      <view class="uni-stat--x flex">
        <view class="uni-stat__select">
          <uni-stat-tabs label="状态" type="box" mode="status" 
            :current="where.status" 
            @change="changeStatus" 
            :tabs="statusTabs" />
        </view>
      </view>
      
      <!-- 数据表格 -->
      <uni-table ref="table" :loading="loading" border stripe 
        :emptyText="error || '暂无数据'">
        <uni-tr>
          <uni-th align="center" width="50">序号</uni-th>
          <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'title')">标题</uni-th>
          <uni-th align="center">发起人</uni-th>
          <uni-th align="center">游戏时间</uni-th>
          <uni-th align="center">地点</uni-th>
          <uni-th align="center">人数</uni-th>
          <uni-th align="center">状态</uni-th>
          <uni-th align="center" width="200">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item, index) in tableData" :key="item._id">
          <uni-td align="center">{{ index + 1 }}</uni-td>
          <uni-td align="center">{{ item.title }}</uni-td>
          <uni-td align="center">
            <view>{{ item.host_nickname || '-' }}</view>
          </uni-td>
          <uni-td align="center">{{ formatTime(item.game_time) }}</uni-td>
          <uni-td align="center">{{ item.location }}</uni-td>
          <uni-td align="center">{{ item.current_players }}/{{ item.max_players }}</uni-td>
          <uni-td align="center">
            <uni-tag :text="getStatusText(item.status)" 
              :type="getStatusType(item.status)" />
          </uni-td>
          <uni-td align="center">
            <view class="uni-group">
              <button class="uni-button-small" type="primary" size="mini" 
                @click="viewDetail(item)">查看</button>
              <button class="uni-button-small" type="warn" size="mini" 
                @click="deleteItem(item)">删除</button>
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
      <view class="popup-content" v-if="currentItem">
        <view class="popup-title">拼车详情</view>
        <scroll-view style="max-height: 60vh;" scroll-y>
          <view class="detail-item">
            <text class="label">标题：</text>
            <text>{{ currentItem.title }}</text>
          </view>
          <view class="detail-item">
            <text class="label">发起人：</text>
            <text>{{ currentItem.host_nickname || '-' }}</text>
          </view>
          <view class="detail-item">
            <text class="label">游戏时间：</text>
            <text>{{ formatTime(currentItem.game_time) }}</text>
          </view>
          <view class="detail-item">
            <text class="label">地点：</text>
            <text>{{ currentItem.location }}</text>
          </view>
          <view class="detail-item" v-if="currentItem.location_detail">
            <text class="label">地点详情：</text>
            <text>{{ currentItem.location_detail }}</text>
          </view>
          <view class="detail-item">
            <text class="label">人数：</text>
            <text>{{ currentItem.current_players }}/{{ currentItem.max_players }}</text>
          </view>
          <view class="detail-item" v-if="currentItem.description">
            <text class="label">说明：</text>
            <text>{{ currentItem.description }}</text>
          </view>
          <view class="detail-item" v-if="currentItem.requirements">
            <text class="label">要求：</text>
            <text>{{ currentItem.requirements }}</text>
          </view>
          <view class="detail-item">
            <text class="label">联系方式：</text>
            <text>{{ currentItem.contact_wechat || currentItem.contact_phone }}</text>
          </view>
          <view class="detail-item">
            <text class="label">创建时间：</text>
            <text>{{ formatTime(currentItem.created_at) }}</text>
          </view>
        </scroll-view>
        <view class="popup-buttons">
          <button size="mini" @click="closePopup">关闭</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      where: {
        status: ''
      },
      tableData: [],
      loading: false,
      error: '',
      pageCurrent: 1,
      pageSize: 20,
      total: 0,
      statusTabs: [
        { value: '', text: '全部' },
        { value: 0, text: '已取消' },
        { value: 1, text: '招募中' },
        { value: 2, text: '已满员' },
        { value: 3, text: '已确认' },
        { value: 4, text: '已结束' }
      ],
      currentItem: null
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
        if (this.where.status !== undefined && this.where.status !== '') {
          whereCondition.status = this.where.status
        }
        if (this.where.title) {
          whereCondition.title = new RegExp(this.where.title, 'i')
        }
        
        // 查询拼车列表
        const res = await db.collection('botc-carpool-rooms')
          .where(whereCondition)
          .orderBy('created_at', 'desc')
          .skip((this.pageCurrent - 1) * this.pageSize)
          .limit(this.pageSize)
          .get()
        
        // 获取所有发起人ID
        const hostIds = [...new Set(res.result.data.map(item => item.host_id).filter(Boolean))]
        
        // 查询发起人信息
        let hostMap = {}
        if (hostIds.length > 0) {
          const userRes = await db.collection('uni-id-users')
            .where({
              _id: db.command.in(hostIds)
            })
            .field({ _id: true, nickname: true })
            .get()
          
          userRes.result.data.forEach(user => {
            hostMap[user._id] = user
          })
        }
        
        // 组合数据
        this.tableData = res.result.data.map(item => ({
          ...item,
          host_nickname: hostMap[item.host_id]?.nickname || '-'
        }))
        
        const countRes = await db.collection('botc-carpool-rooms')
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
    
    changeStatus(index) {
      if (typeof index === 'number' && this.statusTabs[index]) {
        this.where.status = this.statusTabs[index].value
      } else {
        this.where.status = index
      }
      this.search()
    },
    
    pageChange(e) {
      this.pageCurrent = e.current
      this.getList()
    },
    
    viewDetail(item) {
      this.currentItem = item
      this.$refs.detailPopup.open()
    },
    
    closePopup() {
      this.$refs.detailPopup.close()
    },
    
    deleteItem(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除拼车"${item.title}"吗？此操作不可恢复。`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.collection('botc-carpool-rooms').doc(item._id).remove()
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.getList()
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'none' })
              console.error(e)
            }
          }
        }
      })
    },
    
    getStatusText(status) {
      const map = { 0: '已取消', 1: '招募中', 2: '已满员', 3: '已确认', 4: '已结束' }
      return map[status] || '未知'
    },
    
    getStatusType(status) {
      const map = { 0: 'error', 1: 'primary', 2: 'warning', 3: 'success', 4: 'default' }
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

.popup-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
</style>

