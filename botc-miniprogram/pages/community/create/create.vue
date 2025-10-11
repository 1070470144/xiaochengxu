<template>
  <view class="create-page">
    <!-- 内容输入 -->
    <view class="content-section">
      <textarea
        class="content-input"
        v-model="content"
        placeholder="分享你的游戏心得、拼车经验..."
        :maxlength="5000"
        :auto-height="true"
        :show-confirm-bar="false"
      />
      <view class="char-count">{{ content.length }}/5000</view>
    </view>

    <!-- 图片选择 -->
    <view class="images-section">
      <view class="images-grid">
        <view 
          v-for="(img, index) in images" 
          :key="index"
          class="image-item"
        >
          <image :src="img" mode="aspectFill" class="image" />
          <view class="delete-btn" @click="deleteImage(index)">
            <uni-icons type="closeempty" size="20" color="#fff" />
          </view>
        </view>
        
        <view 
          v-if="images.length < 9" 
          class="upload-btn"
          @click="chooseImage"
        >
          <uni-icons type="camera" size="40" color="#999" />
          <text class="upload-text">{{ images.length }}/9</text>
        </view>
      </view>
    </view>

    <!-- 标签选择 -->
    <view class="tags-section">
      <view class="section-title">添加标签（最多5个）</view>
      <view class="tags-list">
        <view 
          v-for="tag in allTags" 
          :key="tag"
          class="tag-item"
          :class="{ selected: selectedTags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </view>
      </view>
    </view>

    <!-- 发布按钮 -->
    <view class="footer">
      <button 
        class="publish-btn"
        :disabled="publishing || !content.trim()"
        @click="publishPost"
      >
        {{ publishing ? '发布中...' : '发布' }}
      </button>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'CreatePost',
  
  data() {
    return {
      content: '',
      images: [],
      selectedTags: [],
      allTags: [
        '血染钟楼', '拼车', '剧本', '新手', '攻略',
        '心得', '推荐', '组局', '说书人', '角色'
      ],
      publishing: false
    }
  },
  
  methods: {
    // 选择图片
    chooseImage() {
      const maxCount = 9 - this.images.length
      
      uni.chooseImage({
        count: maxCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          uni.showLoading({ title: '上传中...' })
          
          try {
            // 上传到云存储
            for (let i = 0; i < res.tempFilePaths.length; i++) {
              const tempPath = res.tempFilePaths[i]
              
              const uploadResult = await uniCloud.uploadFile({
                filePath: tempPath,
                cloudPath: `community/${Date.now()}_${i}.jpg`
              })
              
              this.images.push(uploadResult.fileID)
            }
            
            uni.hideLoading()
          } catch (error) {
            console.error('上传图片失败：', error)
            uni.hideLoading()
            uni.showToast({
              title: '图片上传失败',
              icon: 'none'
            })
          }
        }
      })
    },
    
    // 删除图片
    deleteImage(index) {
      this.images.splice(index, 1)
    },
    
    // 切换标签
    toggleTag(tag) {
      const index = this.selectedTags.indexOf(tag)
      
      if (index > -1) {
        this.selectedTags.splice(index, 1)
      } else {
        if (this.selectedTags.length >= 5) {
          uni.showToast({
            title: '最多选择5个标签',
            icon: 'none'
          })
          return
        }
        this.selectedTags.push(tag)
      }
    },
    
    // 发布帖子
    async publishPost() {
      if (!this.content.trim()) {
        uni.showToast({
          title: '请输入内容',
          icon: 'none'
        })
        return
      }
      
      if (this.content.length > 5000) {
        uni.showToast({
          title: '内容不能超过5000字',
          icon: 'none'
        })
        return
      }
      
      this.publishing = true
      
      try {
        const token = Auth.getToken()
        
        const result = await uniCloud.callFunction({
          name: 'post-create',
          data: {
            token: token,
            content: this.content.trim(),
            images: this.images,
            tags: this.selectedTags,
            type: 1
          }
        })
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '发布成功',
            icon: 'success'
          })
          
          // 通知列表页刷新
          const eventChannel = this.getOpenerEventChannel()
          if (eventChannel) {
            eventChannel.emit('publishSuccess')
          }
          
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('发布失败：', error)
        uni.showToast({
          title: error.message || '发布失败',
          icon: 'none'
        })
      } finally {
        this.publishing = false
      }
    }
  }
}
</script>

<style scoped>
.create-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 120rpx;
}

.content-section {
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.content-input {
  width: 100%;
  min-height: 300rpx;
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 20rpx;
}

.images-section {
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
}

.image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.delete-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  width: 100%;
  padding-bottom: 100%;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.upload-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.tags-section {
  padding: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.tag-item {
  padding: 10rpx 24rpx;
  background: #f0f0f0;
  color: #666;
  font-size: 26rpx;
  border-radius: 40rpx;
  transition: all 0.3s;
}

.tag-item.selected {
  background: #8B4513;
  color: #fff;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.publish-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 40rpx;
  border: none;
}

.publish-btn[disabled] {
  opacity: 0.5;
}
</style>

