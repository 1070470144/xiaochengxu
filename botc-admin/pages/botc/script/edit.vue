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

        <!-- 封面图片 -->
        <uni-section title="封面图片" type="line">
          <uni-forms-item label="封面图" name="cover_image">
            <uni-file-picker 
              v-model="coverImages" 
              :limit="1"
              :auto-upload="false"
              @select="handleCoverSelect"
              @delete="handleCoverDelete">
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
          <button type="primary" @click="handleSubmit">保存</button>
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
        status: 0,
        is_featured: false,
        creator_id: 'admin'
      },
      newTag: '',
      coverImages: [],
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
          
          // 处理封面图片
          if (this.formData.cover_image) {
            this.coverImages = [{
              url: this.formData.cover_image,
              name: 'cover'
            }]
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

    handleFeaturedChange(e) {
      this.formData.is_featured = e.detail.value
    },

    async handleSubmit() {
      try {
        // 表单验证
        await this.$refs.form.validate()

        uni.showLoading({
          title: '保存中...'
        })

        const data = { ...this.formData }
        
        // 如果是发布状态且没有发布时间，添加发布时间
        if (data.status === 1 && !data.published_at) {
          data.published_at = Date.now()
        }

        if (this.isEdit) {
          // 更新
          await db.collection('botc-scripts')
            .doc(this.scriptId)
            .update(data)
        } else {
          // 创建
          await db.collection('botc-scripts')
            .add(data)
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
</style>

