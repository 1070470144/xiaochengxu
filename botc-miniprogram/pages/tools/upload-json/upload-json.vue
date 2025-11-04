<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="header">
      <text class="header-title">剧本上传</text>
      <text class="header-subtitle">分享您的优质剧本JSON</text>
    </view>

    <!-- 上传方式切换 -->
    <view class="mode-switch">
      <view 
        class="mode-btn" 
        :class="{ active: uploadMode === 'file' }"
        @click="switchMode('file')"
      >
        <text class="mode-icon">📁</text>
        <text class="mode-text">文件上传</text>
        <text class="mode-sub">小程序推荐</text>
      </view>
      <view 
        class="mode-btn" 
        :class="{ active: uploadMode === 'paste' }"
        @click="switchMode('paste')"
      >
        <text class="mode-icon">📋</text>
        <text class="mode-text">粘贴内容</text>
        <text class="mode-sub">测试环境用</text>
      </view>
    </view>

    <!-- 文件上传模式 -->
    <view v-if="uploadMode === 'file'" class="card section">
      <view class="section-header">
        <text class="section-title">选择JSON文件</text>
        <view class="json-status" :class="jsonStatus.type">
          <text>{{ jsonStatus.text }}</text>
        </view>
      </view>
      
      <button class="upload-btn" @click="chooseJsonFile">
        <view v-if="!fileSelected" class="upload-empty">
          <text class="upload-icon">📁</text>
          <text class="upload-text">选择JSON文件</text>
          <text class="upload-hint">从聊天记录或文件中选择</text>
        </view>
        <view v-else class="upload-filled">
          <text class="file-icon">✅</text>
          <view class="file-info">
            <text class="file-name">{{ fileName }}</text>
            <text class="file-size">{{ fileSize }}</text>
          </view>
        </view>
      </button>
      
      <view v-if="fileSelected" class="file-actions">
        <button class="btn-action" size="mini" @click="viewJsonContent">查看内容</button>
        <button class="btn-action" size="mini" @click="removeFile">重新选择</button>
      </view>
    </view>

    <!-- 粘贴内容模式 -->
    <view v-if="uploadMode === 'paste'" class="card section">
      <view class="section-header">
        <text class="section-title">粘贴JSON内容</text>
        <view class="json-status" :class="jsonStatus.type">
          <text>{{ jsonStatus.text }}</text>
        </view>
      </view>
      
      <textarea 
        class="json-input"
        v-model="jsonContent"
        placeholder="请粘贴剧本JSON内容...&#10;&#10;支持两种格式：&#10;1. 数组: [{id: '_meta', ...}, {...}]&#10;2. 对象: {name: '剧本名', characters: [...]}"
        :maxlength="-1"
        @input="onJsonInput"
      />
      
      <view class="button-group">
        <button class="btn-secondary" size="mini" @click="formatJson">格式化</button>
        <button class="btn-secondary" size="mini" @click="validateJson">验证</button>
        <button class="btn-secondary" size="mini" @click="clearJson">清空</button>
      </view>
    </view>

    <!-- 解析结果 -->
    <view v-if="parsedInfo" class="card section">
      <view class="section-header">
        <text class="section-title">解析结果</text>
        <text class="parse-success">✓ 解析成功</text>
      </view>
      
      <view class="parsed-info">
        <view class="info-row">
          <text class="info-label">剧本名称：</text>
          <text class="info-value">{{ parsedInfo.title }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">作者：</text>
          <text class="info-value">{{ parsedInfo.author }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">角色总数：</text>
          <text class="info-value">{{ parsedInfo.totalCharacters }}个</text>
        </view>
        <view class="info-row">
          <text class="info-label">玩家数量：</text>
          <text class="info-value">{{ parsedInfo.playerCount }}</text>
        </view>
        
        <!-- 角色分类 -->
        <view class="roles-summary">
          <view v-for="item in parsedInfo.roleCounts" :key="item.team" class="role-count-item">
            <text class="role-emoji">{{ getTeamEmoji(item.team) }}</text>
            <text class="role-name">{{ getTeamName(item.team) }}</text>
            <text class="role-num">{{ item.count }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义信息 -->
    <view v-if="parsedInfo" class="card section">
      <view class="section-header">
        <text class="section-title">自定义信息</text>
        <text class="info-hint">可选，留空则使用JSON中的值</text>
      </view>
      
      <view class="form-group">
        <view class="form-item">
          <text class="form-label">剧本名称（可选）</text>
          <input 
            class="form-input" 
            v-model="formData.customTitle"
            :placeholder="'留空使用：' + parsedInfo.title"
          />
          <text class="form-hint">如需修改JSON中的名称，请在此输入</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">作者（可选）</text>
          <input 
            class="form-input" 
            v-model="formData.customAuthor"
            :placeholder="'留空使用：' + parsedInfo.author"
          />
          <text class="form-hint">如需修改JSON中的作者，请在此输入</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">剧本简介（可选）</text>
          <textarea 
            class="form-textarea" 
            v-model="formData.description"
            placeholder="简要介绍这个剧本的特色、玩法等..."
            maxlength="200"
          />
        </view>
      </view>
    </view>

    <!-- 剧本图片上传 -->
    <view v-if="parsedInfo" class="card section">
      <view class="section-header">
        <text class="section-title">剧本图片（可选）</text>
        <text class="images-count">{{ userImages.length }}/3</text>
      </view>
      
      <view class="upload-hint-box">
        <text class="hint-icon">💡</text>
        <view class="hint-content">
          <text class="hint-text">可上传0-3张图片（如剧本介绍图、玩法说明图等）</text>
          <text class="hint-sub">系统会根据JSON自动生成预览图，用户上传的图片作为补充展示</text>
        </view>
      </view>
      
      <view class="images-upload-area">
        <!-- 已上传的图片列表 -->
        <view v-if="uploadedImageUrls.length > 0" class="uploaded-images">
          <view 
            v-for="(img, index) in uploadedImageUrls" 
            :key="index"
            class="image-item"
          >
            <image :src="img" mode="aspectFill" class="uploaded-img" />
            <view class="img-delete" @click="deleteUploadedImage(index)">
              <text class="delete-icon">×</text>
            </view>
            <view class="img-status">
              <text class="status-text">✓ 已上传</text>
            </view>
          </view>
        </view>
        
        <!-- 上传按钮 -->
        <button 
          v-if="uploadedImageUrls.length < 3"
          class="image-upload-btn"
          @click="chooseImages"
          :disabled="uploadingImages"
        >
          <text class="upload-btn-icon">📸</text>
          <text class="upload-btn-text">{{ uploadingImages ? '上传中...' : '选择图片' }}</text>
        </button>
      </view>
    </view>

    <!-- 预览图展示（上传成功后） -->
    <view v-if="uploadedPreviewImage" class="card section preview-display-section">
      <view class="section-header">
        <text class="section-title">生成的预览图</text>
        <text class="preview-success">✓ 已生成</text>
      </view>
      
      <view class="preview-display">
        <image 
          class="preview-img" 
          :src="uploadedPreviewImage" 
          mode="widthFix"
          @click="previewImage"
        />
        <text class="preview-hint">点击图片可放大查看</text>
      </view>
    </view>

    <!-- 预览图提示（未上传时） -->
    <view v-if="parsedInfo && !uploadedPreviewImage" class="card section preview-tip-section">
      <view class="preview-tip-box">
        <text class="tip-icon">🖼️</text>
        <view class="tip-content">
          <text class="tip-title">自动生成预览图</text>
          <text class="tip-desc">提交后将根据您的剧本JSON自动生成精美的SVG预览图，包含角色分类、夜晚行动顺序等</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view v-if="parsedInfo" class="submit-section">
      <button 
        class="btn-primary submit-btn"
        :disabled="uploading"
        @click="handleSubmit"
      >
        {{ uploading ? '上传中...' : '提交并生成预览图' }}
      </button>
      
      <view class="upload-tips">
        <text class="tip-item">• 提交后将自动生成精美的预览图</text>
        <text class="tip-item">• 剧本需经管理员审核后发布</text>
        <text class="tip-item">• 审核通过可获得经验值奖励</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'UploadJson',
  
  data() {
    return {
      uploadMode: 'file', // file 或 paste
      currentStep: 1,
      fileSelected: false,
      fileName: '',
      fileSize: '',
      jsonContent: '',
      jsonStatus: {
        type: 'waiting',
        text: '等待输入'
      },
      parsedInfo: null,
      formData: {
        customTitle: '',
        customAuthor: '',
        description: ''
      },
      uploading: false,
      uploadedPreviewImage: '',  // 上传成功后的预览图
      
      // 图片上传相关
      userImages: [],  // 用于显示图片数量
      uploadedImageUrls: [],  // 已上传的图片永久URL
      uploadingImages: false  // 是否正在上传图片
    }
  },
  
  onLoad() {
    // 初始化 script 云对象
    this.scriptObj = uniCloud.importObject('script', {
      customUI: true
    })
  },
  
  methods: {
    // 切换上传模式
    switchMode(mode) {
      this.uploadMode = mode
      // 重置状态
      this.reset()
    },
    
    // 重置所有状态
    reset() {
      this.fileSelected = false
      this.fileName = ''
      this.fileSize = ''
      this.jsonContent = ''
      this.parsedInfo = null
      this.jsonStatus = { type: 'waiting', text: '等待输入' }
      this.currentStep = 1
      this.formData = {
        customTitle: '',
        customAuthor: '',
        description: ''
      }
      // 重置图片
      this.userImages = []
      this.uploadedImageUrls = []
      this.uploadingImages = false
    },
    
    // 选择图片
    async chooseImages() {
      try {
        const remainingCount = 3 - this.uploadedImageUrls.length
        
        const res = await uni.chooseImage({
          count: remainingCount,
          sizeType: ['compressed'],  // 压缩图片
          sourceType: ['album', 'camera']
        })
        
        if (res.tempFilePaths && res.tempFilePaths.length > 0) {
          // 上传到云存储
          await this.uploadImagesToCloud(res.tempFilePaths)
        }
      } catch (error) {
        console.error('选择图片失败:', error)
        if (error.errMsg && !error.errMsg.includes('cancel')) {
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      }
    },
    
    // 上传图片到云存储
    async uploadImagesToCloud(filePaths) {
      this.uploadingImages = true
      
      try {
        uni.showLoading({ 
          title: `上传图片中 0/${filePaths.length}`,
          mask: true
        })
        
        const uploadedUrls = []
        
        for (let i = 0; i < filePaths.length; i++) {
          const filePath = filePaths[i]
          
          try {
            // 更新进度
            uni.showLoading({ 
              title: `上传图片中 ${i + 1}/${filePaths.length}`,
              mask: true
            })
            
            // 生成云存储路径
            const timestamp = Date.now()
            const random = Math.random().toString(36).substr(2, 9)
            const cloudPath = `script-images/${timestamp}-${i}-${random}.jpg`
            
            console.log(`[图片上传] 开始上传第${i + 1}张，路径:`, cloudPath)
            
            // ✅ 上传到uniCloud云存储
            const uploadResult = await uniCloud.uploadFile({
              filePath: filePath,
              cloudPath: cloudPath
            })
            
            console.log(`[图片上传] 第${i + 1}张上传成功，fileID:`, uploadResult.fileID)
            
            // ✅ 获取永久访问URL
            const tempUrlResult = await uniCloud.getTempFileURL({
              fileList: [uploadResult.fileID]
            })
            
            if (tempUrlResult.fileList && tempUrlResult.fileList[0]) {
              const permanentUrl = tempUrlResult.fileList[0].tempFileURL
              uploadedUrls.push(permanentUrl)
              console.log(`[图片上传] 第${i + 1}张获得永久URL:`, permanentUrl)
              console.log(`[图片上传] URL格式检查 - 是否HTTPS:`, permanentUrl.startsWith('https://'))
            }
            
          } catch (error) {
            console.error(`[图片上传] 第${i + 1}张上传失败:`, error)
            uni.showToast({
              title: `第${i + 1}张图片上传失败`,
              icon: 'none'
            })
          }
        }
        
        // 添加到已上传列表
        if (uploadedUrls.length > 0) {
          this.uploadedImageUrls = [...this.uploadedImageUrls, ...uploadedUrls]
          this.userImages = this.uploadedImageUrls  // 同步数据
          
          console.log('[图片上传] 所有图片上传完成')
          console.log('[图片上传] 永久URLs:', this.uploadedImageUrls)
          console.log('[图片上传] URL类型检查:', this.uploadedImageUrls.map(url => ({
            url: url.substring(0, 50) + '...',
            isHTTPS: url.startsWith('https://'),
            isCDN: url.includes('cdn')
          })))
          
          uni.hideLoading()
          uni.showToast({
            title: `✅ 成功上传${uploadedUrls.length}张图片`,
            icon: 'success',
            duration: 2000
          })
        } else {
          uni.hideLoading()
          uni.showToast({
            title: '图片上传失败',
            icon: 'none'
          })
        }
        
      } catch (error) {
        console.error('[图片上传] 上传过程出错:', error)
        uni.hideLoading()
        uni.showToast({
          title: '上传失败: ' + (error.message || '未知错误'),
          icon: 'none'
        })
      } finally {
        this.uploadingImages = false
      }
    },
    
    // 删除已上传的图片
    deleteUploadedImage(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.uploadedImageUrls.splice(index, 1)
            this.userImages = this.uploadedImageUrls
            
            uni.showToast({
              title: '已删除',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 选择JSON文件
    async chooseJsonFile() {
      try {
        const res = await uni.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['json']
        })
        
        if (res.tempFiles && res.tempFiles.length > 0) {
          const file = res.tempFiles[0]
          this.fileName = file.name
          this.fileSize = this.formatFileSize(file.size)
          this.fileSelected = true
          
          // 读取文件内容
          this.readFileContent(file.path)
        }
      } catch (error) {
        console.error('选择文件失败:', error)
        
        // 提示切换到粘贴模式
        uni.showModal({
          title: '提示',
          content: '当前环境不支持文件选择，建议切换到"粘贴内容"模式',
          confirmText: '切换',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.switchMode('paste')
            }
          }
        })
      }
    },
    
    // 读取文件内容
    readFileContent(filePath) {
      const fs = uni.getFileSystemManager()
      
      fs.readFile({
        filePath: filePath,
        encoding: 'utf8',
        success: (res) => {
          this.jsonContent = res.data
          this.validateJsonFormat()
        },
        fail: (err) => {
          console.error('读取文件失败:', err)
          uni.showToast({
            title: '读取文件失败',
            icon: 'none'
          })
          this.removeFile()
        }
      })
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes < 1024) {
        return bytes + 'B'
      } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + 'KB'
      } else {
        return (bytes / (1024 * 1024)).toFixed(2) + 'MB'
      }
    },
    
    // 移除文件
    removeFile() {
      this.fileSelected = false
      this.fileName = ''
      this.fileSize = ''
      this.jsonContent = ''
      this.parsedInfo = null
      this.jsonStatus = { type: 'waiting', text: '等待选择' }
      this.currentStep = 1
    },
    
    // 查看JSON内容
    viewJsonContent() {
      if (!this.jsonContent) return
      
      uni.showModal({
        title: 'JSON内容预览',
        content: this.jsonContent.length > 300 
          ? this.jsonContent.substring(0, 300) + '...' 
          : this.jsonContent,
        showCancel: false
      })
    },
    
    // JSON输入监听
    onJsonInput() {
      this.validateJsonFormat()
    },
    
    // 验证JSON格式
    validateJsonFormat() {
      const content = this.jsonContent.trim()
      
      if (!content) {
        this.jsonStatus = { type: 'waiting', text: '等待输入' }
        this.parsedInfo = null
        this.currentStep = 1
        return
      }
      
      try {
        const parsed = JSON.parse(content)
        this.jsonStatus = { type: 'success', text: '✓ 格式正确' }
        this.parseScriptData(parsed)
        this.currentStep = 2
      } catch (error) {
        this.jsonStatus = { type: 'error', text: '✗ 格式错误' }
        this.parsedInfo = null
        this.currentStep = 1
      }
    },
    
    // 解析剧本数据
    parseScriptData(json) {
      try {
        let title = '未命名剧本'
        let author = '未知作者'
        let characters = []
        let description = ''
        
        if (Array.isArray(json)) {
          const metaObj = json.find(item => item.id === '_meta')
          if (metaObj) {
            title = metaObj.name || metaObj.title || title
            author = metaObj.author || author
          }
          characters = json.filter(item => item.id !== '_meta' && item.team !== 'jinxed')
        } else {
          title = json.name || json.title || title
          author = json.author || author
          description = json.description || ''
          characters = json.characters || []
        }
        
        // 角色分类
        const rolesByTeam = {
          townsfolk: [],
          outsider: [],
          minion: [],
          demon: [],
          traveler: [],
          fabled: []
        }
        
        characters.forEach(char => {
          const team = char.team
          if (rolesByTeam[team]) {
            rolesByTeam[team].push(char)
          }
        })
        
        const roleCounts = Object.entries(rolesByTeam)
          .map(([team, chars]) => ({ team, count: chars.length }))
          .filter(item => item.count > 0)
        
        const totalChars = characters.length
        const playerCount = totalChars > 0 ? `${Math.ceil(totalChars * 0.8)}人左右` : '未知'
        
        this.parsedInfo = {
          title,
          author,
          totalCharacters: totalChars,
          playerCount,
          roleCounts,
          description
        }
      } catch (error) {
        console.error('解析失败:', error)
        this.parsedInfo = null
      }
    },
    
    // 格式化JSON
    formatJson() {
      try {
        const obj = JSON.parse(this.jsonContent)
        this.jsonContent = JSON.stringify(obj, null, 2)
        uni.showToast({
          title: '格式化成功',
          icon: 'success'
        })
      } catch (error) {
        uni.showToast({
          title: 'JSON格式错误',
          icon: 'none'
        })
      }
    },
    
    // 验证JSON
    validateJson() {
      this.validateJsonFormat()
      if (this.jsonStatus.type === 'success') {
        uni.showToast({
          title: '验证通过',
          icon: 'success'
        })
      } else {
        uni.showToast({
          title: 'JSON格式错误',
          icon: 'none'
        })
      }
    },
    
    // 清空JSON
    clearJson() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有内容吗？',
        success: (res) => {
          if (res.confirm) {
            this.reset()
          }
        }
      })
    },
    
    // 提交上传
    async handleSubmit() {
      if (!this.jsonContent) {
        uni.showToast({
          title: '请先输入JSON内容',
          icon: 'none'
        })
        return
      }
      
      if (this.jsonStatus.type !== 'success') {
        uni.showToast({
          title: 'JSON格式错误',
          icon: 'none'
        })
        return
      }
      
      this.currentStep = 3
      this.uploading = true
      
      try {
        // 优先级：用户输入 > JSON值
        const finalTitle = this.formData.customTitle.trim() || this.parsedInfo.title
        const finalAuthor = this.formData.customAuthor.trim() || this.parsedInfo.author
        
        // ✅ 构建上传数据，包含用户上传的图片
        const uploadData = {
          title: finalTitle,
          author: finalAuthor,
          description: this.formData.description || this.parsedInfo.description,
          json: this.jsonContent,
          user_images: this.uploadedImageUrls  // ✅ 添加图片URL数组
        }
        
        console.log('[剧本提交] 提交数据:', {
          title: finalTitle,
          author: finalAuthor,
          user_images_count: this.uploadedImageUrls.length,
          user_images: this.uploadedImageUrls
        })
        
        const res = await this.scriptObj.upload(uploadData)
        
        if (res.code === 0) {
          // 保存生成的预览图
          this.uploadedPreviewImage = res.data.previewImage || ''
          this.currentStep = 3
          
          console.log('[剧本提交] 上传成功，返回数据:', res.data)
          
          // 延迟显示成功提示，让用户先看到预览图
          setTimeout(() => {
            uni.showModal({
              title: '上传成功',
              content: `剧本已提交审核\n预览图已自动生成${this.uploadedImageUrls.length > 0 ? '\n用户图片：' + this.uploadedImageUrls.length + '张' : ''}\n\n使用信息：\n标题：${finalTitle}\n作者：${finalAuthor}`,
              confirmText: '查看我的上传',
              cancelText: '继续上传',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  uni.redirectTo({
                    url: '/pages/user/my-uploads/my-uploads'
                  })
                } else {
                  // 重置表单，允许继续上传
                  this.reset()
                }
              }
            })
          }, 1000)
        } else {
          throw new Error(res.result.message || '上传失败')
        }
      } catch (error) {
        console.error('上传失败:', error)
        uni.showModal({
          title: '上传失败',
          content: error.message || '请稍后重试',
          showCancel: false
        })
      } finally {
        this.uploading = false
      }
    },
    
    // 获取阵营emoji
    getTeamEmoji(team) {
      const emojis = {
        townsfolk: '👥',
        outsider: '🏃',
        minion: '🗡️',
        demon: '😈',
        traveler: '🧳',
        fabled: '⭐'
      }
      return emojis[team] || '❓'
    },
    
    // 获取阵营名称
    getTeamName(team) {
      const names = {
        townsfolk: '镇民',
        outsider: '外来者',
        minion: '爪牙',
        demon: '恶魔',
        traveler: '旅行者',
        fabled: '传奇角色'
      }
      return names[team] || '未知'
    },
    
    // 预览图片（点击放大）
    previewImage() {
      if (!this.uploadedPreviewImage) return
      
      uni.previewImage({
        urls: [this.uploadedPreviewImage],
        current: this.uploadedPreviewImage,
        longPressActions: {
          itemList: ['保存图片'],
          success: (data) => {
            if (data.tapIndex === 0) {
              this.savePreviewImage()
            }
          }
        }
      })
    },
    
    // 保存预览图
    async savePreviewImage() {
      try {
        uni.showLoading({ title: '保存中...' })
        
        // 保存到相册
        await uni.saveImageToPhotosAlbum({
          filePath: this.uploadedPreviewImage
        })
        
        uni.showToast({
          title: '预览图已保存',
          icon: 'success'
        })
      } catch (error) {
        console.error('保存失败:', error)
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 40rpx;
}

/* 页面头部 */
.header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.header-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 12rpx;
}

