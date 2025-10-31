<template>
  <view class="page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">发起拼车</text>
      <text class="page-subtitle">填写拼车信息，邀请志同道合的玩家</text>
    </view>

    <view class="container">
      <!-- 基础信息卡片 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-icon">📝</view>
          <text class="section-title">基础信息</text>
        </view>
        <view class="section-body">
          <uni-forms :model="formData" ref="form" :rules="formRules">
            <uni-forms-item label="拼车标题" required name="title">
              <uni-easyinput v-model="formData.title" placeholder="请输入拼车标题" maxlength="100"></uni-easyinput>
            </uni-forms-item>

            <uni-forms-item label="游戏时间" required name="gameTime">
              <uni-datetime-picker 
                v-model="formData.gameTime" 
                type="datetime"
                placeholder="请选择游戏时间"
                :clear-icon="true">
              </uni-datetime-picker>
            </uni-forms-item>

            <uni-forms-item label="游戏地点" required name="location">
              <uni-easyinput v-model="formData.location" placeholder="请输入游戏地点" maxlength="200"></uni-easyinput>
            </uni-forms-item>

            <uni-forms-item label="详细地址" name="locationDetail">
              <uni-easyinput 
                v-model="formData.locationDetail" 
                placeholder="详细地址、交通指引等（可选）" 
                type="textarea"
                maxlength="500">
              </uni-easyinput>
            </uni-forms-item>

            <uni-forms-item label="需要人数" required name="maxPlayers">
              <uni-data-select 
                v-model="formData.maxPlayers"
                :localdata="playerCountOptions"
                placeholder="请选择需要人数">
              </uni-data-select>
            </uni-forms-item>

            <uni-forms-item label="关联剧本" name="scriptId">
              <uni-data-select 
                v-model="formData.scriptId"
                :localdata="scriptOptions"
                placeholder="选择要玩的剧本（可选）"
                :clear="true">
              </uni-data-select>
            </uni-forms-item>

            <uni-forms-item label="说书人" name="storytellerId">
              <uni-data-select 
                v-model="formData.storytellerId"
                :localdata="storytellerOptions"
                placeholder="已确定说书人（可选）"
                :clear="true">
              </uni-data-select>
            </uni-forms-item>
          </uni-forms>
        </view>
      </view>

      <!-- 详细描述卡片 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-icon">📋</view>
          <text class="section-title">详细说明</text>
        </view>
        <view class="section-body">
          <view class="textarea-wrapper">
            <textarea 
              v-model="formData.description"
              placeholder="描述拼车详情、游戏安排、注意事项等..."
              maxlength="500"
              class="custom-textarea"
              placeholder-class="textarea-placeholder">
            </textarea>
            <view class="char-count">
              <text>{{ formData.description.length }}/500</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 玩家要求卡片 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-icon">👥</view>
          <text class="section-title">玩家要求</text>
          <text class="section-hint">可选</text>
        </view>
        <view class="section-body">
          <view class="textarea-wrapper">
            <textarea 
              v-model="formData.requirements"
              placeholder="对玩家的要求，如经验、时间、水平等..."
              maxlength="300"
              class="custom-textarea"
              placeholder-class="textarea-placeholder">
            </textarea>
            <view class="char-count">
              <text>{{ formData.requirements.length }}/300</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 联系方式卡片 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-icon">📞</view>
          <text class="section-title">联系方式</text>
          <text class="section-required">至少填写一种</text>
        </view>
        <view class="section-body">
          <uni-forms :model="formData" ref="contactForm">
            <uni-forms-item label="微信号" name="contactWechat">
              <uni-easyinput v-model="formData.contactWechat" placeholder="请输入微信号" maxlength="50"></uni-easyinput>
            </uni-forms-item>

            <uni-forms-item label="手机号" name="contactPhone">
              <uni-easyinput 
                v-model="formData.contactPhone" 
                placeholder="请输入手机号" 
                type="number"
                maxlength="11">
              </uni-easyinput>
            </uni-forms-item>
          </uni-forms>
        </view>
      </view>

      <!-- 标签卡片 -->
      <view class="section-card">
        <view class="section-header">
          <view class="section-icon">🏷️</view>
          <text class="section-title">特色标签</text>
          <text class="section-hint">最多5个</text>
        </view>
        <view class="section-body">
          <view class="tag-selector">
            <view 
              v-for="tag in availableTags"
              :key="tag"
              :class="['tag-chip', formData.tags.includes(tag) ? 'tag-selected' : '']"
              @click="toggleTag(tag)">
              <text class="tag-text">{{ tag }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button class="submit-btn" @click="submitCarpool" :loading="submitting" :disabled="submitting">
          <text class="submit-text">{{ submitting ? '发起中...' : '立即发起拼车' }}</text>
        </button>
        <text class="submit-hint">发起后将自动成为房主，可以管理拼车</text>
      </view>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'CarpoolCreate',
  
  data() {
    return {
      formData: {
        title: '',
        gameTime: '',
        location: '',
        locationDetail: '',
        maxPlayers: 7,
        scriptId: '',
        storytellerId: '',
        description: '',
        requirements: '',
        contactWechat: '',
        contactPhone: '',
        tags: []
      },
      
      formRules: {
        title: {
          rules: [
            { required: true, errorMessage: '请输入拼车标题' },
            { minLength: 2, maxLength: 100, errorMessage: '标题长度应在2-100个字符之间' }
          ]
        },
        gameTime: {
          rules: [{ required: true, errorMessage: '请选择游戏时间' }]
        },
        location: {
          rules: [
            { required: true, errorMessage: '请输入游戏地点' },
            { maxLength: 200, errorMessage: '地点描述不能超过200个字符' }
          ]
        },
        maxPlayers: {
          rules: [{ required: true, errorMessage: '请选择需要人数' }]
        }
      },
      
      submitting: false,
      
      // 选项数据
      playerCountOptions: [
        { value: 5, text: '5人' },
        { value: 6, text: '6人' },
        { value: 7, text: '7人' },
        { value: 8, text: '8人' },
        { value: 9, text: '9人' },
        { value: 10, text: '10人' },
        { value: 12, text: '12人' },
        { value: 15, text: '15人' },
        { value: 20, text: '20人' }
      ],
      
      scriptOptions: [],
      storytellerOptions: [],
      
      availableTags: [
        '新手友好', '老手局', '剧情丰富', '推理烧脑', 
        '快节奏', '慢节奏', '经典剧本', '创新玩法',
        '线下聚会', '定期局', 'BYOB', '提供茶水'
      ]
    }
  },

  onLoad() {
    console.log('创建拼车页面加载')
    this.loadOptions()
  },

  methods: {
    // 加载选项数据
    async loadOptions() {
      try {
        // 加载剧本选项
        await this.loadScriptOptions()
        
        // 加载说书人选项
        await this.loadStorytellerOptions()
        
      } catch (error) {
        console.error('加载选项数据失败：', error)
      }
    },

    // 加载剧本选项
    async loadScriptOptions() {
      try {
        const result = await uniCloud.callFunction({
          name: 'script-list',
          data: {
            page: 1,
            pageSize: 50,
            type: 'hot'
          }
        })

        if (result.result.code === 0) {
          this.scriptOptions = result.result.data.list.map(script => ({
            value: script._id,
            text: `${script.title} (${script.player_count})`
          }))
        }
      } catch (error) {
        console.error('加载剧本选项失败：', error)
      }
    },

    // 加载说书人选项
    async loadStorytellerOptions() {
      try {
        const result = await uniCloud.callFunction({
          name: 'storyteller-list',
          data: {
            page: 1,
            pageSize: 50,
            status: 1 // 只显示认证通过的说书人
          }
        })

        if (result.result.code === 0) {
          this.storytellerOptions = result.result.data.list.map(storyteller => ({
            value: storyteller.user_id,
            text: `${storyteller.user.nickname} (${storyteller.rating.toFixed(1)}分)`
          }))
        }
      } catch (error) {
        console.error('加载说书人选项失败：', error)
        // 加载失败不影响主要功能
      }
    },

    // 标签选择
    toggleTag(tag) {
      const index = this.formData.tags.indexOf(tag)
      if (index > -1) {
        this.formData.tags.splice(index, 1)
      } else {
        if (this.formData.tags.length < 5) {
          this.formData.tags.push(tag)
        } else {
          uni.showToast({
            title: '最多选择5个标签',
            icon: 'none'
          })
        }
      }
    },

    // 提交拼车
    async submitCarpool() {
      // 表单验证
      try {
        await this.$refs.form.validate()
      } catch (error) {
        console.error('表单验证失败：', error)
        return
      }
      
      // 验证联系方式至少填写一种
      if (!this.formData.contactWechat && !this.formData.contactPhone) {
        uni.showToast({
          title: '请至少填写一种联系方式',
          icon: 'none'
        })
        return
      }
      
      // 验证游戏时间不能是过去
      const gameTime = new Date(this.formData.gameTime)
      const now = new Date()
      if (gameTime <= now) {
        uni.showToast({
          title: '游戏时间不能是过去的时间',
          icon: 'none'
        })
        return
      }

      this.submitting = true

      try {
        const token = Auth.getToken()
        
        const result = await uniCloud.callFunction({
          name: 'carpool-create',
          data: {
            token: token,
            title: this.formData.title.trim(),
            script_id: this.formData.scriptId || null,
            storyteller_id: this.formData.storytellerId || null,
            game_time: gameTime.getTime(),
            location: this.formData.location.trim(),
            location_detail: this.formData.locationDetail.trim(),
            max_players: parseInt(this.formData.maxPlayers),
            description: this.formData.description.trim(),
            requirements: this.formData.requirements.trim(),
            contact_wechat: this.formData.contactWechat.trim(),
            contact_phone: this.formData.contactPhone.trim(),
            tags: this.formData.tags
          }
        })

        if (result.result.code === 0) {
          uni.showToast({
            title: '拼车创建成功',
            icon: 'success'
          })
          
          // 跳转到拼车详情页
          setTimeout(() => {
            uni.redirectTo({
              url: `/pages/carpool/detail/detail?id=${result.result.data.room_id}`
            })
          }, 1500)
          
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('创建拼车失败：', error)
        uni.showToast({
          title: error.message || '创建失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
/* 页面背景 - 温暖米色调 */
.page {
  background: #FAF9F7;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

/* 页面标题区域 */
.page-header {
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
  padding: 60rpx 32rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.page-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.2;
  letter-spacing: 1rpx;
}

.page-subtitle {
  font-size: 26rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

/* 内容容器 */
.container {
  padding: 24rpx;
}

/* 分组卡片 */
.section-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 99, 71, 0.08);
  border: 1rpx solid rgba(139, 99, 71, 0.06);
  overflow: hidden;
}

/* 分组头部 */
.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 24rpx 20rpx;
  border-bottom: 1rpx solid #F5F0EB;
}

.section-icon {
  font-size: 32rpx;
  line-height: 1;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #5D4E37;
  line-height: 1;
  flex: 1;
}

.section-hint {
  font-size: 24rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1;
}

.section-required {
  font-size: 24rpx;
  font-weight: 500;
  color: #E8B861;
  background: rgba(232, 184, 97, 0.12);
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  line-height: 1;
}

/* 分组内容 */
.section-body {
  padding: 24rpx;
}

/* 文本域包装器 */
.textarea-wrapper {
  position: relative;
}

.custom-textarea {
  width: 100%;
  min-height: 180rpx;
  padding: 20rpx;
  background: #FAF8F5;
  border: 1rpx solid rgba(160, 120, 90, 0.15);
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #1A1A1A;
  box-sizing: border-box;
}

.textarea-placeholder {
  color: #BFBFBF;
}

.char-count {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.char-count text {
  font-size: 22rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1;
}

/* 标签选择器 */
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 20rpx;
  background: #F5F0EB;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-chip.tag-selected {
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
  border-color: rgba(160, 120, 90, 0.2);
  box-shadow: 0 4rpx 12rpx rgba(160, 120, 90, 0.2);
}

.tag-text {
  font-size: 26rpx;
  font-weight: 500;
  color: #6B5744;
  line-height: 1;
}

.tag-chip.tag-selected .tag-text {
  color: #FFFFFF;
}

/* 提交区域 */
.submit-section {
  padding: 32rpx 24rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(160, 120, 90, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:active:not([disabled]) {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 16rpx rgba(160, 120, 90, 0.25);
}

.submit-btn[disabled] {
  opacity: 0.6;
  box-shadow: 0 4rpx 16rpx rgba(160, 120, 90, 0.15);
}

.submit-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 2rpx;
  line-height: 1;
}

.submit-hint {
  font-size: 24rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1.5;
  text-align: center;
}

/* uni-forms 样式覆盖 */
/deep/ .uni-forms-item__label {
  font-size: 28rpx;
  font-weight: 500;
  color: #5D4E37;
}

/deep/ .uni-easyinput__content {
  background: #FAF8F5;
  border: 1rpx solid rgba(160, 120, 90, 0.15);
  border-radius: 12rpx;
}

/deep/ .uni-easyinput__content-input {
  font-size: 28rpx;
  color: #1A1A1A;
}

/deep/ .uni-easyinput__placeholder-class {
  color: #BFBFBF;
}
</style>
