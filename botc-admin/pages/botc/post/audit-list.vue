<template>
  <view class="uni-container">
    <uni-card :is-shadow="false" is-full>
      <text class="uni-h6">帖子审核管理</text>
    </uni-card>
    
    <view class="uni-container">
      <!-- 筛选条件 -->
      <view class="filter-section">
        <!-- 筛选条件行 -->
        <view class="filter-row">
          <!-- 状态筛选 -->
          <view class="filter-item">
            <text class="filter-label">状态：</text>
            <uni-data-select
              v-model="where.status"
              :localdata="statusOptions"
              placeholder="请选择状态"
              @change="onStatusChange"
              :clear="false"
              style="flex: 1; min-width: 150px;"
            ></uni-data-select>
          </view>
          
          <!-- 时间筛选 -->
          <view class="filter-item">
            <text class="filter-label">发布时间：</text>
            <view class="date-range">
              <uni-datetime-picker 
                v-model="where.startDate" 
                type="date"
                placeholder="开始日期"
                @change="onDateChange"
                :clear-icon="true"
              />
              <text style="margin: 0 10px;">至</text>
              <uni-datetime-picker 
                v-model="where.endDate" 
                type="date"
                placeholder="结束日期"
                @change="onDateChange"
                :clear-icon="true"
              />
            </view>
          </view>
        </view>
        
        <view class="filter-row">
          <!-- 玩家筛选 -->
          <view class="filter-item">
            <text class="filter-label">发布者：</text>
            <input 
              v-model="where.userKeyword" 
              placeholder="输入用户昵称或ID搜索"
              class="search-input"
              @confirm="search"
            />
          </view>
          
          <!-- 操作按钮 -->
          <view class="filter-buttons">
            <button type="primary" size="mini" @click="search">搜索</button>
            <button type="default" size="mini" @click="resetFilter">重置</button>
          </view>
        </view>
      </view>
      
      <!-- 数据表格 -->
      <uni-table ref="table" :loading="loading" border stripe 
        :emptyText="error || '暂无数据'">
        <uni-tr>
          <uni-th align="center" width="50">序号</uni-th>
          <uni-th align="center">内容</uni-th>
          <uni-th align="center">发布者</uni-th>
          <uni-th align="center">点赞数</uni-th>
          <uni-th align="center">评论数</uni-th>
          <uni-th align="center">状态</uni-th>
          <uni-th align="center">发布时间</uni-th>
          <uni-th align="center" width="200">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item, index) in tableData" :key="item._id">
          <uni-td align="center">{{ index + 1 }}</uni-td>
          <uni-td align="center">
            <view class="content-preview">{{ item.content }}</view>
          </uni-td>
          <uni-td align="center">
            <view>{{ item.user_nickname || '-' }}</view>
          </uni-td>
          <uni-td align="center">{{ item.like_count || 0 }}</uni-td>
          <uni-td align="center">{{ item.comment_count || 0 }}</uni-td>
          <uni-td align="center">
            <uni-tag :text="getStatusText(item.status)" 
              :type="getStatusType(item.status)" />
          </uni-td>
          <uni-td align="center">{{ formatTime(item.created_at) }}</uni-td>
          <uni-td align="center">
            <view class="action-buttons">
              <button class="action-btn action-btn-primary" @click="viewDetail(item)">查看</button>
              <button v-if="item.status === 1" class="action-btn action-btn-warning" @click="hidePost(item)">隐藏</button>
              <button v-if="item.status === 3" class="action-btn action-btn-primary" @click="showPost(item)">显示</button>
              <button v-if="item.status !== 0" class="action-btn action-btn-danger" @click="deleteItem(item)">删除</button>
              <button v-if="item.status === 0" class="action-btn action-btn-danger" @click="permanentDelete(item)">彻底删除</button>
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
        <view class="popup-title">帖子详情</view>
        <scroll-view style="max-height: 60vh;" scroll-y>
          <view class="detail-item">
            <text class="label">发布者：</text>
            <text>{{ currentItem.user_nickname || '-' }}</text>
          </view>
          <view class="detail-item">
            <text class="label">内容：</text>
            <text>{{ currentItem.content }}</text>
          </view>
          <view class="detail-item" v-if="currentItem.images && currentItem.images.length">
            <text class="label">图片：</text>
            <view class="image-list">
              <image v-for="(img, idx) in currentItem.images" :key="idx" 
                :src="img" mode="aspectFit" style="width: 100px; height: 100px; margin: 5px;" />
            </view>
          </view>
          <view class="detail-item" v-if="currentItem.location">
            <text class="label">地点：</text>
            <text>{{ currentItem.location }}</text>
          </view>
          <view class="detail-item">
            <text class="label">点赞数：</text>
            <text>{{ currentItem.like_count || 0 }}</text>
          </view>
          <view class="detail-item">
            <text class="label">评论数：</text>
            <text>{{ currentItem.comment_count || 0 }}</text>
          </view>
          <view class="detail-item">
            <text class="label">浏览数：</text>
            <text>{{ currentItem.view_count || 0 }}</text>
          </view>
          <view class="detail-item">
            <text class="label">发布时间：</text>
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
        status: '', // 默认为空，显示所有状态
        startDate: '',
        endDate: '',
        userKeyword: ''
      },
      tableData: [],
      loading: false,
      error: '',
      pageCurrent: 1,
      pageSize: 20,
      total: 0,
      statusOptions: [
        { value: '', text: '全部' },
        { value: 1, text: '正常' },
        { value: 2, text: '审核中' },
        { value: 3, text: '已隐藏' },
        { value: 0, text: '已删除' }
      ],
      currentItem: null,
      userMap: {} // 缓存用户信息
    }
  },
  
  onLoad() {
    // 延迟一点执行，确保页面完全加载
    this.$nextTick(() => {
      this.getList()
    })
  },
  
  onShow() {
    // 每次显示页面时刷新数据
    if (this.tableData.length > 0) {
      this.getList()
    }
  },
  
  methods: {
    async getList() {
      this.loading = true
      this.error = ''
      
      try {
        console.log('=== 开始查询帖子列表 ===')
        console.log('筛选条件:', this.where)
        
        // 构建查询条件
        const whereCondition = {}
        const dbCmd = db.command
        
        // 状态筛选
        if (this.where.status !== undefined && this.where.status !== null && this.where.status !== '') {
          whereCondition.status = this.where.status
          console.log('✓ 添加状态筛选:', this.where.status)
        } else {
          console.log('✓ 不限制状态（查询所有）')
        }
        
        // 时间范围筛选
        if (this.where.startDate || this.where.endDate) {
          whereCondition.created_at = {}
          if (this.where.startDate) {
            const startTime = new Date(this.where.startDate).getTime()
            whereCondition.created_at = dbCmd.gte(startTime)
            console.log('✓ 添加开始时间:', this.where.startDate)
          }
          if (this.where.endDate) {
            const endTime = new Date(this.where.endDate + ' 23:59:59').getTime()
            if (whereCondition.created_at.gte) {
              whereCondition.created_at = dbCmd.and([
                dbCmd.gte(new Date(this.where.startDate).getTime()),
                dbCmd.lte(endTime)
              ])
            } else {
              whereCondition.created_at = dbCmd.lte(endTime)
            }
            console.log('✓ 添加结束时间:', this.where.endDate)
          }
        }
        
        console.log('最终查询条件:', whereCondition)
        
        // 如果有用户关键词筛选，先查询用户
        let userIds = []
        if (this.where.userKeyword && this.where.userKeyword.trim()) {
          const keyword = this.where.userKeyword.trim()
          console.log('搜索用户关键词:', keyword)
          
          // 同时支持昵称和ID搜索
          const userRes = await db.collection('uni-id-users')
            .where(dbCmd.or([
              { nickname: new RegExp(keyword, 'i') },
              { _id: keyword }
            ]))
            .field({ _id: true })
            .limit(100)
            .get()
          
          userIds = userRes.result.data.map(u => u._id)
          console.log('找到匹配用户:', userIds.length, '个')
          
          if (userIds.length === 0) {
            // 没有找到匹配的用户
            this.tableData = []
            this.total = 0
            this.loading = false
            return
          }
          
          whereCondition.user_id = dbCmd.in(userIds)
        }
        
        // 查询帖子列表
        const res = await db.collection('botc-posts')
          .where(whereCondition)
          .orderBy('created_at', 'desc')
          .skip((this.pageCurrent - 1) * this.pageSize)
          .limit(this.pageSize)
          .get()
        
        console.log('查询结果:', res.result.data.length, '条')
        
        // 获取所有发布者ID
        const allUserIds = [...new Set(res.result.data.map(item => item.user_id).filter(Boolean))]
        
        // 查询发布者信息
        if (allUserIds.length > 0) {
          const userRes = await db.collection('uni-id-users')
            .where({
              _id: dbCmd.in(allUserIds)
            })
            .field({ _id: true, nickname: true })
            .get()
          
          userRes.result.data.forEach(user => {
            this.userMap[user._id] = user
          })
        }
        
        // 组合数据
        this.tableData = res.result.data.map(item => ({
          ...item,
          user_nickname: this.userMap[item.user_id]?.nickname || '-',
          user_id_display: item.user_id
        }))
        
        console.log('数据组合完成，共', this.tableData.length, '条')
        
        // 查询总数
        const countRes = await db.collection('botc-posts')
          .where(whereCondition)
          .count()
        this.total = countRes.result.total
        
        console.log('总数:', this.total)
        
      } catch (e) {
        this.error = e.message
        console.error('查询失败:', e)
      } finally {
        this.loading = false
      }
    },
    
    search() {
      this.pageCurrent = 1
      this.getList()
    },
    
    resetFilter() {
      console.log('=== 重置筛选条件 ===')
      this.where = {
        status: '', // 重置为空，显示所有状态
        startDate: '',
        endDate: '',
        userKeyword: ''
      }
      this.pageCurrent = 1
      this.getList()
    },
    
    onDateChange() {
      // 时间选择器变化时自动搜索（可选）
      // this.search()
    },
    
    onStatusChange(value) {
      console.log('=== 状态选择变化 ===')
      console.log('选择的状态值:', value)
      // uni-data-select 会自动更新 v-model，所以这里只需要触发搜索
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
    
    async hidePost(item) {
      uni.showModal({
        title: '确认隐藏',
        content: `确定隐藏此帖子吗？用户将无法看到该帖子。是否同时发送警告消息？`,
        confirmText: '隐藏并警告',
        cancelText: '仅隐藏',
        showCancel: true,
        success: async (res) => {
          if (res.confirm || res.cancel) {
            try {
              // 隐藏帖子
              await db.collection('botc-posts').doc(item._id).update({
                status: 3
              })
              
              // 如果点击"隐藏并警告"，发送系统消息
              if (res.confirm) {
                const now = Date.now()
                console.log('=== 准备发送系统消息 [VERSION 2.0] ===')
                console.log('帖子完整信息:', item)
                console.log('目标用户ID:', item.user_id)
                console.log('用户ID类型:', typeof item.user_id)
                console.log('用户ID长度:', item.user_id ? item.user_id.length : 0)
                console.log('帖子ID:', item._id)
                console.log('帖子内容:', item.content.substring(0, 20))
                
                const messageData = {
                  user_id: item.user_id,
                  type: 'warning',
                  title: '内容违规警告',
                  content: `您发布的帖子"${item.content.substring(0, 20)}..."因违反社区规范已被隐藏。请遵守社区规则，避免发布违规内容。`,
                  related_type: 'post',
                  related_id: item._id,
                  is_read: false
                  // created_at 会由数据库默认值自动填充
                }
                
                console.log('>>> 即将通过云函数发送系统消息:')
                console.log('  userId:', messageData.user_id, '(类型:', typeof messageData.user_id, ')')
                console.log('  type:', messageData.type)
                console.log('  title:', messageData.title)
                console.log('  content:', messageData.content)
                
                try {
                  // 调用云函数发送系统消息（云函数有完全权限）
                  const cloudRes = await uniCloud.callFunction({
                    name: 'send-system-message',
                    data: {
                      userId: messageData.user_id,
                      type: messageData.type,
                      title: messageData.title,
                      content: messageData.content,
                      relatedType: messageData.related_type,
                      relatedId: messageData.related_id
                    }
                  })
                  
                  console.log('>>> 云函数调用结果:', cloudRes)
                  
                  if (cloudRes.result && cloudRes.result.code === 0) {
                    const messageId = cloudRes.result.data?.messageId
                    console.log('✅ 系统消息发送成功！')
                    console.log('  消息ID:', messageId)
                    console.log('  目标用户ID:', messageData.user_id)
                    
                  } else {
                    console.error('❌ 系统消息发送失败')
                    console.error('云函数返回:', cloudRes.result)
                  }
                } catch (error) {
                  console.error('❌ 调用云函数发送系统消息时出错:', error)
                  console.error('错误详情:', error.message)
                }
              }
              
              uni.showToast({ 
                title: res.confirm ? '已隐藏并发送警告' : '已隐藏', 
                icon: 'success' 
              })
              this.getList()
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
              console.error(e)
            }
          }
        }
      })
    },
    
    async showPost(item) {
      try {
        await db.collection('botc-posts').doc(item._id).update({
          status: 1
        })
        uni.showToast({ title: '已显示', icon: 'success' })
        this.getList()
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
        console.error(e)
      }
    },
    
    deleteItem(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定删除此帖子吗？删除后将移至"已删除"状态。`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.collection('botc-posts').doc(item._id).update({
                status: 0,
                deleted_at: Date.now()
              })
              uni.showToast({ title: '已删除', icon: 'success' })
              this.getList()
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'none' })
              console.error(e)
            }
          }
        }
      })
    },
    
    permanentDelete(item) {
      uni.showModal({
        title: '⚠️ 彻底删除',
        content: `此操作将永久删除该帖子及所有相关数据，无法恢复！确定要继续吗？`,
        confirmColor: '#FF0000',
        success: async (res) => {
          if (res.confirm) {
            try {
              console.log('=== 彻底删除帖子 ===')
              console.log('帖子ID:', item._id)
              console.log('帖子内容:', item.content.substring(0, 20))
              
              // 1. 删除帖子相关的评论
              const commentsRes = await db.collection('botc-post-comments')
                .where({ post_id: item._id })
                .remove()
              console.log('删除评论数:', commentsRes.deleted)
              
              // 2. 删除帖子相关的点赞记录
              const likesRes = await db.collection('botc-post-likes')
                .where({ post_id: item._id })
                .remove()
              console.log('删除点赞记录数:', likesRes.deleted)
              
              // 3. 删除帖子相关的收藏记录
              const favoritesRes = await db.collection('botc-favorites')
                .where({ 
                  target_type: 'post',
                  target_id: item._id 
                })
                .remove()
              console.log('删除收藏记录数:', favoritesRes.deleted)
              
              // 4. 删除帖子本身
              await db.collection('botc-posts').doc(item._id).remove()
              
              console.log('✅ 彻底删除成功')
              uni.showToast({ title: '彻底删除成功', icon: 'success' })
              this.getList()
            } catch (e) {
              console.error('彻底删除失败:', e)
              uni.showToast({ title: '删除失败: ' + e.message, icon: 'none' })
            }
          }
        }
      })
    },
    
    getStatusText(status) {
      const map = { 0: '已删除', 1: '正常', 2: '审核中', 3: '已隐藏' }
      return map[status] || '未知'
    },
    
    getStatusType(status) {
      const map = { 0: 'error', 1: 'success', 2: 'warning', 3: 'default' }
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

/* 筛选区域 */
.filter-section {
  background: #ffffff;
  padding: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 300px;
}

.filter-label {
  font-weight: 500;
  color: #333;
  min-width: 80px;
  font-size: 14px;
  white-space: nowrap;
}

.date-range {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 10px;
}

.search-input {
  flex: 1;
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #409eff;
  outline: none;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.uni-stat--x {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.uni-stat__select {
  flex: 1;
}

.content-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  padding: 8px 0;
}

.action-btn {
  min-width: 70px;
  height: 32px;
  line-height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.action-btn-primary {
  background: #409eff;
  color: white;
}

.action-btn-primary:hover {
  background: #66b1ff;
}

.action-btn-warning {
  background: #e6a23c;
  color: white;
}

.action-btn-warning:hover {
  background: #ebb563;
}

.action-btn-danger {
  background: #f56c6c;
  color: white;
}

.action-btn-danger:hover {
  background: #f78989;
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

