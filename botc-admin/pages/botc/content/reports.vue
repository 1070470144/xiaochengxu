<template>
  <view class="container">
    <uni-card>
      <text class="uni-card-title">举报管理</text>
      
      <!-- 统计信息 -->
      <view class="stats">
        <view class="stat-item">
          <text class="stat-label">待处理</text>
          <text class="stat-value pending">{{ stats.pending }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">处理中</text>
          <text class="stat-value processing">{{ stats.processing }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">已处理</text>
          <text class="stat-value resolved">{{ stats.resolved }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">已驳回</text>
          <text class="stat-value rejected">{{ stats.rejected }}</text>
        </view>
      </view>
      
      <!-- 筛选栏 -->
      <view class="filter-bar">
        <uni-data-select
          v-model="queryParams.status"
          :localdata="statusOptions"
          placeholder="状态筛选"
          @change="onFilterChange"
          style="width: 150px; margin-right: 10px;"
        ></uni-data-select>
        
        <uni-data-select
          v-model="queryParams.contentType"
          :localdata="contentTypeOptions"
          placeholder="内容类型"
          @change="onFilterChange"
          style="width: 150px; margin-right: 10px;"
        ></uni-data-select>
        
        <uni-data-select
          v-model="queryParams.reason"
          :localdata="reasonOptions"
          placeholder="举报原因"
          @change="onFilterChange"
          style="width: 150px; margin-right: 10px;"
        ></uni-data-select>
        
        <button type="primary" size="mini" @click="loadData">刷新</button>
      </view>
      
      <!-- 举报列表 -->
      <uni-table :loading="loading" border stripe emptyText="暂无数据">
        <uni-tr>
          <uni-th width="120">举报时间</uni-th>
          <uni-th width="100">举报人</uni-th>
          <uni-th width="100">被举报人</uni-th>
          <uni-th width="80">内容类型</uni-th>
          <uni-th width="200">内容摘要</uni-th>
          <uni-th width="100">举报原因</uni-th>
          <uni-th width="80">状态</uni-th>
          <uni-th width="100">处理结果</uni-th>
          <uni-th width="180">操作</uni-th>
        </uni-tr>
        
        <uni-tr v-for="item in dataList" :key="item._id">
          <uni-td>{{ formatTime(item.created_at) }}</uni-td>
          <uni-td>{{ item.reporter_nickname || '-' }}</uni-td>
          <uni-td>{{ item.reported_user_nickname || '-' }}</uni-td>
          <uni-td>
            <uni-tag :text="getContentTypeText(item.content_type)" type="primary" size="mini"></uni-tag>
          </uni-td>
          <uni-td>
            <text class="content-title">{{ item.content_title || '-' }}</text>
          </uni-td>
          <uni-td>
            <uni-tag :text="getReasonText(item.reason)" :type="getReasonColor(item.reason)" size="mini"></uni-tag>
          </uni-td>
          <uni-td>
            <uni-tag
              :text="getStatusText(item.status)"
              :type="getStatusType(item.status)"
              size="mini"
            ></uni-tag>
          </uni-td>
          <uni-td>
            <text v-if="item.handle_result">{{ getHandleResultText(item.handle_result) }}</text>
            <text v-else>-</text>
          </uni-td>
          <uni-td>
            <view class="action-buttons">
              <button
                v-if="item.status === 'pending'"
                type="primary"
                size="mini"
                @click="handleReport(item)"
              >
                处理
              </button>
              <button
                v-if="item.status === 'pending'"
                type="warn"
                size="mini"
                @click="rejectReport(item)"
                style="margin-left: 5px;"
              >
                驳回
              </button>
              <button
                type="default"
                size="mini"
                @click="viewDetail(item)"
                :style="item.status === 'pending' ? 'margin-left: 5px;' : ''"
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
    
    <!-- 处理弹窗 -->
    <uni-popup ref="handlePopup" type="center">
      <view class="handle-popup">
        <view class="handle-title">处理举报</view>
        <view class="handle-content" v-if="currentReport">
          <view class="info-row">
            <text class="info-label">举报人：</text>
            <text>{{ currentReport.reporter_nickname }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">被举报人：</text>
            <text>{{ currentReport.reported_user_nickname }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">内容类型：</text>
            <text>{{ getContentTypeText(currentReport.content_type) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">举报原因：</text>
            <text>{{ getReasonText(currentReport.reason) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">详细描述：</text>
            <text>{{ currentReport.description || '-' }}</text>
          </view>
          
          <view class="handle-form">
            <view class="form-item">
              <text class="form-label">处理结果：</text>
              <uni-data-select
                v-model="handleForm.handleResult"
                :localdata="handleResultOptions"
                placeholder="请选择处理结果"
              ></uni-data-select>
            </view>
            <view class="form-item">
              <text class="form-label">处理备注：</text>
              <textarea
                v-model="handleForm.handleRemark"
                placeholder="请输入处理备注"
                maxlength="500"
                class="handle-textarea"
              ></textarea>
            </view>
          </view>
        </view>
        <view class="handle-footer">
          <button type="default" size="mini" @click="closeHandlePopup">取消</button>
          <button type="primary" size="mini" @click="submitHandle" style="margin-left: 10px;">确定</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 详情弹窗 -->
    <uni-popup ref="detailPopup" type="center">
      <view class="detail-popup">
        <view class="detail-title">举报详情</view>
        <view class="detail-content" v-if="currentReport">
          <view class="detail-row">
            <text class="detail-label">举报时间：</text>
            <text>{{ formatTime(currentReport.created_at) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">举报人：</text>
            <text>{{ currentReport.reporter_nickname }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">被举报人：</text>
            <text>{{ currentReport.reported_user_nickname }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">内容类型：</text>
            <text>{{ getContentTypeText(currentReport.content_type) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">内容摘要：</text>
            <text>{{ currentReport.content_title || '-' }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">举报原因：</text>
            <text>{{ getReasonText(currentReport.reason) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">详细描述：</text>
            <text>{{ currentReport.description || '-' }}</text>
          </view>
          <view class="detail-row" v-if="currentReport.images && currentReport.images.length > 0">
            <text class="detail-label">举报截图：</text>
            <view class="detail-images">
              <image
                v-for="(img, idx) in currentReport.images"
                :key="idx"
                :src="img"
                mode="aspectFill"
                @click="previewImage(currentReport.images, idx)"
                class="detail-img"
              ></image>
            </view>
          </view>
          <view class="detail-row">
            <text class="detail-label">状态：</text>
            <uni-tag
              :text="getStatusText(currentReport.status)"
              :type="getStatusType(currentReport.status)"
              size="mini"
            ></uni-tag>
          </view>
          <view class="detail-row" v-if="currentReport.handle_result">
            <text class="detail-label">处理结果：</text>
            <text>{{ getHandleResultText(currentReport.handle_result) }}</text>
          </view>
          <view class="detail-row" v-if="currentReport.handle_remark">
            <text class="detail-label">处理备注：</text>
            <text>{{ currentReport.handle_remark }}</text>
          </view>
          <view class="detail-row" v-if="currentReport.handled_at">
            <text class="detail-label">处理时间：</text>
            <text>{{ formatTime(currentReport.handled_at) }}</text>
          </view>
        </view>
        <view class="detail-footer">
          <button type="default" size="mini" @click="closeDetailPopup">关闭</button>
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
        status: '',
        contentType: '',
        reason: ''
      },
      pagination: {
        current: 1,
        total: 0,
        pageSize: 20
      },
      stats: {
        pending: 0,
        processing: 0,
        resolved: 0,
        rejected: 0
      },
      statusOptions: [
        { value: '', text: '全部状态' },
        { value: 'pending', text: '待处理' },
        { value: 'processing', text: '处理中' },
        { value: 'resolved', text: '已处理' },
        { value: 'rejected', text: '已驳回' }
      ],
      contentTypeOptions: [
        { value: '', text: '全部类型' },
        { value: 'post', text: '帖子' },
        { value: 'comment', text: '评论' },
        { value: 'user', text: '用户' },
        { value: 'script', text: '剧本' },
        { value: 'review', text: '评价' }
      ],
      reasonOptions: [
        { value: '', text: '全部原因' },
        { value: 'spam', text: '垃圾广告' },
        { value: 'porn', text: '色情低俗' },
        { value: 'violence', text: '暴力血腥' },
        { value: 'politics', text: '政治敏感' },
        { value: 'illegal', text: '违法违规' },
        { value: 'abuse', text: '辱骂攻击' },
        { value: 'false', text: '虚假信息' },
        { value: 'other', text: '其他' }
      ],
      handleResultOptions: [
        { value: 'delete', text: '删除内容' },
        { value: 'warn', text: '警告用户' },
        { value: 'ban', text: '封禁用户' },
        { value: 'ignore', text: '忽略举报' }
      ],
      currentReport: null,
      handleForm: {
        handleResult: '',
        handleRemark: ''
      }
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
        const result = await this.adminObj.getReports({
          pageNo: this.pagination.current,
          pageSize: this.pagination.pageSize,
          status: this.queryParams.status || undefined,
          contentType: this.queryParams.contentType || undefined,
          reason: this.queryParams.reason || undefined
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
        const result = await this.adminObj.getReportStats()
        
        if (result.code === 0) {
          this.stats = result.data
        }
      } catch (error) {
        console.error('加载统计失败：', error)
      }
    },
    
    onFilterChange() {
      this.pagination.current = 1
      this.loadData()
    },
    
    onPageChange(e) {
      this.pagination.current = e.current
      this.loadData()
    },
    
    handleReport(item) {
      this.currentReport = item
      this.handleForm = {
        handleResult: '',
        handleRemark: ''
      }
      this.$refs.handlePopup.open()
    },
    
    async submitHandle() {
      if (!this.handleForm.handleResult) {
        uni.showToast({
          title: '请选择处理结果',
          icon: 'none'
        })
        return
      }
      
      uni.showLoading({ title: '处理中...' })
      try {
        const result = await this.adminObj.handleReport(
          this.currentReport._id,
          this.handleForm.handleResult,
          this.handleForm.handleRemark
        )
        
        if (result.code === 0) {
          uni.showToast({
            title: '处理成功',
            icon: 'success'
          })
          this.closeHandlePopup()
          this.loadData()
          this.loadStats()
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('处理失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    closeHandlePopup() {
      this.$refs.handlePopup.close()
    },
    
    rejectReport(item) {
      uni.showModal({
        title: '驳回举报',
        editable: true,
        placeholderText: '请输入驳回原因',
        success: async (res) => {
          if (res.confirm) {
            await this.submitReject(item._id, res.content)
          }
        }
      })
    },
    
    async submitReject(reportId, remark) {
      uni.showLoading({ title: '处理中...' })
      try {
        const result = await this.adminObj.rejectReport(reportId, remark)
        
        if (result.code === 0) {
          uni.showToast({
            title: '已驳回',
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
        console.error('操作失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    viewDetail(item) {
      this.currentReport = item
      this.$refs.detailPopup.open()
    },
    
    closeDetailPopup() {
      this.$refs.detailPopup.close()
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
    
    getContentTypeText(type) {
      const map = {
        post: '帖子',
        comment: '评论',
        user: '用户',
        script: '剧本',
        review: '评价'
      }
      return map[type] || type
    },
    
    getReasonText(reason) {
      const map = {
        spam: '垃圾广告',
        porn: '色情低俗',
        violence: '暴力血腥',
        politics: '政治敏感',
        illegal: '违法违规',
        abuse: '辱骂攻击',
        false: '虚假信息',
        other: '其他'
      }
      return map[reason] || reason
    },
    
    getReasonColor(reason) {
      const map = {
        spam: 'warning',
        porn: 'error',
        violence: 'error',
        politics: 'error',
        illegal: 'error',
        abuse: 'warning',
        false: 'warning',
        other: 'default'
      }
      return map[reason] || 'default'
    },
    
    getStatusText(status) {
      const map = {
        pending: '待处理',
        processing: '处理中',
        resolved: '已处理',
        rejected: '已驳回'
      }
      return map[status] || status
    },
    
    getStatusType(status) {
      const map = {
        pending: 'warning',
        processing: 'primary',
        resolved: 'success',
        rejected: 'error'
      }
      return map[status] || 'default'
    },
    
    getHandleResultText(result) {
      const map = {
        delete: '删除内容',
        warn: '警告用户',
        ban: '封禁用户',
        ignore: '忽略举报'
      }
      return map[result] || result
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

.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
}

.stat-value.pending {
  color: #e6a23c;
}

.stat-value.processing {
  color: #409eff;
}

.stat-value.resolved {
  color: #67c23a;
}

.stat-value.rejected {
  color: #f56c6c;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.content-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
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

/* 处理弹窗样式 */
.handle-popup {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.handle-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.handle-content {
  margin-bottom: 20px;
}

.info-row {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.info-label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 80px;
  color: #606266;
}

.handle-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.handle-textarea {
  width: 100%;
  height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
}

.handle-footer {
  text-align: center;
}

/* 详情弹窗样式 */
.detail-popup {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 700px;
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
  min-width: 100px;
  color: #606266;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.detail-img {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  cursor: pointer;
}

.detail-footer {
  text-align: center;
}
</style>

