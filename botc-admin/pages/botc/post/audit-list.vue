<template>
  <view class="uni-container">
    <uni-card :is-shadow="false" is-full>
      <text class="uni-h6">帖子审核管理</text>
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
            <view class="uni-group">
              <button class="uni-button-small" type="primary" size="mini" 
                @click="viewDetail(item)">查看</button>
              <button v-if="item.status === 1" class="uni-button-small" 
                type="warn" size="mini" @click="hidePost(item)">隐藏</button>
              <button v-if="item.status === 3" class="uni-button-small" 
                type="primary" size="mini" @click="showPost(item)">显示</button>
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
        status: 1
      },
      tableData: [],
      loading: false,
      error: '',
      pageCurrent: 1,
      pageSize: 20,
      total: 0,
      statusTabs: [
        { value: 1, text: '正常' },
        { value: 2, text: '审核中' },
        { value: 3, text: '已隐藏' },
        { value: 0, text: '已删除' }
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
        
        // 查询帖子列表
        const res = await db.collection('botc-posts')
          .where(whereCondition)
          .orderBy('created_at', 'desc')
          .skip((this.pageCurrent - 1) * this.pageSize)
          .limit(this.pageSize)
          .get()
        
        // 获取所有发布者ID
        const userIds = [...new Set(res.result.data.map(item => item.user_id).filter(Boolean))]
        
        // 查询发布者信息
        let userMap = {}
        if (userIds.length > 0) {
          const userRes = await db.collection('uni-id-users')
            .where({
              _id: db.command.in(userIds)
            })
            .field({ _id: true, nickname: true })
            .get()
          
          userRes.result.data.forEach(user => {
            userMap[user._id] = user
          })
        }
        
        // 组合数据
        this.tableData = res.result.data.map(item => ({
          ...item,
          user_nickname: userMap[item.user_id]?.nickname || '-'
        }))
        
        const countRes = await db.collection('botc-posts')
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
        content: `确定删除此帖子吗？此操作不可恢复。`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.collection('botc-posts').doc(item._id).update({
                status: 0
              })
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

.uni-group {
  display: flex;
  gap: 5px;
  justify-content: center;
  flex-wrap: wrap;
}

.uni-button-small {
  margin: 2px;
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

