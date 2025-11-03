<template>
  <view class="test-page">
    <view class="header">
      <text class="title">User 云对象完整测试</text>
      <text class="status" :class="isLogin ? 'logged' : 'not-logged'">
        {{ isLogin ? '✅ 已登录' : '❌ 未登录' }}
      </text>
    </view>

    <!-- 测试结果展示区 -->
    <view class="result-panel" v-if="lastResult">
      <view class="result-header">
        <text class="result-title">最后测试结果</text>
        <view class="result-status" :class="lastResult.success ? 'success' : 'fail'">
          {{ lastResult.success ? '✅ 成功' : '❌ 失败' }}
        </view>
      </view>
      <view class="result-content">
        <text class="result-text">{{ lastResult.message }}</text>
        <view class="result-data" v-if="lastResult.data">
          <text class="data-label">返回数据：</text>
          <text class="data-content">{{ JSON.stringify(lastResult.data, null, 2) }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="test-sections" scroll-y>
      <!-- 1. 登录相关测试 -->
      <view class="section">
        <view class="section-title">1️⃣ 登录模块</view>
        
        <view class="test-group">
          <text class="group-title">发送验证码 (sendSms)</text>
          <input 
            class="input" 
            v-model="testData.phone" 
            placeholder="请输入手机号"
            type="number"
            maxlength="11"
          />
          <button class="btn btn-primary" @click="testSendSms">发送验证码</button>
          <text class="hint" v-if="devCode">开发模式验证码：{{ devCode }}</text>
        </view>

        <view class="test-group">
          <text class="group-title">登录 (login)</text>
          <input 
            class="input" 
            v-model="testData.loginPhone" 
            placeholder="手机号"
            type="number"
            maxlength="11"
          />
          <input 
            class="input" 
            v-model="testData.loginCode" 
            placeholder="验证码"
            type="number"
            maxlength="6"
          />
          <button class="btn btn-primary" @click="testLogin">立即登录</button>
        </view>
      </view>

      <!-- 2. 用户信息测试 -->
      <view class="section">
        <view class="section-title">2️⃣ 用户信息模块</view>
        
        <view class="test-group">
          <text class="group-title">获取当前用户信息 (getInfo)</text>
          <button class="btn btn-success" @click="testGetInfo" :disabled="!isLogin">
            获取我的信息
          </button>
        </view>

        <view class="test-group">
          <text class="group-title">更新用户信息 (update)</text>
          <input class="input" v-model="testData.nickname" placeholder="昵称" maxlength="20" />
          <picker mode="selector" :range="genderOptions" range-key="label" @change="onGenderChange">
            <view class="picker">
              <text>性别：{{ genderOptions[testData.gender].label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <input class="input" v-model="testData.avatar" placeholder="头像URL（可选）" />
          <button class="btn btn-warning" @click="testUpdate" :disabled="!isLogin">
            更新资料
          </button>
        </view>
      </view>

      <!-- 3. 他人资料测试 -->
      <view class="section">
        <view class="section-title">3️⃣ 他人资料模块</view>
        
        <view class="test-group">
          <text class="group-title">查看他人资料 (getProfile)</text>
          <input 
            class="input" 
            v-model="testData.targetUserId" 
            placeholder="请输入目标用户ID"
          />
          <button class="btn btn-info" @click="testGetProfile">查看资料</button>
        </view>
      </view>

      <!-- 4. 关注功能测试 -->
      <view class="section">
        <view class="section-title">4️⃣ 关注功能模块</view>
        
        <view class="test-group">
          <text class="group-title">关注操作</text>
          <input 
            class="input" 
            v-model="testData.followUserId" 
            placeholder="要关注的用户ID"
          />
          <view class="btn-row">
            <button class="btn btn-success" @click="testFollow" :disabled="!isLogin">
              ➕ 关注
            </button>
            <button class="btn btn-danger" @click="testUnfollow" :disabled="!isLogin">
              ➖ 取消关注
            </button>
          </view>
        </view>

        <view class="test-group">
          <text class="group-title">检查关注状态 (checkFollow)</text>
          <input 
            class="input" 
            v-model="testData.checkUserId" 
            placeholder="要检查的用户ID"
          />
          <button class="btn btn-info" @click="testCheckFollow" :disabled="!isLogin">
            检查关注状态
          </button>
        </view>

        <view class="test-group">
          <text class="group-title">关注列表 (getFollowingList)</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="testData.page" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="testData.pageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          <button class="btn btn-info" @click="testGetFollowingList" :disabled="!isLogin">
            获取关注列表
          </button>
        </view>

        <view class="test-group">
          <text class="group-title">粉丝列表 (getFollowersList)</text>
          <button class="btn btn-info" @click="testGetFollowersList" :disabled="!isLogin">
            获取粉丝列表
          </button>
        </view>
      </view>

      <!-- 5. 等级系统测试 -->
      <view class="section">
        <view class="section-title">5️⃣ 等级系统模块</view>
        
        <view class="test-group">
          <text class="group-title">获取等级信息 (getLevel)</text>
          <input 
            class="input" 
            v-model="testData.levelUserId" 
            placeholder="用户ID（可选，默认当前用户）"
          />
          <button class="btn btn-primary" @click="testGetLevel">
            查看等级信息
          </button>
        </view>

        <view class="test-group">
          <text class="group-title">增加经验值 (addExp)</text>
          <text class="hint">⚠️ 此功能通常由系统调用</text>
          <input 
            class="input" 
            v-model="testData.expUserId" 
            placeholder="目标用户ID"
          />
          <input 
            class="input" 
            v-model.number="testData.expAmount" 
            placeholder="经验值数量"
            type="number"
          />
          <input 
            class="input" 
            v-model="testData.expReason" 
            placeholder="原因（可选）"
          />
          <button class="btn btn-warning" @click="testAddExp">
            增加经验值
          </button>
        </view>
      </view>

      <!-- 6. 登出测试 -->
      <view class="section">
        <view class="section-title">6️⃣ 登出模块</view>
        
        <view class="test-group">
          <text class="group-title">退出登录 (logout)</text>
          <button class="btn btn-danger" @click="testLogout" :disabled="!isLogin">
            退出登录
          </button>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import { getUserCloudObject } from '@/common/userCloudObject.js'
import Auth from '@/utils/auth.js'

export default {
  name: 'UserTestComplete',
  
  data() {
    return {
      userObj: null,
      isLogin: false,
      devCode: '',
      lastResult: null,
      
      testData: {
        // 登录相关
        phone: '19533284032',
        loginPhone: '19533284032',
        loginCode: '',
        
        // 用户信息
        nickname: '',
        avatar: '',
        gender: 0,
        
        // 他人资料
        targetUserId: '',
        
        // 关注相关
        followUserId: '',
        checkUserId: '',
        page: 1,
        pageSize: 20,
        
        // 等级相关
        levelUserId: '',
        expUserId: '',
        expAmount: 10,
        expReason: '测试'
      },
      
      genderOptions: [
        { value: 0, label: '保密' },
        { value: 1, label: '男' },
        { value: 2, label: '女' }
      ]
    }
  },
  
  onLoad() {
    console.log('📱 User 测试页面加载')
    this.userObj = getUserCloudObject()
    this.checkLoginStatus()
  },
  
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      this.isLogin = Auth.isLogin()
      if (this.isLogin) {
        const userInfo = Auth.getUserInfo()
        this.testData.nickname = userInfo.nickname || ''
        this.testData.gender = userInfo.gender || 0
        console.log('✅ 当前已登录:', userInfo.nickname)
      }
    },
    
    // 显示测试结果
    showResult(success, message, data = null) {
      this.lastResult = { success, message, data }
      
      uni.showToast({
        title: message,
        icon: success ? 'success' : 'none',
        duration: 2000
      })
      
      console.log(success ? '✅' : '❌', message, data)
    },
    
    // 1. 测试发送验证码
    async testSendSms() {
      if (!this.testData.phone) {
        return this.showResult(false, '请输入手机号')
      }
      
      try {
        uni.showLoading({ title: '发送中...' })
        const result = await this.userObj.sendSms(this.testData.phone, 'login')
        uni.hideLoading()
        
        if (result.code === 0) {
          this.devCode = result.data.devCode || ''
          this.testData.loginPhone = this.testData.phone
          this.testData.loginCode = this.devCode
          this.showResult(true, '验证码已发送', result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '发送失败')
      }
    },
    
    // 2. 测试登录
    async testLogin() {
      if (!this.testData.loginPhone || !this.testData.loginCode) {
        return this.showResult(false, '请输入手机号和验证码')
      }
      
      try {
        uni.showLoading({ title: '登录中...' })
        const result = await this.userObj.login(
          this.testData.loginPhone, 
          this.testData.loginCode
        )
        uni.hideLoading()
        
        if (result.code === 0) {
          // 保存登录信息
          uni.setStorageSync('uni_id_token', result.data.token)
          uni.setStorageSync('uni_id_token_expired', result.data.tokenExpired)
          uni.setStorageSync('userInfo', result.data.userInfo)
          
          this.checkLoginStatus()
          this.showResult(true, '登录成功', result.data.userInfo)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '登录失败')
      }
    },
    
    // 3. 测试获取用户信息
    async testGetInfo() {
      try {
        uni.showLoading({ title: '加载中...' })
        const result = await this.userObj.getInfo()
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '获取成功', result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 4. 测试更新用户信息
    async testUpdate() {
      if (!this.testData.nickname) {
        return this.showResult(false, '请输入昵称')
      }
      
      try {
        uni.showLoading({ title: '更新中...' })
        const updateData = {
          nickname: this.testData.nickname,
          gender: this.testData.gender
        }
        
        if (this.testData.avatar) {
          updateData.avatar = this.testData.avatar
        }
        
        const result = await this.userObj.update(updateData)
        uni.hideLoading()
        
        if (result.code === 0) {
          // 更新本地信息
          uni.setStorageSync('userInfo', result.data)
          this.showResult(true, '更新成功', result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '更新失败')
      }
    },
    
    // 5. 测试获取他人资料
    async testGetProfile() {
      if (!this.testData.targetUserId) {
        return this.showResult(false, '请输入目标用户ID')
      }
      
      try {
        uni.showLoading({ title: '加载中...' })
        const result = await this.userObj.getProfile(this.testData.targetUserId)
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '获取成功', result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 6. 测试关注
    async testFollow() {
      if (!this.testData.followUserId) {
        return this.showResult(false, '请输入要关注的用户ID')
      }
      
      try {
        uni.showLoading({ title: '关注中...' })
        const result = await this.userObj.follow(this.testData.followUserId)
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '关注成功', result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '关注失败')
      }
    },
    
    // 7. 测试取消关注
    async testUnfollow() {
      if (!this.testData.followUserId) {
        return this.showResult(false, '请输入要取消关注的用户ID')
      }
      
      try {
        uni.showLoading({ title: '操作中...' })
        const result = await this.userObj.unfollow(this.testData.followUserId)
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '取消关注成功', result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '操作失败')
      }
    },
    
    // 8. 测试检查关注状态
    async testCheckFollow() {
      if (!this.testData.checkUserId) {
        return this.showResult(false, '请输入要检查的用户ID')
      }
      
      try {
        uni.showLoading({ title: '检查中...' })
        const result = await this.userObj.checkFollow(this.testData.checkUserId)
        uni.hideLoading()
        
        if (result.code === 0) {
          const status = result.data.is_following ? '已关注' : '未关注'
          const mutual = result.data.is_mutual ? '（互关）' : ''
          this.showResult(true, `${status}${mutual}`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '检查失败')
      }
    },
    
    // 9. 测试获取关注列表
    async testGetFollowingList() {
      try {
        uni.showLoading({ title: '加载中...' })
        const result = await this.userObj.getFollowingList(
          this.testData.page, 
          this.testData.pageSize
        )
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}人`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 10. 测试获取粉丝列表
    async testGetFollowersList() {
      try {
        uni.showLoading({ title: '加载中...' })
        const result = await this.userObj.getFollowersList(
          this.testData.page, 
          this.testData.pageSize
        )
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}人`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 11. 测试获取等级信息
    async testGetLevel() {
      try {
        uni.showLoading({ title: '加载中...' })
        const result = await this.userObj.getLevel(this.testData.levelUserId || undefined)
        uni.hideLoading()
        
        if (result.code === 0) {
          const level = `Lv.${result.data.currentLevel} ${result.data.currentLevelName}`
          this.showResult(true, level, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 12. 测试增加经验值
    async testAddExp() {
      if (!this.testData.expUserId || !this.testData.expAmount) {
        return this.showResult(false, '请输入用户ID和经验值数量')
      }
      
      try {
        uni.showLoading({ title: '处理中...' })
        const result = await this.userObj.addExp(
          this.testData.expUserId,
          this.testData.expAmount,
          this.testData.expReason
        )
        uni.hideLoading()
        
        if (result.code === 0) {
          const msg = result.data.leveled_up 
            ? `升级到${result.data.new_level}级！` 
            : '经验值增加成功'
          this.showResult(true, msg, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '操作失败')
      }
    },
    
    // 13. 测试退出登录
    async testLogout() {
      try {
        uni.showLoading({ title: '退出中...' })
        const result = await this.userObj.logout()
        uni.hideLoading()
        
        if (result.code === 0) {
          // 清除本地信息
          uni.removeStorageSync('uni_id_token')
          uni.removeStorageSync('uni_id_token_expired')
          uni.removeStorageSync('userInfo')
          
          this.isLogin = false
          this.showResult(true, '已退出登录')
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '退出失败')
      }
    },
    
    // 性别选择
    onGenderChange(e) {
      this.testData.gender = this.genderOptions[e.detail.value].value
    }
  }
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx 30rpx;
  color: white;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.status {
  font-size: 28rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  display: inline-block;
}

.status.logged {
  background-color: rgba(76, 175, 80, 0.3);
}

.status.not-logged {
  background-color: rgba(244, 67, 54, 0.3);
}

/* 结果面板 */
.result-panel {
  margin: 20rpx 30rpx;
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.result-status {
  font-size: 28rpx;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.result-status.success {
  background-color: #e8f5e9;
  color: #4caf50;
}

.result-status.fail {
  background-color: #ffebee;
  color: #f44336;
}

.result-content {
  border-top: 1px solid #f0f0f0;
  padding-top: 20rpx;
}

.result-text {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.result-data {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-top: 16rpx;
}

.data-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.data-content {
  font-size: 24rpx;
  color: #333;
  font-family: monospace;
  word-break: break-all;
  white-space: pre-wrap;
  display: block;
}

/* 测试区域 */
.test-sections {
  flex: 1;
  padding: 0 30rpx;
}

.section {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 16rpx;
  border-bottom: 2px solid #f0f0f0;
}

.test-group {
  margin-bottom: 40rpx;
}

.test-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 80rpx;
  background-color: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
}

.input:focus {
  border-color: #667eea;
  background-color: white;
}

.input-row {
  display: flex;
  gap: 16rpx;
}

.input-half {
  flex: 1;
}

.picker {
  height: 80rpx;
  background-color: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.picker text {
  font-size: 28rpx;
  color: #333;
}

.arrow {
  color: #999;
  font-size: 32rpx;
}

.btn {
  width: 100%;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16rpx;
  border: none;
}

.btn[disabled] {
  opacity: 0.5;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-success {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.btn-info {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.btn-row {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.btn-row .btn {
  flex: 1;
}

.hint {
  font-size: 24rpx;
  color: #ff9800;
  display: block;
  margin-top: 12rpx;
  padding: 12rpx;
  background-color: #fff3e0;
  border-radius: 8rpx;
}

.bottom-space {
  height: 40rpx;
}
</style>

