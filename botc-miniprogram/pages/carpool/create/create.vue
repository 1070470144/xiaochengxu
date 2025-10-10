<template>
  <view class="page">
    <view class="container">
      <!-- 表单卡片 -->
      <view class="form-card card">
        <view class="card-header">
          <text class="card-title">发起拼车</text>
        </view>
        <view class="card-body">
          <!-- 基础信息 -->
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

      <!-- 详细说明 -->
      <view class="desc-card card">
        <view class="card-header">
          <text class="card-title">详细说明</text>
        </view>
        <view class="card-body">
          <textarea 
            v-model="formData.description"
            placeholder="描述拼车详情、游戏安排等..."
            maxlength="500"
            class="desc-textarea">
          </textarea>
          <text class="char-count">{{ formData.description.length }}/500</text>
        </view>
      </view>

      <!-- 玩家要求 -->
      <view class="requirements-card card">
        <view class="card-header">
          <text class="card-title">玩家要求</text>
        </view>
        <view class="card-body">
          <textarea 
            v-model="formData.requirements"
            placeholder="对玩家的要求，如经验、时间等..."
            maxlength="300"
            class="requirements-textarea">
          </textarea>
          <text class="char-count">{{ formData.requirements.length }}/300</text>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="contact-card card">
        <view class="card-header">
          <text class="card-title">联系方式</text>
          <text class="card-subtitle">（至少填写一种）</text>
        </view>
        <view class="card-body">
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

      <!-- 标签 -->
      <view class="tags-card card">
        <view class="card-header">
          <text class="card-title">标签</text>
        </view>
        <view class="card-body">
          <view class="tag-selector">
            <text 
              v-for="tag in availableTags"
              :key="tag"
              :class="['tag-item', formData.tags.includes(tag) ? 'selected' : '']"
              @click="toggleTag(tag)">
              {{ tag }}
            </text>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-container">
        <button class="submit-btn btn-primary" @click="submitCarpool" :loading="submitting">
          发起拼车
        </button>
      </view>
    </view>
  </view>
</template>

<script>
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
        const result = await uniCloud.callFunction({
          name: 'carpool-create',
          data: {
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
.form-card, .desc-card, .requirements-card, .contact-card, .tags-card {
  margin: 20rpx;
}

.card-subtitle {
  font-size: 24rpx;
  color: #999999;
  margin-left: 10rpx;
}

.desc-textarea, .requirements-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.char-count {
  font-size: 22rpx;
  color: #999999;
  text-align: right;
  margin-top: 8rpx;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  font-size: 26rpx;
  color: #666666;
  background-color: #f5f5f5;
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
  border: 1rpx solid transparent;
}

.tag-item.selected {
  background-color: #8B4513;
  color: white;
}

.submit-container {
  padding: 40rpx 20rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
}
</style>
