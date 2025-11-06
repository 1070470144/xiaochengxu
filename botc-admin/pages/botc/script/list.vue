<template>
  <view class="uni-container">
    <view class="uni-header">
      <view class="uni-title">剧本管理</view>
      <view class="uni-header-actions">
        <button type="primary" size="mini" @click="goToAdd">+ 添加剧本</button>
        <button type="success" size="mini" @click="showBatchUpload" style="margin-left: 10px;">📁 批量导入JSON</button>
      </view>
    </view>

    <!-- 剧本预览弹窗 -->
    <uni-popup ref="previewPopup" type="dialog">
      <view class="preview-dialog">
        <view class="dialog-title">
          <text>剧本预览</text>
          <text class="close-btn" @click="closePreview">×</text>
        </view>
        <view class="dialog-content" v-if="previewData">
          <!-- 剧本图片展示 -->
          <view class="preview-section" v-if="hasImages">
            <view class="section-title">🖼️ 剧本图片</view>
            
            <!-- 自动生成的预览图 -->
            <view v-if="previewData.preview_image" class="image-display-section">
              <text class="image-label">📌 自动生成的预览图：</text>
              <image 
                class="preview-main-image" 
                :src="previewData.preview_image" 
                mode="widthFix"
                @click="viewImage(previewData.preview_image)"
              />
              <text class="image-hint">点击图片可放大查看</text>
            </view>
            
            <!-- 用户上传的图片 -->
            <view v-if="previewData.user_images && previewData.user_images.length > 0" class="image-display-section">
              <text class="image-label">📸 用户上传的图片（{{ previewData.user_images.length }}张）：</text>
              <view class="user-images-grid">
                <image 
                  v-for="(img, index) in previewData.user_images"
                  :key="index"
                  class="user-image-item" 
                  :src="img" 
                  mode="aspectFill"
                  @click="viewImage(img)"
                />
              </view>
              <text class="image-hint">点击图片可放大查看</text>
            </view>
            
            <!-- 兼容旧数据的封面图 -->
            <view v-if="previewData.cover_image && !previewData.preview_image && !hasUserImages" class="image-display-section">
              <text class="image-label">🖼️ 封面图：</text>
              <image 
                class="preview-main-image" 
                :src="previewData.cover_image" 
                mode="widthFix"
                @click="viewImage(previewData.cover_image)"
              />
            </view>
          </view>
          
          <!-- 基本信息 -->
          <view class="preview-section">
            <view class="section-title">📋 基本信息</view>
            <view class="info-grid">
              <view class="info-item">
                <text class="label">标题：</text>
                <text class="value">{{ previewData.title }}</text>
              </view>
              <view class="info-item">
                <text class="label">副标题：</text>
                <text class="value">{{ previewData.subtitle || '-' }}</text>
              </view>
              <view class="info-item">
                <text class="label">作者：</text>
                <text class="value">{{ previewData.author || '-' }}</text>
              </view>
              <view class="info-item">
                <text class="label">类型：</text>
                <text class="value">{{ getTypeText(previewData.script_type) }}</text>
              </view>
              <view class="info-item">
                <text class="label">难度：</text>
                <text class="value">{{ getDifficultyText(previewData.difficulty) }}</text>
              </view>
              <view class="info-item">
                <text class="label">人数：</text>
                <text class="value">{{ previewData.player_count || '-' }}</text>
              </view>
              <view class="info-item">
                <text class="label">时长：</text>
                <text class="value">{{ previewData.duration ? previewData.duration + '分钟' : '-' }}</text>
              </view>
              <view class="info-item">
                <text class="label">状态：</text>
                <text class="value">{{ getStatusText(previewData.status) }}</text>
              </view>
            </view>
          </view>
          
          <!-- 剧本描述 -->
          <view class="preview-section">
            <view class="section-title">📝 剧本描述</view>
            <view class="desc-content">{{ previewData.description || '暂无描述' }}</view>
          </view>
          
          <!-- 标签 -->
          <view class="preview-section" v-if="previewData.tags && previewData.tags.length > 0">
            <view class="section-title">🏷️ 标签</view>
            <view class="tag-list">
              <uni-tag v-for="tag in previewData.tags" :key="tag" :text="tag" size="small" />
            </view>
          </view>
          
          <!-- JSON数据预览 -->
          <view class="preview-section" v-if="previewData.json_data">
            <view class="section-title">
              <text>📦 JSON数据</text>
              <button size="mini" type="default" @click="viewFullJson">查看完整JSON</button>
            </view>
            <view class="json-preview-box">
              <text class="json-info">角色数量：{{ getJsonRoleCount(previewData.json_data) }}</text>
              <text class="json-info">数据大小：{{ getJsonDataSize(previewData.json_data) }}</text>
              <view class="json-roles-preview">
                <text class="roles-title">角色预览（前5个）：</text>
                <view v-for="(role, index) in getPreviewRoles(previewData.json_data)" :key="index" class="role-item">
                  <text class="role-name">{{ role.name }}</text>
                  <text class="role-team">{{ getTeamText(role.team) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <view class="dialog-actions">
          <button @click="closePreview">关闭</button>
          <button v-if="previewData && previewData.status === 0" type="success" @click="approveFromPreview">
            ✓ 通过审核
          </button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 完整JSON查看弹窗 -->
    <uni-popup ref="jsonViewPopup" type="dialog">
      <view class="json-view-dialog">
        <view class="dialog-title">
          <text>完整JSON内容</text>
          <text class="close-btn" @click="closeJsonView">×</text>
        </view>
        <view class="dialog-content">
          <textarea 
            :value="fullJsonText" 
            readonly 
            class="json-textarea"
            auto-height>
          </textarea>
        </view>
        <view class="dialog-actions">
          <button @click="copyFullJson">复制</button>
          <button @click="closeJsonView">关闭</button>
        </view>
      </view>
    </uni-popup>

    <!-- 批量上传弹窗 -->
    <uni-popup ref="batchUploadPopup" type="dialog">
      <view class="batch-upload-dialog">
        <view class="dialog-title">批量导入JSON剧本</view>
        <view class="dialog-content">
          <view class="upload-tips">
            <text>💡 支持选择多个JSON文件或整个文件夹</text>
            <text>📁 支持递归读取子文件夹中的所有JSON文件</text>
            <text>📄 JSON文件格式请参考示例</text>
          </view>
          
          <!-- 文件选择区域 -->
          <view class="file-select-area">
            <button type="success" size="small" @click="triggerFolderSelect">
              📂 选择文件夹
            </button>
            <button type="primary" size="small" @click="triggerFileSelect" style="margin-left: 10px;">
              📄 选择文件
            </button>
            <text class="tip-text">（推荐选择文件夹，自动递归读取所有JSON）</text>
          </view>

          <!-- 已选择的文件列表 -->
          <view v-if="selectedFiles.length > 0" class="file-list">
            <view class="file-list-header">
              <text>已选择 {{ selectedFiles.length }} 个文件</text>
              <text class="clear-btn" @click="clearFiles">清空</text>
            </view>
            <scroll-view scroll-y class="file-list-scroll">
              <view v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                <text class="file-name">{{ file.name }}</text>
                <text class="file-size">{{ formatFileSize(file.size) }}</text>
              </view>
            </scroll-view>
          </view>

          <!-- 导入进度 -->
          <view v-if="importing" class="import-progress">
            <text>正在导入：{{ importProgress.current }} / {{ importProgress.total }}</text>
            <progress :percent="importProgress.percent" show-info stroke-width="3" />
            <text class="progress-detail">成功：{{ importProgress.success }} | 失败：{{ importProgress.failed }}</text>
          </view>
        </view>

        <view class="dialog-actions">
          <button @click="closeBatchUpload">取消</button>
          <button 
            type="primary" 
            @click="startImport"
            :disabled="selectedFiles.length === 0 || importing">
            {{ importing ? '导入中...' : '开始导入' }}
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 筛选条件 -->
    <view class="filter-container">
      <uni-forms ref="filterForm" :modelValue="filterForm" label-width="80px" class="filter-form">
        <uni-row :gutter="16">
          <uni-col :span="6">
            <uni-forms-item label="剧本状态">
              <uni-data-select 
                v-model="filterForm.status" 
                :localdata="statusOptions"
                @change="handleFilterChange">
              </uni-data-select>
            </uni-forms-item>
          </uni-col>
          <uni-col :span="6">
            <uni-forms-item label="剧本类型">
              <uni-data-select 
                v-model="filterForm.script_type" 
                :localdata="typeOptions"
                @change="handleFilterChange">
              </uni-data-select>
            </uni-forms-item>
          </uni-col>
          <uni-col :span="6">
            <uni-forms-item label="难度等级">
              <uni-data-select 
                v-model="filterForm.difficulty" 
                :localdata="difficultyOptions"
                @change="handleFilterChange">
              </uni-data-select>
            </uni-forms-item>
          </uni-col>
          <uni-col :span="6">
            <uni-forms-item label="搜索">
              <input 
                v-model="filterForm.keyword" 
                placeholder="剧本名称/作者" 
                @confirm="handleFilterChange"
                class="uni-input" />
            </uni-forms-item>
          </uni-col>
        </uni-row>
      </uni-forms>
      
      <!-- 批量操作按钮区域 -->
      <view class="batch-actions-bar">
        <button type="success" size="mini" @click="batchApprove">✓ 批量通过</button>
        <button type="error" size="mini" @click="batchDelete">× 批量删除</button>
        <button type="default" size="mini" @click="clearSelection">取消选择</button>
      </view>
    </view>

    <!-- 数据表格 -->
    <view class="table-container">
      <uni-table 
        :loading="loading" 
        border 
        stripe 
        emptyText="暂无数据">
        <uni-tr>
          <uni-th width="50" align="center">
            <view class="checkbox-wrapper" @click="toggleSelectAll">
              <view class="custom-checkbox" :class="{ 'checked': isAllSelected }">
                <text v-if="isAllSelected" class="checkbox-icon">✓</text>
              </view>
            </view>
          </uni-th>
          <uni-th width="80" align="center">ID</uni-th>
          <uni-th width="200">剧本标题</uni-th>
          <uni-th width="120">作者</uni-th>
          <uni-th width="100">类型</uni-th>
          <uni-th width="100">难度</uni-th>
          <uni-th width="100">玩家人数</uni-th>
          <uni-th width="80">时长</uni-th>
          <uni-th width="100">状态</uni-th>
          <uni-th width="100">评分</uni-th>
          <uni-th width="80">浏览量</uni-th>
          <uni-th width="80">下载量</uni-th>
          <uni-th width="150">发布时间</uni-th>
          <uni-th width="200" align="center">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="item in dataList" :key="item._id">
          <uni-td align="center">
            <view class="checkbox-wrapper" @click="toggleSelect(item._id)">
              <view class="custom-checkbox" :class="{ 'checked': selectedIds.includes(item._id) }">
                <text v-if="selectedIds.includes(item._id)" class="checkbox-icon">✓</text>
              </view>
            </view>
          </uni-td>
          <uni-td align="center">{{ item._id.slice(-6) }}</uni-td>
          <uni-td>
            <view class="script-title">{{ item.title }}</view>
            <view v-if="item.subtitle" class="script-subtitle">{{ item.subtitle }}</view>
          </uni-td>
          <uni-td>{{ item.author || '未知' }}</uni-td>
          <uni-td>
            <text>{{ getTypeText(item.script_type) }}</text>
          </uni-td>
          <uni-td>
            <text>{{ getDifficultyText(item.difficulty) }}</text>
          </uni-td>
          <uni-td>{{ item.player_count || '-' }}</uni-td>
          <uni-td>{{ item.duration ? item.duration + '分' : '-' }}</uni-td>
          <uni-td>
            <text>{{ getStatusText(item.status) }}</text>
          </uni-td>
          <uni-td>
            <view class="rating-info">
              <text>⭐{{ item.rating ? item.rating.toFixed(1) : '0.0' }}</text>
              <text class="rating-count">({{ item.rating_count || 0 }})</text>
            </view>
          </uni-td>
          <uni-td>{{ item.view_count || 0 }}</uni-td>
          <uni-td>{{ item.download_count || 0 }}</uni-td>
          <uni-td>{{ formatDate(item.published_at || item.created_at) }}</uni-td>
          <uni-td align="center">
            <view class="action-buttons">
              <button 
                type="default" 
                size="mini" 
                @click="previewScript(item)">
                预览
              </button>
              <button 
                type="primary" 
                size="mini" 
                @click="goToEdit(item._id)">
                编辑
              </button>
              <button 
                v-if="item.status === 0" 
                type="success" 
                size="mini" 
                @click="auditScript(item)">
                审核
              </button>
              <button 
                v-if="item.status === 0" 
                type="warning" 
                size="mini" 
                @click="rejectScript(item._id)">
                拒绝
              </button>
              <button 
                v-if="item.status === 1" 
                type="warning" 
                size="mini" 
                @click="changeStatus(item._id, 2)">
                下架
              </button>
              <button 
                v-if="item.status === 2" 
                type="success" 
                size="mini" 
                @click="changeStatus(item._id, 1)">
                上架
              </button>
              <button 
                type="error" 
                size="mini" 
                @click="handleDelete(item._id)">
                删除
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
          @change="handlePageChange" />
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      adminScriptObj: null, // AdminScript云对象实例
      loading: false,
      dataList: [],
      selectedIds: [], // 多选的ID列表
      filterForm: {
        status: null,
        script_type: null,
        difficulty: null,
        keyword: ''
      },
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0
      },
      // 预览相关
      previewData: null,
      fullJsonText: '',
      
      // 批量上传相关
      selectedFiles: [],
      importing: false,
      importProgress: {
        current: 0,
        total: 0,
        success: 0,
        failed: 0,
        percent: 0
      },
      importResults: [],
      statusOptions: [
        { value: null, text: '全部状态' },
        { value: 0, text: '待审核' },
        { value: 1, text: '已发布' },
        { value: 2, text: '已下架' }
      ],
      typeOptions: [
        { value: null, text: '全部类型' },
        { value: 1, text: '推理' },
        { value: 2, text: '娱乐' }
      ],
      difficultyOptions: [
        { value: null, text: '全部难度' },
        { value: 1, text: '简单' },
        { value: 2, text: '中等' },
        { value: 3, text: '困难' },
        { value: 4, text: '专家' }
      ]
    }
  },

  onLoad() {
    // 初始化云对象
    this.adminScriptObj = uniCloud.importObject('admin-script', { customUI: true })
    this.loadData()
  },
  
  computed: {
    // 检查是否有图片
    hasImages() {
      if (!this.previewData) return false
      return !!(this.previewData.preview_image || 
                this.previewData.user_images?.length > 0 || 
                this.previewData.cover_image)
    },
    
    // 检查是否有用户上传的图片
    hasUserImages() {
      return this.previewData?.user_images?.length > 0
    },
    
    // 是否全选
    isAllSelected() {
      return this.dataList.length > 0 && this.selectedIds.length === this.dataList.length
    }
  },

  methods: {
    async loadData() {
      this.loading = true
      try {
        // 构建查询条件
        let whereCondition = {}
        
        if (this.filterForm.status !== null) {
          whereCondition.status = this.filterForm.status
        }
        
        if (this.filterForm.script_type !== null) {
          whereCondition.script_type = this.filterForm.script_type
        }
        
        if (this.filterForm.difficulty !== null) {
          whereCondition.difficulty = this.filterForm.difficulty
        }
        
        if (this.filterForm.keyword) {
          whereCondition.title = new RegExp(this.filterForm.keyword, 'i')
        }

        // 查询总数
        const countRes = await db.collection('botc-scripts')
          .where(whereCondition)
          .count()
        
        this.pagination.total = countRes.result.total

        // 查询数据
        const res = await db.collection('botc-scripts')
          .where(whereCondition)
          .orderBy('created_at', 'desc')
          .skip((this.pagination.current - 1) * this.pagination.pageSize)
          .limit(this.pagination.pageSize)
          .get()

        this.dataList = res.result.data
        
        // 🔍 调试日志：查看查询到的数据
        console.log('📊 查询到的剧本数量：', this.dataList.length)
        if (this.dataList.length > 0) {
          console.log('📝 第一条数据完整内容：', JSON.stringify(this.dataList[0], null, 2))
          console.log('🔎 关键字段检查：')
          console.log('  - script_type:', this.dataList[0].script_type, '(类型:', typeof this.dataList[0].script_type + ')')
          console.log('  - difficulty:', this.dataList[0].difficulty, '(类型:', typeof this.dataList[0].difficulty + ')')
          console.log('  - player_count:', this.dataList[0].player_count, '(类型:', typeof this.dataList[0].player_count + ')')
          console.log('  - duration:', this.dataList[0].duration, '(类型:', typeof this.dataList[0].duration + ')')
          console.log('  - status:', this.dataList[0].status, '(类型:', typeof this.dataList[0].status + ')')
        }

      } catch (error) {
        console.error('加载数据失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    handleFilterChange(value) {
      // 处理事件对象
      if (value && typeof value === 'object' && value.detail) {
        // uni-data-select 的 change 事件
        // value 已经由 v-model 自动更新
      }
      this.pagination.current = 1
      this.loadData()
    },

    handlePageChange(e) {
      this.pagination.current = e.current
      this.loadData()
    },

    goToAdd() {
      uni.navigateTo({
        url: '/pages/botc/script/edit'
      })
    },

    goToEdit(id) {
      uni.navigateTo({
        url: `/pages/botc/script/edit?id=${id}`
      })
    },

    // 预览剧本
    previewScript(item) {
      console.log('预览剧本数据：', item)
      console.log('preview_image:', item.preview_image ? '存在' : '不存在')
      console.log('user_images:', item.user_images)
      console.log('user_images长度:', item.user_images?.length || 0)
      
      this.previewData = item
      this.$refs.previewPopup.open()
    },
    
    // 查看图片（放大）
    viewImage(imageUrl) {
      if (!imageUrl) return
      
      // 如果是base64格式的SVG，在新窗口打开
      if (imageUrl.startsWith('data:image/svg+xml')) {
        window.open(imageUrl, '_blank')
      } else {
        // 普通图片URL，使用uni.previewImage
        uni.previewImage({
          urls: [imageUrl],
          current: imageUrl
        })
      }
    },
    
    // 关闭预览
    closePreview() {
      this.$refs.previewPopup.close()
      this.previewData = null
    },
    
    // 审核剧本
    auditScript(item) {
      this.previewData = item
      this.$refs.previewPopup.open()
    },
    
    // 从预览窗口通过审核
    async approveFromPreview() {
      if (!this.previewData) return
      
      try {
        const updateData = { 
          status: 1,
          published_at: Date.now()
        }
        
        await db.collection('botc-scripts')
          .doc(this.previewData._id)
          .update(updateData)
        
        uni.showToast({
          title: '审核通过',
          icon: 'success'
        })
        
        this.closePreview()
        this.loadData()
      } catch (error) {
        console.error('审核失败：', error)
        uni.showToast({
          title: '审核失败',
          icon: 'none'
        })
      }
    },
    
    // 拒绝剧本
    rejectScript(id) {
      uni.showModal({
        title: '拒绝剧本',
        content: '确定要拒绝这个剧本吗？拒绝后状态将变为"已下架"',
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.collection('botc-scripts')
                .doc(id)
                .update({ status: 2 })
              
              uni.showToast({
                title: '已拒绝',
                icon: 'success'
              })
              
              this.loadData()
            } catch (error) {
              console.error('操作失败：', error)
              uni.showToast({
                title: '操作失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 查看完整JSON
    viewFullJson() {
      if (!this.previewData || !this.previewData.json_data) {
        uni.showToast({
          title: '暂无JSON数据',
          icon: 'none'
        })
        return
      }
      
      // 格式化JSON
      const jsonData = this.previewData.json_data
      this.fullJsonText = JSON.stringify(jsonData, null, 2)
      
      this.$refs.jsonViewPopup.open()
    },
    
    // 关闭JSON查看
    closeJsonView() {
      this.$refs.jsonViewPopup.close()
      this.fullJsonText = ''
    },
    
    // 复制完整JSON
    copyFullJson() {
      if (!this.fullJsonText) return
      
      // H5环境使用navigator.clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.fullJsonText).then(() => {
          uni.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          })
        }).catch(() => {
          // 降级方案
          this.copyToClipboardFallback(this.fullJsonText)
        })
      } else {
        this.copyToClipboardFallback(this.fullJsonText)
      }
    },
    
    // 复制到剪贴板降级方案
    copyToClipboardFallback(text) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        uni.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      } catch (err) {
        uni.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
      document.body.removeChild(textarea)
    },
    
    // 获取JSON角色数量
    getJsonRoleCount(jsonData) {
      if (!jsonData) return 0
      if (!Array.isArray(jsonData)) return 0
      
      return jsonData.filter(item => {
        return item.team && !['fabled', 'a jinxed'].includes(item.team)
      }).length
    },
    
    // 获取JSON数据大小
    getJsonDataSize(jsonData) {
      if (!jsonData) return '0 KB'
      const size = JSON.stringify(jsonData).length
      if (size < 1024) return size + ' B'
      if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    },
    
    // 获取预览角色（前5个）
    getPreviewRoles(jsonData) {
      if (!jsonData || !Array.isArray(jsonData)) return []
      
      return jsonData
        .filter(item => item.team && !['fabled', 'a jinxed'].includes(item.team))
        .slice(0, 5)
    },
    
    // 获取队伍中文名
    getTeamText(team) {
      const map = {
        'townsfolk': '镇民',
        'outsider': '外来者',
        'minion': '爪牙',
        'demon': '恶魔',
        'traveler': '旅行者',
        'fabled': '传说'
      }
      return map[team] || team
    },

    async changeStatus(id, status) {
      const statusText = status === 1 ? '发布' : '下架'
      
      uni.showModal({
        title: '确认操作',
        content: `确定要${statusText}这个剧本吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const updateData = { status }
              if (status === 1 && !this.dataList.find(item => item._id === id).published_at) {
                updateData.published_at = Date.now()
              }
              
              await db.collection('botc-scripts')
                .doc(id)
                .update(updateData)
              
              uni.showToast({
                title: `${statusText}成功`,
                icon: 'success'
              })
              
              this.loadData()
            } catch (error) {
              console.error('操作失败：', error)
              uni.showToast({
                title: '操作失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },

    handleDelete(id) {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定要删除这个剧本吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.collection('botc-scripts')
                .doc(id)
                .remove()
              
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              })
              
              this.loadData()
            } catch (error) {
              console.error('删除失败：', error)
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },

    getStatusText(status) {
      console.log('🔍 getStatusText 接收值:', status, typeof status)
      const map = { 
        0: '待审核', 1: '已发布', 2: '已下架',
        '0': '待审核', '1': '已发布', '2': '已下架'
      }
      if (status === null || status === undefined) return '未设置'
      return map[status] || '未知(' + status + ')'
    },

    getStatusType(status) {
      const map = { 0: 'warning', 1: 'success', 2: 'error' }
      return map[status] || 'default'
    },

    getTypeText(type) {
      console.log('🔍 getTypeText 接收值:', type, typeof type)
      if (type === 1 || type === '1') return '推理'
      if (type === 2 || type === '2') return '娱乐'
      if (type === null || type === undefined) return '未设置'
      return '未知(' + type + ')'
    },

    getDifficultyText(difficulty) {
      console.log('🔍 getDifficultyText 接收值:', difficulty, typeof difficulty)
      const map = { 
        1: '简单', 2: '中等', 3: '困难', 4: '专家',
        '1': '简单', '2': '中等', '3': '困难', '4': '专家'
      }
      if (difficulty === null || difficulty === undefined) return '未设置'
      return map[difficulty] || '未知(' + difficulty + ')'
    },

    getDifficultyType(difficulty) {
      const map = { 1: 'success', 2: 'primary', 3: 'warning', 4: 'error' }
      return map[difficulty] || 'default'
    },

    formatDate(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      const Y = date.getFullYear()
      const M = String(date.getMonth() + 1).padStart(2, '0')
      const D = String(date.getDate()).padStart(2, '0')
      const h = String(date.getHours()).padStart(2, '0')
      const m = String(date.getMinutes()).padStart(2, '0')
      return `${Y}-${M}-${D} ${h}:${m}`
    },

    // ========== 多选相关方法 ==========
    
    // 切换单个选择
    toggleSelect(id) {
      const index = this.selectedIds.indexOf(id)
      if (index > -1) {
        this.selectedIds.splice(index, 1)
      } else {
        this.selectedIds.push(id)
      }
    },
    
    // 切换全选
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedIds = []
      } else {
        this.selectedIds = this.dataList.map(item => item._id)
      }
    },
    
    // 清空选择
    clearSelection() {
      this.selectedIds = []
    },
    
    // 批量审批通过
    async batchApprove() {
      if (this.selectedIds.length === 0) {
        uni.showToast({
          title: '请先选择剧本',
          icon: 'none'
        })
        return
      }
      
      uni.showModal({
        title: '批量审核',
        content: `确定要通过审核这 ${this.selectedIds.length} 个剧本吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '处理中...',
              mask: true
            })
            
            try {
              let successCount = 0
              let failCount = 0
              
              for (const id of this.selectedIds) {
                try {
                  await db.collection('botc-scripts')
                    .doc(id)
                    .update({
                      status: 1,
                      published_at: Date.now(),
                      updated_at: Date.now()
                    })
                  successCount++
                } catch (error) {
                  console.error(`审核失败 ${id}:`, error)
                  failCount++
                }
              }
              
              uni.hideLoading()
              uni.showToast({
                title: `成功：${successCount}，失败：${failCount}`,
                icon: successCount > 0 ? 'success' : 'none',
                duration: 2000
              })
              
              // 清空选择
              this.selectedIds = []
              
              // 刷新列表
              this.loadData()
            } catch (error) {
              uni.hideLoading()
              console.error('批量审核失败：', error)
              uni.showToast({
                title: '批量审核失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 批量删除
    async batchDelete() {
      if (this.selectedIds.length === 0) {
        uni.showToast({
          title: '请先选择剧本',
          icon: 'none'
        })
        return
      }
      
      uni.showModal({
        title: '批量删除',
        content: `确定要删除这 ${this.selectedIds.length} 个剧本吗？此操作不可恢复！`,
        confirmColor: '#f56c6c',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '删除中...',
              mask: true
            })
            
            try {
              let successCount = 0
              let failCount = 0
              
              for (const id of this.selectedIds) {
                try {
                  await db.collection('botc-scripts')
                    .doc(id)
                    .remove()
                  successCount++
                } catch (error) {
                  console.error(`删除失败 ${id}:`, error)
                  failCount++
                }
              }
              
              uni.hideLoading()
              uni.showToast({
                title: `删除成功：${successCount}，失败：${failCount}`,
                icon: successCount > 0 ? 'success' : 'none',
                duration: 2000
              })
              
              // 清空选择
              this.selectedIds = []
              
              // 刷新列表
              this.loadData()
            } catch (error) {
              uni.hideLoading()
              console.error('批量删除失败：', error)
              uni.showToast({
                title: '批量删除失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },

    // ========== 批量上传相关方法 ==========
    
    // 显示批量上传弹窗
    showBatchUpload() {
      this.$refs.batchUploadPopup.open()
      this.selectedFiles = []
      this.importProgress = {
        current: 0,
        total: 0,
        success: 0,
        failed: 0,
        percent: 0
      }
      this.importResults = []
    },

    // 关闭批量上传弹窗
    closeBatchUpload() {
      if (this.importing) {
        uni.showModal({
          title: '提示',
          content: '正在导入中，确定要关闭吗？',
          success: (res) => {
            if (res.confirm) {
              this.$refs.batchUploadPopup.close()
              this.importing = false
            }
          }
        })
      } else {
        this.$refs.batchUploadPopup.close()
      }
    },

    // 触发文件夹选择
    triggerFolderSelect() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.webkitdirectory = true
      input.directory = true
      input.multiple = true
      input.onchange = (e) => {
        this.handleFileSelect(e)
      }
      input.click()
    },

    // 触发文件选择（用于选择多个文件）
    triggerFileSelect() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.multiple = true
      input.onchange = (e) => {
        this.handleFileSelect(e)
      }
      input.click()
    },

    // 处理文件选择
    handleFileSelect(event) {
      const files = event.target.files || event.detail.files
      if (!files || files.length === 0) return

      // 过滤出所有JSON文件
      const jsonFiles = Array.from(files).filter(file => {
        return file.name.toLowerCase().endsWith('.json')
      })

      if (jsonFiles.length === 0) {
        uni.showToast({
          title: '未找到JSON文件',
          icon: 'none'
        })
        return
      }

      this.selectedFiles = jsonFiles
      
      uni.showToast({
        title: `已选择 ${jsonFiles.length} 个文件`,
        icon: 'success'
      })
    },

    // 清空文件列表
    clearFiles() {
      this.selectedFiles = []
    },

    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
    },

    // 开始导入
    async startImport() {
      if (this.selectedFiles.length === 0) {
        uni.showToast({
          title: '请先选择文件',
          icon: 'none'
        })
        return
      }

      this.importing = true
      this.importProgress = {
        current: 0,
        total: this.selectedFiles.length,
        success: 0,
        failed: 0,
        percent: 0
      }
      this.importResults = []

      //步骤1：解析所有文件
      const scripts = []
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i]
        this.importProgress.current = i + 1
        this.importProgress.percent = Math.round((i + 1) / this.selectedFiles.length * 50) // 前50%是解析

        try {
          const scriptData = await this.parseSingleFile(file)
          scripts.push(scriptData)
          console.log(`✅ 解析成功：${file.name}`)
        } catch (error) {
          console.error(`❌ 解析失败 ${file.name}:`, error)
          this.importProgress.failed++
        }
      }

      // 步骤2：调用云函数批量导入
      if (scripts.length > 0) {
        this.importProgress.percent = 50
        console.log(`开始批量导入 ${scripts.length} 个剧本...`)
        
        try {
          const result = await this.adminScriptObj.batchImport(scripts)
          
          console.log('云对象返回结果：', result)
          
          if (result.code === 0) {
            this.importProgress.success = result.data.success
            this.importProgress.failed += result.data.failed
            console.log(`✅ 批量导入完成：成功 ${result.data.success}，失败 ${result.data.failed}`)
          } else {
            throw new Error(result.message || '批量导入失败')
          }
        } catch (error) {
          console.error('❌ 批量导入失败:', error)
          this.importProgress.failed += scripts.length
          
          // 🔍 检查是否是权限错误（未登录）
          const errorMsg = error.message || error.errMsg || String(error)
          if (errorMsg.includes('未登录') || errorMsg.includes('权限验证失败') || errorMsg.includes('未授权')) {
            this.importing = false
            this.$refs.batchUploadPopup.close()
            
            uni.showModal({
              title: '未登录',
              content: '您还未登录，请先登录后再进行操作',
              showCancel: false,
              success: () => {
                // 跳转到登录页面
                uni.reLaunch({
                  url: '/pages/login/login'
                })
              }
            })
            return
          }
        }
      }

      this.importProgress.percent = 100
      this.importing = false

      // 显示导入结果
      const message = `导入完成！\n成功：${this.importProgress.success}\n失败：${this.importProgress.failed}`
      
      uni.showModal({
        title: '导入完成',
        content: message,
        showCancel: false,
        success: () => {
          // 关闭弹窗
          this.$refs.batchUploadPopup.close()
          
          if (this.importProgress.success > 0) {
            // 清空筛选条件
            this.filterForm.status = null
            this.filterForm.script_type = null
            this.filterForm.difficulty = null
            this.filterForm.keyword = ''
            
            // 重置分页
            this.pagination.current = 1
            
            // 刷新列表
            this.loadData()
          }
        }
      })
    },

    // 解析单个文件（只解析，不插入数据库）
    async parseSingleFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = async (e) => {
          try {
            const content = e.target.result
            const parsedData = JSON.parse(content)
            
            // 判断是否为数组（官方剧本）
            const scriptData = Array.isArray(parsedData) ? parsedData.find(item => item.id === '_meta') : parsedData
            
            // 提取描述信息
            let fullDescription = scriptData.description || ''
            if (scriptData.additional && Array.isArray(scriptData.additional) && scriptData.additional[0]) {
              const scriptIntro = scriptData.additional[0]['剧本介绍'] || ''
              if (scriptIntro) {
                fullDescription = scriptIntro
              }
            }
            
            // 清理HTML标签
            const cleanDescription = fullDescription.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
            
            // 计算玩家人数
            let playerCount = '5-15人'
            if (Array.isArray(parsedData)) {
              const roles = parsedData.filter(item => item.id !== '_meta')
              const townsfolk = roles.filter(r => r.team === 'townsfolk').length
              const outsider = roles.filter(r => r.team === 'outsider').length
              const minion = roles.filter(r => r.team === 'minion').length
              const demon = roles.filter(r => r.team === 'demon').length
              const totalRoles = townsfolk + outsider + minion + demon
              
              if (totalRoles > 0) {
                const minPlayers = Math.max(5, totalRoles)
                const maxPlayers = Math.min(15, totalRoles + 5)
                playerCount = `${minPlayers}-${maxPlayers}人`
              }
            }
            
            // 获取当前登录用户ID
            let currentUserId = null
            try {
              const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
              if (userInfo && userInfo._id) {
                currentUserId = userInfo._id
              }
            } catch (e) {
              console.log('获取用户ID失败')
            }
            
            // 构建数据库记录
            const dbData = {
              title: scriptData.name || scriptData.title || file.name.replace('.json', ''),
              subtitle: scriptData.subtitle || '',
              author: scriptData.author || '官方',
              script_type: this.determineScriptType(scriptData, fullDescription),
              difficulty: scriptData.difficulty || 2,
              player_count: scriptData.player_count || scriptData.playerCount || playerCount,
              duration: scriptData.duration || scriptData.time || 180,
              description: cleanDescription.substring(0, 1000),
              tags: scriptData.tags || this.extractTags(fullDescription),
              cover_image: scriptData.logo || scriptData.cover_image || scriptData.cover || '',
              status: 0,
              is_featured: false,
              json_data: JSON.stringify(Array.isArray(parsedData) ? parsedData : scriptData),
              json_url: '',
              rating: 0,
              rating_count: 0,
              view_count: 0,
              download_count: 0,
              favorite_count: 0,
              comment_count: 0,
              share_count: 0
            }
            
            if (currentUserId) {
              dbData.creator_id = currentUserId
            }
            
            resolve(dbData)
          } catch (error) {
            reject(error)
          }
        }
        
        reader.onerror = () => {
          reject(new Error('文件读取失败'))
        }
        
        reader.readAsText(file)
      })
    },

    // 导入单个文件（旧方法，保留用于兼容）
    async importSingleFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = async (e) => {
          try {
            const jsonContent = e.target.result
            let parsedData = JSON.parse(jsonContent)
            
            // 判断JSON格式：数组格式（官方剧本）或对象格式（普通剧本）
            let scriptData = {}
            let rolesData = []
            
            if (Array.isArray(parsedData)) {
              // 官方剧本格式：数组的第一个元素是元数据
              const metaData = parsedData.find(item => item.id === '_meta')
              if (metaData) {
                scriptData = metaData
                // 提取角色数据
                rolesData = parsedData.filter(item => item.id !== '_meta')
              } else {
                throw new Error('未找到剧本元数据')
              }
            } else {
              // 普通对象格式
              scriptData = parsedData
            }
            
            // 验证必要字段
            if (!scriptData.name && !scriptData.title) {
              throw new Error('缺少标题字段')
            }

            // 提取剧本介绍
            let fullDescription = scriptData.description || ''
            if (scriptData.additional && Array.isArray(scriptData.additional)) {
              const intro = scriptData.additional[0]
              if (intro && intro['剧本介绍']) {
                fullDescription = intro['剧本介绍']
              }
            }

            // 清理HTML标签
            const cleanDescription = fullDescription.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')

            // 计算玩家人数（从角色列表推断）
            let playerCount = '未知'
            if (rolesData.length > 0) {
              const townsfolk = rolesData.filter(r => r.team === 'townsfolk').length
              const outsiders = rolesData.filter(r => r.team === 'outsider').length
              const minions = rolesData.filter(r => r.team === 'minion').length
              const demons = rolesData.filter(r => r.team === 'demon').length
              const totalRoles = townsfolk + outsiders + minions + demons
              
              if (totalRoles > 0) {
                // 血染钟楼的典型玩家数配置
                const minPlayers = Math.max(5, totalRoles)
                const maxPlayers = Math.min(15, totalRoles + 5)
                playerCount = `${minPlayers}-${maxPlayers}人`
              }
            }

            // 获取当前登录用户ID（如果有）
            let currentUserId = null
            try {
              const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
              if (userInfo && userInfo._id) {
                currentUserId = userInfo._id
              }
            } catch (e) {
              console.log('获取用户ID失败')
            }

            // 构建数据库记录
            const dbData = {
              title: scriptData.name || scriptData.title || file.name.replace('.json', ''),
              subtitle: scriptData.subtitle || '',
              author: scriptData.author || '官方',
              script_type: this.determineScriptType(scriptData, fullDescription),
              difficulty: scriptData.difficulty || 2,
              player_count: scriptData.player_count || scriptData.playerCount || playerCount,
              duration: scriptData.duration || scriptData.time || 180,
              description: cleanDescription.substring(0, 1000), // 限制长度
              tags: scriptData.tags || this.extractTags(fullDescription),
              cover_image: scriptData.logo || scriptData.cover_image || scriptData.cover || '',
              status: 0, // 默认待审核
              is_featured: false,
              json_data: JSON.stringify(Array.isArray(parsedData) ? parsedData : scriptData), // 转换为JSON字符串存储
              json_url: '', // 可以后续上传到云存储
              rating: 0,
              rating_count: 0,
              view_count: 0,
              download_count: 0,
              favorite_count: 0,
              comment_count: 0,
              share_count: 0
              // created_at 和 updated_at 由数据库自动填充，不需要手动设置
            }
            
            // 如果有有效用户ID，才添加creator_id字段
            if (currentUserId) {
              dbData.creator_id = currentUserId
            }
            
            console.log('准备插入数据：', {
              title: dbData.title,
              author: dbData.author,
              creator_id: dbData.creator_id || '(未设置)',
              json_data_type: typeof dbData.json_data,
              json_data_length: dbData.json_data ? dbData.json_data.length : 0,
              json_data_preview: dbData.json_data ? dbData.json_data.substring(0, 100) : 'empty'
            })
            console.log('完整的 dbData：', dbData)

            // 插入数据库
            const addResult = await db.collection('botc-scripts').add(dbData)
            
            console.log('数据库插入结果：', addResult)
            
            this.importResults.push({
              fileName: file.name,
              success: true,
              title: dbData.title,
              id: addResult.id
            })
            
            resolve({
              fileName: file.name,
              title: dbData.title,
              id: addResult.id
            })
          } catch (error) {
            reject(error)
          }
        }
        
        reader.onerror = () => {
          reject(new Error('文件读取失败'))
        }
        
        reader.readAsText(file, 'UTF-8')
      })
    },

    // 判断剧本类型（推理或娱乐）
    determineScriptType(scriptData, description = '') {
      // 如果JSON中明确指定了类型
      if (scriptData.type === 'mystery' || scriptData.script_type === 1) return 1
      if (scriptData.type === 'fun' || scriptData.script_type === 2) return 2
      
      // 根据JSON内容判断类型
      const keywords = {
        mystery: ['推理', '侦探', '悬疑', '谋杀', '案件', '凶手', '逻辑', '信息', '复杂', '硬核', '还原'],
        fun: ['娱乐', '欢乐', '搞笑', '轻松', '派对', '团建', '简单', '新手']
      }

      const content = (JSON.stringify(scriptData) + description).toLowerCase()
      
      const mysteryScore = keywords.mystery.filter(k => content.includes(k)).length
      const funScore = keywords.fun.filter(k => content.includes(k)).length

      // 官方剧本默认都是推理类
      if (scriptData.author === 'The Pandemonium Institute' || scriptData.author === '官方') {
        return 1
      }
      
      // 根据关键词判断，默认推理
      return mysteryScore >= funScore ? 1 : 2
    },

    // 从描述中提取标签
    extractTags(description) {
      const tags = []
      const tagKeywords = {
        '推理': ['推理', '侦探', '逻辑'],
        '硬核': ['硬核', '复杂', '困难'],
        '还原': ['还原', '真相'],
        '欢乐': ['欢乐', '搞笑', '轻松'],
        '新手友好': ['新手', '简单', '初学'],
        '团建': ['团建', '派对'],
        '进阶': ['进阶', '中等', '有挑战'],
        '血腥': ['血腥', '暴力', '黑暗'],
        '温馨': ['温馨', '治愈', '轻松']
      }

      const lowerDesc = description.toLowerCase()
      
      for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
          tags.push(tag)
        }
      }

      // 如果没有提取到任何标签，添加默认标签
      if (tags.length === 0) {
        tags.push('推理')
      }

      return tags.slice(0, 5) // 最多5个标签
    },

    // 延迟函数
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
  }
}
</script>

