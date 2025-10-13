<template>
  <view class="uni-container">
    <view class="uni-header">
      <view class="uni-title">剧本管理</view>
      <view class="uni-header-actions">
        <button type="primary" size="mini" @click="goToAdd">+ 添加剧本</button>
        <button type="success" size="mini" @click="showBatchUpload" style="margin-left: 10px;">📁 批量导入JSON</button>
      </view>
    </view>

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
      <uni-forms ref="filterForm" :modelValue="filterForm" label-width="80px">
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
    </view>

    <!-- 数据表格 -->
    <view class="table-container">
      <uni-table 
        :loading="loading" 
        border 
        stripe 
        emptyText="暂无数据">
        <uni-tr>
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
          <uni-td align="center">{{ item._id.slice(-6) }}</uni-td>
          <uni-td>
            <view class="script-title">{{ item.title }}</view>
            <view v-if="item.subtitle" class="script-subtitle">{{ item.subtitle }}</view>
          </uni-td>
          <uni-td>{{ item.author || '未知' }}</uni-td>
          <uni-td>
            <uni-tag :type="item.script_type === 1 ? 'primary' : 'success'" size="small">
              {{ getTypeText(item.script_type) }}
            </uni-tag>
          </uni-td>
          <uni-td>
            <uni-tag :type="getDifficultyType(item.difficulty)" size="small">
              {{ getDifficultyText(item.difficulty) }}
            </uni-tag>
          </uni-td>
          <uni-td>{{ item.player_count || '-' }}</uni-td>
          <uni-td>{{ item.duration ? item.duration + '分' : '-' }}</uni-td>
          <uni-td>
            <uni-tag :type="getStatusType(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </uni-tag>
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
                type="primary" 
                size="mini" 
                @click="goToEdit(item._id)">
                编辑
              </button>
              <button 
                v-if="item.status === 0" 
                type="success" 
                size="mini" 
                @click="changeStatus(item._id, 1)">
                发布
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
      loading: false,
      dataList: [],
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
    this.loadData()
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
      const map = { 0: '待审核', 1: '已发布', 2: '已下架' }
      return map[status] || '未知'
    },

    getStatusType(status) {
      const map = { 0: 'warning', 1: 'success', 2: 'error' }
      return map[status] || 'default'
    },

    getTypeText(type) {
      return type === 1 ? '推理' : '娱乐'
    },

    getDifficultyText(difficulty) {
      const map = { 1: '简单', 2: '中等', 3: '困难', 4: '专家' }
      return map[difficulty] || '未知'
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
          const result = await uniCloud.callFunction({
            name: 'script-batch-import',
            data: {
              scripts: scripts
            }
          })
          
          console.log('云函数返回结果：', result)
          
          if (result.result && result.result.code === 0) {
            this.importProgress.success = result.result.data.success
            this.importProgress.failed += result.result.data.failed
            console.log(`✅ 批量导入完成：成功 ${result.result.data.success}，失败 ${result.result.data.failed}`)
          } else {
            throw new Error(result.result ? result.result.message : '云函数调用失败')
          }
        } catch (error) {
          console.error('❌ 批量导入失败:', error)
          this.importProgress.failed += scripts.length
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
</style>

