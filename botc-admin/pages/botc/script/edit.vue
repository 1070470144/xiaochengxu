<template>
  <view class="uni-container">
    <view class="uni-header">
      <view class="uni-title">{{ isEdit ? '编辑剧本' : '添加剧本' }}</view>
    </view>

    <view class="form-container">
      <uni-forms 
        ref="form" 
        :modelValue="formData" 
        :rules="rules" 
        label-width="120px">
        
        <!-- 基本信息 -->
        <uni-section title="基本信息" type="line">
          <uni-forms-item label="剧本标题" name="title" required>
            <input 
              v-model="formData.title" 
              placeholder="请输入剧本标题"
              maxlength="100"
              class="uni-input" />
          </uni-forms-item>

          <uni-forms-item label="副标题" name="subtitle">
            <input 
              v-model="formData.subtitle" 
              placeholder="请输入副标题（选填）"
              maxlength="200"
              class="uni-input" />
          </uni-forms-item>

          <uni-forms-item label="作者" name="author">
            <input 
              v-model="formData.author" 
              placeholder="请输入作者"
              maxlength="50"
              class="uni-input" />
          </uni-forms-item>

          <uni-forms-item label="剧本类型" name="script_type" required>
            <uni-data-select 
              v-model="formData.script_type" 
              :localdata="typeOptions">
            </uni-data-select>
          </uni-forms-item>

          <uni-forms-item label="难度等级" name="difficulty">
            <uni-data-select 
              v-model="formData.difficulty" 
              :localdata="difficultyOptions">
            </uni-data-select>
          </uni-forms-item>

          <uni-forms-item label="玩家人数" name="player_count">
            <input 
              v-model="formData.player_count" 
              placeholder="例如：5-7人"
              maxlength="20"
              class="uni-input" />
          </uni-forms-item>

          <uni-forms-item label="预计时长" name="duration">
            <input 
              v-model.number="formData.duration" 
              type="number" 
              placeholder="请输入时长（分钟）"
              class="uni-input" />
          </uni-forms-item>
        </uni-section>

        <!-- 详细描述 -->
        <uni-section title="详细描述" type="line">
          <uni-forms-item label="剧本描述" name="description">
            <textarea 
              v-model="formData.description" 
              placeholder="请输入剧本描述"
              maxlength="1000"
              :auto-height="true"
              class="uni-textarea" />
          </uni-forms-item>

          <uni-forms-item label="标签" name="tags">
            <view class="tags-input">
              <view class="tag-list">
                <uni-tag 
                  v-for="(tag, index) in formData.tags" 
                  :key="index"
                  :text="tag"
                  type="primary"
                  size="small"
                  closable
                  @close="removeTag(index)" />
              </view>
              <input 
                v-model="newTag" 
                placeholder="输入标签后按回车添加"
                @confirm="addTag"
                class="uni-input tag-input" />
            </view>
          </uni-forms-item>
        </uni-section>

        <!-- JSON文件上传 -->
        <uni-section title="剧本JSON文件" type="line">
          <uni-forms-item label="JSON文件" name="json_file">
            <view class="json-upload-section">
              <!-- 未上传状态 -->
              <view v-if="!jsonFileName" class="upload-box">
                <button @click="selectJsonFile" class="upload-btn" type="default">
                  📁 选择JSON文件
                </button>
                <text class="upload-hint">支持标准血染钟楼JSON格式（数组格式）</text>
              </view>
              
              <!-- 已上传状态 -->
              <view v-else class="json-uploaded">
                <view class="json-file-info">
                  <text class="file-name">✅ {{ jsonFileName }}</text>
                  <text class="file-size">大小：{{ formatFileSize(jsonFileSize) }}</text>
                  <text class="role-count">角色数：{{ jsonRoleCount }}</text>
                </view>
                <button @click="removeJsonFile" class="btn-remove" type="default">
                  <text>🗑️ 移除</text>
                </button>
              </view>
            </view>
          </uni-forms-item>
        </uni-section>

        <!-- 用户上传图片 -->
        <uni-section title="剧本图片" type="line">
          <uni-forms-item label="上传图片" name="user_images">
            <view class="image-upload-hint">
              <text>💡 可上传0-3张图片（如剧本介绍图、玩法说明图等）</text>
              <text>📌 系统会根据JSON自动生成预览图</text>
              <text v-if="uploadingImages" class="uploading-text">⏳ 正在上传图片到云存储...</text>
            </view>
            <uni-file-picker 
              v-model="userImages" 
              :limit="3"
              file-mediatype="image"
              mode="grid"
              @select="handleUserImagesSelect"
              @delete="handleUserImagesDelete">
            </uni-file-picker>
          </uni-forms-item>
        </uni-section>

        <!-- 发布设置 -->
        <uni-section title="发布设置" type="line">
          <uni-forms-item label="状态" name="status">
            <uni-data-select 
              v-model="formData.status" 
              :localdata="statusOptions">
            </uni-data-select>
          </uni-forms-item>

          <uni-forms-item label="是否精选" name="is_featured">
            <switch :checked="formData.is_featured" @change="handleFeaturedChange" />
          </uni-forms-item>
        </uni-section>

        <!-- 统计数据（仅编辑时显示） -->
        <uni-section v-if="isEdit" title="统计数据" type="line">
          <uni-forms-item label="浏览量">
            <text>{{ formData.view_count || 0 }}</text>
          </uni-forms-item>
          <uni-forms-item label="下载量">
            <text>{{ formData.download_count || 0 }}</text>
          </uni-forms-item>
          <uni-forms-item label="收藏量">
            <text>{{ formData.favorite_count || 0 }}</text>
          </uni-forms-item>
          <uni-forms-item label="评分">
            <text>{{ formData.rating ? formData.rating.toFixed(1) : '0.0' }} ({{ formData.rating_count || 0 }}人评价)</text>
          </uni-forms-item>
        </uni-section>

        <!-- 操作按钮 -->
        <view class="form-actions">
          <button 
            type="primary" 
            @click="handleSubmit"
            :disabled="uploadingImages">
            {{ uploadingImages ? '图片上传中，请稍候...' : '保存' }}
          </button>
          <button @click="handleCancel">取消</button>
        </view>
      </uni-forms>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      adminScriptObj: null, // AdminScript云对象实例
      isEdit: false,
      scriptId: '',
      formData: {
        title: '',
        subtitle: '',
        author: '',
        script_type: 1,
        difficulty: 2,
        player_count: '',
        duration: null,
        description: '',
        tags: [],
        cover_image: '',
        user_images: [],
        preview_image: '',
        status: 0,
        is_featured: false,
        creator_id: 'admin'
      },
      newTag: '',
      coverImages: [],
      userImages: [],
      uploadingImages: false,
      jsonFileName: '',
      jsonFileSize: 0,
      jsonRoleCount: 0,
      rules: {
        title: {
          rules: [
            { required: true, errorMessage: '请输入剧本标题' },
            { maxLength: 100, errorMessage: '标题不能超过100个字符' }
          ]
        },
        script_type: {
          rules: [
            { required: true, errorMessage: '请选择剧本类型' }
          ]
        }
      },
      typeOptions: [
        { value: 1, text: '推理' },
        { value: 2, text: '娱乐' }
      ],
      difficultyOptions: [
        { value: 1, text: '简单' },
        { value: 2, text: '中等' },
        { value: 3, text: '困难' },
        { value: 4, text: '专家' }
      ],
      statusOptions: [
        { value: 0, text: '待审核' },
        { value: 1, text: '已发布' },
        { value: 2, text: '已下架' }
      ]
    }
  },

  onLoad(options) {
    // 初始化云对象
    this.adminScriptObj = uniCloud.importObject('admin-script', { customUI: true })
    
    if (options.id) {
      this.isEdit = true
      this.scriptId = options.id
      this.loadData()
    }
  },

  methods: {
    async loadData() {
      try {
        const res = await db.collection('botc-scripts')
          .doc(this.scriptId)
          .get()
        
        if (res.result.data && res.result.data.length > 0) {
          this.formData = {
            ...this.formData,
            ...res.result.data[0]
          }
          
          // 处理封面图片（兼容旧数据）
          if (this.formData.cover_image) {
            this.coverImages = [{
              url: this.formData.cover_image,
              name: 'cover'
            }]
          }
          
          // 处理用户上传的图片
          if (this.formData.user_images && Array.isArray(this.formData.user_images)) {
            this.userImages = this.formData.user_images.map((url, index) => ({
              url: url,
              name: `image_${index}`
            }))
          }
        }
      } catch (error) {
        console.error('加载数据失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },

    addTag() {
      if (this.newTag.trim()) {
        if (!this.formData.tags) {
          this.formData.tags = []
        }
        if (!this.formData.tags.includes(this.newTag.trim())) {
          this.formData.tags.push(this.newTag.trim())
        }
        this.newTag = ''
      }
    },

    removeTag(index) {
      this.formData.tags.splice(index, 1)
    },

    handleCoverSelect(e) {
      console.log('选择封面：', e)
      // 这里可以实现图片上传到云存储
      // 暂时使用本地路径
    },

    handleCoverDelete() {
      this.formData.cover_image = ''
      this.coverImages = []
    },
    
    async handleUserImagesSelect(e) {
      console.log('选择用户图片：', e)
      
      const tempFiles = e.tempFiles || []
      if (tempFiles.length === 0) return
      
      this.uploadingImages = true
      
      try {
        const uploadedUrls = []
        
        // 上传每个图片到云存储
        for (let i = 0; i < tempFiles.length && i < 3; i++) {
          const file = tempFiles[i]
          console.log(`上传图片 ${i + 1}/${tempFiles.length}:`, file.name)
          
          // 生成云存储路径
          const timestamp = Date.now()
          const random = Math.random().toString(36).substring(2, 8)
          const ext = file.name.split('.').pop()
          const cloudPath = `script-images/${timestamp}-${random}.${ext}`
          
          // 上传到云存储
          const uploadResult = await uniCloud.uploadFile({
            filePath: file.path,
            cloudPath: cloudPath,
            onUploadProgress: (progressEvent) => {
              console.log('上传进度:', progressEvent)
            }
          })
          
          if (uploadResult.fileID) {
            // 获取文件的HTTP访问地址
            const tempUrlRes = await uniCloud.getTempFileURL({
              fileList: [uploadResult.fileID]
            })
            
            if (tempUrlRes.fileList && tempUrlRes.fileList.length > 0) {
              const fileUrl = tempUrlRes.fileList[0].tempFileURL
              uploadedUrls.push(fileUrl)
              console.log(`图片 ${i + 1} 上传成功:`, fileUrl)
            }
          }
        }
        
        // 更新formData
        this.formData.user_images = uploadedUrls
        
        // 更新显示
        this.userImages = uploadedUrls.map((url, index) => ({
          url: url,
          name: `image_${index}`
        }))
        
        uni.showToast({
          title: `成功上传${uploadedUrls.length}张图片`,
          icon: 'success'
        })
        
      } catch (error) {
        console.error('上传图片失败：', error)
        uni.showToast({
          title: '上传失败：' + error.message,
          icon: 'none'
        })
      } finally {
        this.uploadingImages = false
      }
    },
    
    handleUserImagesDelete(e) {
      console.log('删除用户图片：', e)
      
      // 更新formData中的图片数组
      if (this.userImages && Array.isArray(this.userImages)) {
        this.formData.user_images = this.userImages.map(img => img.url)
      } else {
        this.formData.user_images = []
      }
      
      console.log('图片已更新：', this.formData.user_images)
    },

    handleFeaturedChange(e) {
      this.formData.is_featured = e.detail.value
    },
    
    // 选择JSON文件（参考批量上传的实现）
    selectJsonFile() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        this.onJsonFileChange(e)
      }
      input.click()
    },
    
    // 处理JSON文件选择
    onJsonFileChange(e) {
      const file = e.target.files[0]
      if (!file) return
      
      console.log('选择JSON文件：', file.name, file.size)
      
      // 检查文件类型
      if (!file.name.endsWith('.json')) {
        uni.showToast({
          title: '请选择.json文件',
          icon: 'none'
        })
        return
      }
      
      // 检查文件大小（限制10MB）
      if (file.size > 10 * 1024 * 1024) {
        uni.showToast({
          title: 'JSON文件不能超过10MB',
          icon: 'none'
        })
        return
      }
      
      // 读取文件
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const jsonString = event.target.result
          const jsonData = JSON.parse(jsonString)
          
          console.log('JSON解析成功')
          
          // 验证JSON格式（必须是数组）
          if (!Array.isArray(jsonData)) {
            uni.showToast({
              title: 'JSON格式错误：必须是数组格式',
              icon: 'none',
              duration: 3000
            })
            return
          }
          
          // 保存JSON数据
          this.formData.json_data = jsonData
          this.jsonFileName = file.name
          this.jsonFileSize = file.size
          
          // 计算角色数量
          this.jsonRoleCount = jsonData.filter(item => {
            return item.team && !['fabled', 'a jinxed'].includes(item.team)
          }).length
          
          // 自动填充表单（如果字段为空）
          const metaItem = jsonData.find(item => item.id === '_meta')
          if (metaItem) {
            if (!this.formData.title) {
              this.formData.title = metaItem.name || ''
            }
            if (!this.formData.author) {
              this.formData.author = metaItem.author || ''
            }
            if (!this.formData.description) {
              this.formData.description = metaItem.description || ''
            }
          }
          
          uni.showToast({
            title: '✅ JSON文件上传成功',
            icon: 'success'
          })
          
        } catch (error) {
          console.error('JSON解析失败：', error)
          uni.showToast({
            title: 'JSON格式错误：' + error.message,
            icon: 'none',
            duration: 3000
          })
        }
      }
      
      reader.onerror = () => {
        uni.showToast({
          title: '文件读取失败',
          icon: 'none'
        })
      }
      
      reader.readAsText(file, 'UTF-8')
    },
    
    // 移除JSON文件
    removeJsonFile() {
      this.formData.json_data = null
      this.jsonFileName = ''
      this.jsonFileSize = 0
      this.jsonRoleCount = 0
      
      uni.showToast({
        title: 'JSON文件已移除',
        icon: 'success'
      })
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    },

    async handleSubmit() {
      try {
        // 检查图片是否还在上传
        if (this.uploadingImages) {
          uni.showToast({
            title: '图片正在上传，请稍候...',
            icon: 'none'
          })
          return
        }
        
        // 表单验证
        await this.$refs.form.validate()

        uni.showLoading({
          title: '保存中...'
        })

        const data = { ...this.formData }
        
        // 同步生成预览图（使用压缩）
        if (data.json_data) {
          try {
            uni.showLoading({
              title: '生成预览图...'
            })
            
            console.log('[保存剧本] 开始生成预览图（压缩版）')
            
            // 调用云对象生成预览图
            const previewRes = await this.adminScriptObj.generatePreview({
              title: data.title,
              author: data.author || '未知',
              jsonData: data.json_data
            })
            
            if (previewRes.code === 0) {
              data.preview_image = previewRes.data.previewImage
              console.log('[保存剧本] 预览图生成成功')
            }
            
            uni.showLoading({
              title: '保存中...'
            })
          } catch (error) {
            console.error('[保存剧本] 生成预览图失败:', error)
            
            if (error.message && (error.message.includes('413') || error.message.includes('Too Large'))) {
              uni.showToast({
                title: '图片过多，将不生成预览图',
                icon: 'none',
                duration: 2000
              })
            }
            // 预览图生成失败不影响保存，继续执行
          }
        }
        
        // 如果是发布状态且没有发布时间，添加发布时间
        if (data.status === 1 && !data.published_at) {
          data.published_at = Date.now()
        }
        
        // 调试日志：确认保存的数据
        console.log('准备保存的数据：', {
          title: data.title,
          hasPreviewImage: !!data.preview_image,
          userImagesCount: data.user_images?.length || 0,
          userImages: data.user_images
        })

        if (this.isEdit) {
          // 更新时需要移除_id字段（不能更新_id）
          const updateData = { ...data }
          delete updateData._id
          
          await db.collection('botc-scripts')
            .doc(this.scriptId)
            .update(updateData)
        } else {
          // 创建
          const addResult = await db.collection('botc-scripts')
            .add(data)
          console.log('保存结果：', addResult)
        }

        uni.hideLoading()
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        })

        setTimeout(() => {
          uni.navigateBack()
        }, 1500)

      } catch (error) {
        uni.hideLoading()
        console.error('保存失败：', error)
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        })
      }
    },

    handleCancel() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.uni-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.uni-header {
  margin-bottom: 20px;
}

