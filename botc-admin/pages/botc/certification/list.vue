<template>
  <view class="container">
    <uni-card>
      <text class="uni-card-title">说书人认证管理</text>
      
      <!-- 筛选栏 -->
      <view class="filter-bar">
        <uni-data-select
          v-model="queryParams.status"
          :localdata="statusOptions"
          placeholder="筛选状态"
          @change="onStatusChange"
          style="width: 200px; margin-right: 10px;"
        ></uni-data-select>
        
        <button type="primary" size="mini" @click="loadData">刷新</button>
      </view>
      
      <!-- 统计信息 -->
      <view class="stats">
        <text>待审核: {{ pendingCount }}</text>
        <text style="margin-left: 20px;">已通过: {{ approvedCount }}</text>
        <text style="margin-left: 20px;">已拒绝: {{ rejectedCount }}</text>
      </view>
      
      <!-- 认证列表 -->
      <uni-table :loading="loading" border stripe emptyText="暂无数据">
        <uni-tr>
          <uni-th width="100">申请时间</uni-th>
          <uni-th width="80">用户昵称</uni-th>
          <uni-th width="100">手机号</uni-th>
          <uni-th width="60">级别</uni-th>
          <uni-th width="100">证明材料</uni-th>
          <uni-th width="150">申请说明</uni-th>
          <uni-th width="80">状态</uni-th>
          <uni-th width="150">拒绝原因</uni-th>
          <uni-th width="150">操作</uni-th>
        </uni-tr>
        
        <uni-tr v-for="item in dataList" :key="item._id">
          <uni-td>
            <view class="text-ellipsis">{{ formatTime(item.created_at) }}</view>
          </uni-td>
          <uni-td>{{ item.user_nickname || '-' }}</uni-td>
          <uni-td>{{ item.user_mobile || '-' }}</uni-td>
          <uni-td>
            <uni-tag :text="getLevelText(item.level)" :type="item.level === 2 ? 'warning' : 'primary'" size="mini"></uni-tag>
          </uni-td>
          <uni-td>
            <view class="images-preview">
              <image
                v-for="(img, idx) in item.images"
                :key="idx"
                :src="img"
                mode="aspectFill"
                @click="previewImage(item.images, idx)"
                class="preview-img"
              ></image>
            </view>
          </uni-td>
          <uni-td>
            <view class="text-multiline">{{ item.description || '-' }}</view>
          </uni-td>
          <uni-td>
            <uni-tag
              :text="getStatusText(item.status)"
              :type="getStatusType(item.status)"
              size="mini"
            ></uni-tag>
          </uni-td>
          <uni-td>
            <view class="text-multiline">{{ item.reject_reason || '-' }}</view>
          </uni-td>
          <uni-td>
            <view class="action-buttons">
              <button
                v-if="item.status === 'pending'"
                type="primary"
                size="mini"
                @click="handleApprove(item)"
              >
                通过
              </button>
              <button
                v-if="item.status === 'pending'"
                type="warn"
                size="mini"
                @click="handleReject(item)"
                style="margin-left: 5px;"
              >
                拒绝
              </button>
              <button
                v-if="item.status !== 'pending'"
                type="default"
                size="mini"
                @click="viewDetail(item)"
              >
                查看
              </button>
            </view>
          </uni-td>
        </uni-tr>
      </uni-table>
      
      <!-- 分页 -->
      <view class="pagination">
        <uni-pagination
          :current="pagination.current"
          :total="pagination.total"
          :pageSize="pagination.pageSize"
          @change="onPageChange"
        />
      </view>
    </uni-card>
    
    <!-- 拒绝弹窗 -->
    <uni-popup ref="rejectPopup" type="dialog">
      <uni-popup-dialog
        mode="input"
        title="拒绝原因"
        placeholder="请输入拒绝原因"
        :value="rejectReason"
        @confirm="confirmReject"
        @close="closeReject"
      >
      </uni-popup-dialog>
    </uni-popup>
    
    <!-- 详情弹窗 -->
    <uni-popup ref="detailPopup" type="center">
      <view class="detail-popup">
        <view class="detail-title">认证详情</view>
        <view class="detail-content" v-if="currentItem">
          <view class="detail-row">
            <text class="detail-label">用户昵称：</text>
            <text>{{ currentItem.user_nickname }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">手机号：</text>
            <text>{{ currentItem.user_mobile }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">认证级别：</text>
            <text>{{ getLevelText(currentItem.level) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">申请时间：</text>
            <text>{{ formatTime(currentItem.created_at) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">申请说明：</text>
            <text>{{ currentItem.description || '-' }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">状态：</text>
            <uni-tag
              :text="getStatusText(currentItem.status)"
              :type="getStatusType(currentItem.status)"
              size="mini"
            ></uni-tag>
          </view>
          <view class="detail-row" v-if="currentItem.reject_reason">
            <text class="detail-label">拒绝原因：</text>
            <text>{{ currentItem.reject_reason }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">证明材料：</text>
          </view>
          <view class="detail-images">
            <image
              v-for="(img, idx) in currentItem.images"
              :key="idx"
              :src="img"
              mode="aspectFill"
              @click="previewImage(currentItem.images, idx)"
              class="detail-img"
            ></image>
          </view>
        </view>
        <view class="detail-footer">
          <button type="default" size="mini" @click="closeDetail">关闭</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  data() {
    return {
      adminObj: null, // Admin云对象实例
      loading: false,
      dataList: [],
      queryParams: {
        status: '' // 空字符串表示全部
      },
      pagination: {
        current: 1,
        total: 0,
        pageSize: 20
      },
      statusOptions: [
        { value: '', text: '全部' },
        { value: 'pending', text: '待审核' },
        { value: 'approved', text: '已通过' },
        { value: 'rejected', text: '已拒绝' }
      ],
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      currentItem: null,
      rejectReason: '',
      rejectingItem: null
    }
  },
  
  onLoad() {
    // 初始化云对象
    this.adminObj = uniCloud.importObject('admin', { customUI: true })
    this.loadData()
    this.loadStats()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      try {
        const result = await this.adminObj.getCertifications({
          pageNo: this.pagination.current,
          pageSize: this.pagination.pageSize,
          status: this.queryParams.status || undefined
        })
        
        if (result.code === 0) {
          this.dataList = result.data.list
          this.pagination.total = result.data.total
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载数据失败：', error)
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    async loadStats() {
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          this.adminObj.getCertifications({ pageNo: 1, pageSize: 1, status: 'pending' }),
          this.adminObj.getCertifications({ pageNo: 1, pageSize: 1, status: 'approved' }),
          this.adminObj.getCertifications({ pageNo: 1, pageSize: 1, status: 'rejected' })
        ])
        
        this.pendingCount = pendingRes.data?.total || 0
        this.approvedCount = approvedRes.data?.total || 0
        this.rejectedCount = rejectedRes.data?.total || 0
      } catch (error) {
        console.error('加载统计失败：', error)
      }
    },
    
    onStatusChange() {
      this.pagination.current = 1
      this.loadData()
    },
    
    onPageChange(e) {
      this.pagination.current = e.current
      this.loadData()
    },
    
    handleApprove(item) {
      uni.showModal({
        title: '确认通过',
        content: `确认通过用户 ${item.user_nickname} 的${this.getLevelText(item.level)}认证申请？`,
        success: async (res) => {
          if (res.confirm) {
            await this.approveItem(item._id)
          }
        }
      })
    },
    
    async approveItem(certId) {
      uni.showLoading({ title: '处理中...' })
      try {
        const result = await this.adminObj.approveCertification(certId)
        
        if (result.code === 0) {
          uni.showToast({
            title: '审核通过',
            icon: 'success'
          })
          this.loadData()
          this.loadStats()
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('审核失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    handleReject(item) {
      this.rejectingItem = item
      this.rejectReason = ''
      this.$refs.rejectPopup.open()
    },
    
    confirmReject(value) {
      if (!value) {
        uni.showToast({
          title: '请输入拒绝原因',
          icon: 'none'
        })
        return
      }
      this.rejectItem(this.rejectingItem._id, value)
      this.$refs.rejectPopup.close()
    },
    
    closeReject() {
      this.rejectingItem = null
      this.rejectReason = ''
    },
    
    async rejectItem(certId, reason) {
      uni.showLoading({ title: '处理中...' })
      try {
        const result = await this.adminObj.rejectCertification(certId, reason)
        
        if (result.code === 0) {
          uni.showToast({
            title: '已拒绝',
            icon: 'success'
          })
          this.loadData()
          this.loadStats()
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('拒绝失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    viewDetail(item) {
      this.currentItem = item
      this.$refs.detailPopup.open()
    },
    
    closeDetail() {
      this.$refs.detailPopup.close()
      this.currentItem = null
    },
    
    previewImage(images, current) {
      uni.previewImage({
        urls: images,
        current
      })
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    
    getLevelText(level) {
      return level === 1 ? '⭐ 一星' : '⭐⭐ 二星'
    },
    
    getStatusText(status) {
      const map = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
      }
      return map[status] || status
    },
    
    getStatusType(status) {
      const map = {
        pending: 'warning',
        approved: 'success',
        rejected: 'error'
      }
      return map[status] || 'default'
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
}

.uni-card-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.stats {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-multiline {
  word-break: break-all;
  line-height: 1.5;
  max-width: 150px;
}

.images-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.preview-img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 详情弹窗样式 */
.detail-popup {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.detail-content {
  margin-bottom: 20px;
}

.detail-row {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.detail-label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 80px;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.detail-img {
  width: 150px;
  height: 150px;
  border-radius: 4px;
  cursor: pointer;
}

.detail-footer {
  text-align: center;
}
</style>