<style scoped>
.uni-container {
  padding: 20px;
}

.uni-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.uni-title {
  font-size: 24px;
  font-weight: bold;
}

.filter-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.uni-input {
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.table-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.script-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.script-subtitle {
  font-size: 12px;
  color: #909399;
}

.rating-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.rating-count {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-buttons button {
  margin: 2px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 预览弹窗样式 */
.preview-dialog {
  width: 800px;
  max-width: 90vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-dialog .dialog-content {
  flex: 1;
  overflow-y: auto;
}

.close-btn {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.preview-section {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.info-item {
  display: flex;
  font-size: 14px;
  line-height: 1.6;
}

.info-item .label {
  color: #666;
  margin-right: 5px;
  flex-shrink: 0;
}

.info-item .value {
  color: #333;
  flex: 1;
}

.desc-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 图片展示区 */
.image-display-section {
  margin-bottom: 20px;
}

.image-display-section:last-child {
  margin-bottom: 0;
}

.image-label {
  display: block;
  font-size: 13px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.preview-main-image {
  width: 100%;
  max-width: 520px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.3s;
  display: block;
  margin: 0 auto;
}

.preview-main-image:hover {
  transform: scale(1.02);
}

.user-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.user-image-item {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s;
  object-fit: cover;
}

.user-image-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.image-hint {
  display: block;
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}

.json-preview-box {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.json-info {
  font-size: 13px;
  color: #666;
}

.json-roles-preview {
  margin-top: 10px;
}

.roles-title {
  font-size: 13px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 5px;
}

.role-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.role-team {
  font-size: 12px;
  color: #999;
  padding: 2px 8px;
  background: #e6f7ff;
  border-radius: 10px;
}

/* JSON查看弹窗 */
.json-view-dialog {
  width: 700px;
  max-width: 90vw;
  max-height: 80vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.json-textarea {
  width: 100%;
  min-height: 400px;
  max-height: 60vh;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  resize: vertical;
}

/* 批量上传弹窗样式 */
.batch-upload-dialog {
  width: 600px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.dialog-title {
  font-size: 18px;
  font-weight: bold;
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.upload-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 15px;
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
  border-radius: 4px;
  margin-bottom: 20px;
}

.upload-tips text {
  font-size: 14px;
  color: #0050b3;
  line-height: 1.6;
}

.file-select-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tip-text {
  font-size: 12px;
  color: #999;
  margin-left: 5px;
}

.file-list {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-bottom: 20px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #fafafa;
  border-bottom: 1px solid #d9d9d9;
  font-size: 14px;
}

.clear-btn {
  color: #ff4d4f;
  cursor: pointer;
  font-size: 13px;
}

.clear-btn:hover {
  text-decoration: underline;
}

.file-list-scroll {
  max-height: 200px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.file-item:last-child {
  border-bottom: none;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
}

.file-size {
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
}

.import-progress {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.import-progress text {
  font-size: 14px;
  color: #333;
}

.progress-detail {
  font-size: 13px;
  color: #666;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;
}

.dialog-actions button {
  min-width: 80px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  background: #fff;
  transition: all 0.3s;
}

.dialog-actions button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.dialog-actions button[type="primary"] {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.dialog-actions button[type="primary"]:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.dialog-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog-actions button:disabled:hover {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

/* 筛选表单布局 */
.filter-form {
  flex: 1;
}

/* 批量操作栏样式 */
.batch-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 0;
  margin-top: 10px;
  gap: 8px;
}

.batch-actions-bar button {
  margin: 0;
}

/* 自定义复选框样式 */
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
}

.custom-checkbox {
  width: 16px;
  height: 16px;
  border: 2px solid #dcdfe6;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: #ffffff;
}

.custom-checkbox:hover {
  border-color: #409eff;
}

.custom-checkbox.checked {
  background: #409eff;
  border-color: #409eff;
}

.checkbox-icon {
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}
</style>