.uni-title {
  font-size: 24px;
  font-weight: bold;
}

.form-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.uni-input,
.uni-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.uni-textarea {
  min-height: 100px;
  resize: vertical;
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-input {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 30px;
}

.form-actions button {
  min-width: 120px;
}

/* 图片上传提示 */
.image-upload-hint {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 15px;
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
  border-radius: 4px;
  margin-bottom: 15px;
}

.image-upload-hint text {
  font-size: 13px;
  color: #0050b3;
  line-height: 1.6;
}

.uploading-text {
  color: #faad14 !important;
  font-weight: bold;
}

/* JSON文件上传 */
.json-upload-section {
  width: 100%;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  gap: 10px;
}

.upload-btn {
  min-width: 200px;
  background: #409eff !important;
  color: white !important;
  border: none !important;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.upload-btn::after {
  border: none !important;
}

.upload-btn:hover {
  background: #66b1ff !important;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.json-uploaded {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #67c23a;
  border-radius: 8px;
  background: #f0f9ff;
}

.json-file-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.file-name {
  font-size: 14px;
  color: #67c23a;
  font-weight: bold;
}

.file-size,
.role-count {
  font-size: 12px;
  color: #606266;
}

.btn-remove {
  padding: 5px 15px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-remove:hover {
  background: #f78989;
}
</style>