.header-subtitle {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 上传方式切换 */
.mode-switch {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
}

.mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 20rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%);
  border: 3rpx solid #f5576c;
}

.mode-icon {
  font-size: 60rpx;
  margin-bottom: 12rpx;
}

.mode-text {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.mode-btn.active .mode-text {
  color: #f5576c;
}

.mode-sub {
  font-size: 22rpx;
  color: #999;
}

.mode-btn.active .mode-sub {
  color: #f5576c;
}

/* 区块 */
.section {
  margin: 0 24rpx 24rpx;
  padding: 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
}

/* JSON状态 */
.json-status {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.json-status.waiting {
  background: #f0f0f0;
  color: #999;
}

.json-status.success {
  background: #f6ffed;
  color: #52c41a;
}

.json-status.error {
  background: #fff2f0;
  color: #f5222d;
}

/* 文件上传按钮 */
.upload-btn {
  width: 100%;
  padding: 0;
  border: 3rpx dashed #d9d9d9;
  border-radius: 12rpx;
  background: #fafafa;
  line-height: 1;
}

.upload-empty {
  padding: 60rpx 24rpx;
  text-align: center;
}

.upload-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 20rpx;
  opacity: 0.6;
}

.upload-text {
  display: block;
  font-size: 30rpx;
  color: #666;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.upload-hint {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.upload-filled {
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.file-icon {
  font-size: 48rpx;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.file-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.file-size {
  font-size: 24rpx;
  color: #999;
}

.file-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.btn-action {
  flex: 1;
  background: white;
  color: #1890ff;
  border: 2rpx solid #1890ff;
  font-size: 24rpx;
}

/* JSON输入框 */
.json-input {
  width: 100%;
  min-height: 400rpx;
  padding: 24rpx;
  background: #fafafa;
  border-radius: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  font-family: 'Courier New', monospace;
  color: #333;
  border: 2rpx solid #e0e0e0;
}

.button-group {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.btn-secondary {
  flex: 1;
  background: white;
  color: #f5576c;
  border: 2rpx solid #f5576c;
  font-size: 24rpx;
}

/* 解析信息 */
.parsed-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.parse-success {
  font-size: 22rpx;
  color: #52c41a;
}

.info-row {
  display: flex;
  font-size: 26rpx;
  line-height: 1.6;
}

.info-label {
  color: #999;
  min-width: 160rpx;
}

.info-value {
  color: #333;
  flex: 1;
  font-weight: 500;
}

.info-hint {
  font-size: 22rpx;
  color: #999;
}

/* 角色统计 */
.roles-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.role-count-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #fafafa;
  border-radius: 30rpx;
  font-size: 24rpx;
}

.role-emoji {
  font-size: 28rpx;
}

.role-name {
  color: #666;
}

.role-num {
  color: #f5576c;
  font-weight: bold;
}

/* 表单 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.form-hint {
  font-size: 22rpx;
  color: #999;
  line-height: 1.4;
}

.form-input {
  height: 80rpx;
  padding: 0 24rpx;
  background: #fafafa;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: 2rpx solid #e0e0e0;
}

.form-textarea {
  min-height: 160rpx;
  padding: 20rpx 24rpx;
  background: #fafafa;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  border: 2rpx solid #e0e0e0;
}

/* 预览图展示区 */
.preview-display-section {
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  border-left: 6rpx solid #52c41a;
}

.preview-success {
  font-size: 22rpx;
  color: #52c41a;
  padding: 6rpx 16rpx;
  background: #f6ffed;
  border-radius: 20rpx;
}

.preview-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.preview-img {
  width: 100%;
  max-width: 520rpx;
  border-radius: 12rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.preview-hint {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

/* 预览提示 */
.preview-tip-section {
  background: linear-gradient(135deg, #fff9e6 0%, #fff0cc 100%);
  border-left: 6rpx solid #faad14;
}

.preview-tip-box {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.tip-icon {
  font-size: 48rpx;
}

.tip-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tip-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.tip-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

/* 提交区域 */
.submit-section {
  padding: 0 24rpx;
  margin-top: 40rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  box-shadow: 0 8rpx 24rpx rgba(245, 87, 108, 0.3);
  border: none;
}

.submit-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}

.upload-tips {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 24rpx;
  background: white;
  border-radius: 12rpx;
}

.tip-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

/* 通用卡片 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

/* 图片上传提示框 */
.upload-hint-box {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #e6f7ff 0%, #d9f0ff 100%);
  border-radius: 12rpx;
  border: 1rpx solid #91d5ff;
  margin-bottom: 24rpx;
}

.hint-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.hint-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.hint-text {
  font-size: 26rpx;
  color: #0050b3;
  font-weight: 500;
  line-height: 1.5;
}

.hint-sub {
  font-size: 22rpx;
  color: #096dd9;
  line-height: 1.5;
}

/* 图片数量计数 */
.images-count {
  font-size: 24rpx;
  color: #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #d9f0ff 100%);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  font-weight: 600;
}

/* 图片上传区域 */
.images-upload-area {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 已上传图片列表 */
.uploaded-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;  /* 1:1 比例 */
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  background: #f5f5f5;
}

.uploaded-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4rpx);
  transition: all 0.3s ease;
}

.img-delete:active {
  background: rgba(245, 34, 45, 0.9);
  transform: scale(0.9);
}

.delete-icon {
  color: white;
  font-size: 36rpx;
  font-weight: bold;
  line-height: 1;
}

.img-status {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 12rpx 8rpx 8rpx;
  text-align: center;
}

.status-text {
  font-size: 20rpx;
  color: #52c41a;
  font-weight: 600;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.5);
}

/* 图片上传按钮 */
.image-upload-btn {
  width: 100%;
  height: 160rpx;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 3rpx dashed #d9d9d9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  transition: all 0.3s ease;
}

.image-upload-btn:not([disabled]):active {
  background: linear-gradient(135deg, #e6f7ff 0%, #d9f0ff 100%);
  border-color: #1890ff;
  transform: scale(0.98);
}

.image-upload-btn[disabled] {
  opacity: 0.5;
}

.upload-btn-icon {
  font-size: 56rpx;
  opacity: 0.6;
}

.upload-btn-text {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.image-upload-btn:not([disabled]):active .upload-btn-text {
  color: #1890ff;
}
</style>
