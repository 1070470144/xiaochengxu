/**
 * 用户云对象
 * 统一管理所有用户相关功能
 */

const db = uniCloud.database()
const dbCmd = db.command

// ==================== 工具函数 ====================

/**
 * 验证手机号格式
 */
function validatePhone(phone) {
  if (!phone) {
    throw new Error('请输入手机号')
  }
  
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式不正确')
  }
}

/**
 * 解析 token 获取用户ID
 */
function parseUserId(token) {
  try {
    if (!token) return null
    // token 格式: userId_timestamp_random
    const parts = token.split('_')
    return parts[0] || null
  } catch (e) {
    console.error('Token 解析失败:', e)
    return null
  }
}

/**
 * 检查是否已登录
 */
function checkAuth(currentUserId) {
  if (!currentUserId) {
    throw new Error('请先登录')
  }
}

/**
 * 生成简单的 token
 */
function generateToken(userId) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${userId}_${timestamp}_${random}`
}

/**
 * 统一成功返回格式
 */
function returnSuccess(data, message = 'success') {
  return {
    code: 0,
    message: message,
    data: data
  }
}

module.exports = {
  /**
   * 前置处理 - 统一初始化和鉴权
   */
  _before: function() {
    // 初始化数据库连接
    this.db = db
    this.dbCmd = dbCmd
    
    // 获取客户端信息
    this.clientInfo = this.getClientInfo()
    
    // 尝试获取 token（可能为空，登录接口不需要）
    this.token = this.clientInfo.uniIdToken || this.getUniIdToken()
    
    // 解析用户ID（如果已登录）
    if (this.token) {
      this.currentUserId = parseUserId(this.token)
    }
    
    console.log('🔧 user 云对象调用:', {
      method: this.getMethodName(),
      userId: this.currentUserId || '未登录',
      clientIP: this.clientInfo.clientIP
    })
  },
  
  /**
   * 后置处理 - 统一错误处理
   */
  _after: function(error, result) {
    if (error) {
      console.error('❌ user 云对象错误:', {
        method: this.getMethodName(),
        error: error.message,
        stack: error.stack
      })
      
      // 统一错误返回格式
      return {
        code: error.code || 500,
        message: error.message || '服务异常，请稍后重试',
        data: null
      }
    }
    
    console.log('✅ user 云对象成功:', {
      method: this.getMethodName(),
      code: result?.code || 0
    })
    
    return result
  },
  
  // ==================== 公开方法 ====================
  
  /**
   * 发送短信验证码
   * @param {String} phone - 手机号
   * @param {String} type - 类型：login(登录) | register(注册)
   * @returns {Object} 返回验证码发送结果
   */
  async sendSms(phone, type = 'login') {
    // 1. 验证手机号
    validatePhone(phone)
    
    // 2. 检查发送频率（防止频繁发送）
    const smsCollection = this.db.collection('sms-codes')
    
    // 检查最近1分钟内是否已发送
    const recentSms = await smsCollection
      .where({
        phone: phone,
        created_at: this.dbCmd.gt(Date.now() - 60 * 1000) // 1分钟内
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()
    
    if (recentSms.data.length > 0) {
      const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - recentSms.data[0].created_at)) / 1000)
      throw new Error(`请${waitSeconds}秒后再试`)
    }
    
    // 3. 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 4. 设置过期时间（3分钟）
    const expiresAt = Date.now() + 3 * 60 * 1000
    
    // 5. 删除该手机号的旧验证码
    await smsCollection
      .where({ phone: phone })
      .remove()
    
    // 6. 保存新验证码
    await smsCollection.add({
      phone: phone,
      code: code,
      type: type,
      expires_at: expiresAt,
      created_at: Date.now(),
      used: false,
      client_ip: this.clientInfo.clientIP
    })
    
    // 7. 发送短信（开发模式直接返回验证码，生产模式调用短信服务）
    const isDev = true // 生产环境改为 false
    
    if (isDev) {
      console.log(`📱 【开发模式】验证码：${code}，手机号：${phone}`)
      
      return returnSuccess({
        expiresIn: 180, // 3分钟
        devCode: code   // 开发模式返回验证码
      }, '验证码已发送（开发模式）')
    }
    
    // 生产模式：调用短信服务
    // TODO: 接入腾讯云/阿里云短信服务
    /*
    try {
      const smsResult = await uniCloud.sendSms({
        phoneNumber: phone,
        templateId: 'SMS_XXXXX', // 你的短信模板ID
        data: {
          code: code
        }
      })
      
      if (!smsResult.success) {
        throw new Error('短信发送失败')
      }
    } catch (e) {
      console.error('短信发送失败:', e)
      throw new Error('短信发送失败，请稍后重试')
    }
    */
    
    return returnSuccess({
      expiresIn: 180
    }, '验证码已发送')
  },
  
  /**
   * 手机号验证码登录
   * @param {String} phone - 手机号
   * @param {String} code - 验证码
   * @returns {Object} 返回用户信息和 token
   */
  async login(phone, code) {
    // 1. 验证参数
    validatePhone(phone)
    
    if (!code) {
      throw new Error('请输入验证码')
    }
    
    if (!/^\d{6}$/.test(code)) {
      throw new Error('验证码格式不正确')
    }
    
    // 2. 验证验证码
    const smsCollection = this.db.collection('sms-codes')
    
    const smsQuery = await smsCollection
      .where({
        phone: phone,
        code: code,
        used: false,
        expires_at: this.dbCmd.gt(Date.now()) // 未过期
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()
    
    if (smsQuery.data.length === 0) {
      throw new Error('验证码错误或已过期')
    }
    
    const smsRecord = smsQuery.data[0]
    
    // 3. 标记验证码已使用
    await smsCollection.doc(smsRecord._id).update({
      used: true,
      used_at: Date.now()
    })
    
    // 4. 查询或创建用户
    const usersCollection = this.db.collection('uni-id-users')
    
    const userQuery = await usersCollection
      .where({ mobile: phone })
      .get()
    
    let userId
    let userInfo
    let isNewUser = false
    
    if (userQuery.data.length > 0) {
      // 用户已存在，更新登录信息
      const existingUser = userQuery.data[0]
      userId = existingUser._id
      
      await usersCollection.doc(userId).update({
        last_login_date: Date.now(),
        last_login_ip: this.clientInfo.clientIP
      })
      
      userInfo = existingUser
      
      console.log('👤 用户登录:', { userId, phone })
      
    } else {
      // 新用户，创建账户
      isNewUser = true
      
      const newUser = {
        mobile: phone,
        mobile_confirmed: 1,  // 手机号已验证
        nickname: `玩家${phone.substr(-4)}`,  // 默认昵称
        avatar: '',
        gender: 0,
        register_date: Date.now(),
        register_ip: this.clientInfo.clientIP,
        last_login_date: Date.now(),
        last_login_ip: this.clientInfo.clientIP,
        status: 0,  // 正常状态
        role: 0,    // 普通用户
        level: 1,   // 初始等级
        exp: 0,     // 初始经验值
        following_count: 0,
        followers_count: 0
      }
      
      const createResult = await usersCollection.add(newUser)
      userId = createResult.id
      userInfo = { ...newUser, _id: userId }
      
      console.log('🎉 新用户注册:', { userId, phone })
    }
    
    // 5. 生成 token
    const token = generateToken(userId)
    const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000  // 7天后过期
    
    // 6. 返回登录结果
    return returnSuccess({
      token: token,
      tokenExpired: tokenExpired,
      userInfo: {
        _id: userInfo._id,
        uid: userInfo._id,
        mobile: userInfo.mobile,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar || '',
        gender: userInfo.gender || 0,
        level: userInfo.level || 1,
        exp: userInfo.exp || 0,
        status: userInfo.status,
        role: userInfo.role || 0,
        following_count: userInfo.following_count || 0,
        followers_count: userInfo.followers_count || 0
      },
      isNewUser: isNewUser
    }, isNewUser ? '注册成功' : '登录成功')
  },
  
  /**
   * 用户登出
   * @returns {Object} 返回登出结果
   */
  async logout() {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    // 记录登出时间
    await this.db.collection('uni-id-users')
      .doc(this.currentUserId)
      .update({
        last_logout_date: Date.now()
      })
    
    console.log('👋 用户登出:', { userId: this.currentUserId })
    
    return returnSuccess(null, '登出成功')
  },
  
  /**
   * 获取当前用户信息
   * @returns {Object} 返回用户详细信息
   */
  async getInfo() {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    // 获取用户信息
    const userResult = await this.db.collection('uni-id-users')
      .doc(this.currentUserId)
      .get()
    
    if (!userResult.data || userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const userInfo = userResult.data[0]
    
    // 实时统计关注数和粉丝数
    const followingCountResult = await this.db.collection('botc-user-follows')
      .where({
        follower_id: this.currentUserId,
        status: 1
      })
      .count()
    
    const followersCountResult = await this.db.collection('botc-user-follows')
      .where({
        following_id: this.currentUserId,
        status: 1
      })
      .count()
    
    return returnSuccess({
      _id: userInfo._id,
      uid: userInfo._id,
      mobile: userInfo.mobile,
      nickname: userInfo.nickname,
      avatar: userInfo.avatar || '',
      gender: userInfo.gender || 0,
      level: userInfo.level || 1,
      exp: userInfo.exp || 0,
      status: userInfo.status,
      role: userInfo.role || 0,
      register_date: userInfo.register_date,
      last_login_date: userInfo.last_login_date,
      following_count: followingCountResult.total || 0,
      followers_count: followersCountResult.total || 0,
      background_image: userInfo.background_image || ''
    }, '获取成功')
  },
  
  /**
   * 更新用户信息
   * @param {Object} data - 要更新的数据
   * @param {String} data.nickname - 昵称
   * @param {String} data.avatar - 头像
   * @param {Number} data.gender - 性别：0-未知，1-男，2-女
   * @param {String} data.background_image - 背景图片
   * @returns {Object} 返回更新后的用户信息
   */
  async update(data) {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    const { nickname, avatar, gender, background_image } = data || {}
    const updateData = {}
    
    // 验证并构建更新数据
    if (nickname !== undefined) {
      if (!nickname || nickname.trim().length === 0) {
        throw new Error('昵称不能为空')
      }
      
      if (nickname.length > 20) {
        throw new Error('昵称不能超过20个字符')
      }
      
      updateData.nickname = nickname.trim()
    }
    
    if (avatar !== undefined) {
      updateData.avatar = avatar
    }
    
    if (gender !== undefined) {
      if (![0, 1, 2].includes(gender)) {
        throw new Error('性别参数错误')
      }
      updateData.gender = gender
    }
    
    if (background_image !== undefined) {
      updateData.background_image = background_image
    }
    
    // 检查是否有要更新的数据
    if (Object.keys(updateData).length === 0) {
      throw new Error('没有要更新的数据')
    }
    
    // 更新用户信息
    await this.db.collection('uni-id-users')
      .doc(this.currentUserId)
      .update(updateData)
    
    console.log('✏️ 用户信息更新:', { 
      userId: this.currentUserId, 
      fields: Object.keys(updateData) 
    })
    
    // 获取更新后的完整用户信息
    const userResult = await this.db.collection('uni-id-users')
      .doc(this.currentUserId)
      .get()
    
    if (!userResult.data || userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const userInfo = userResult.data[0]
    
    // 实时统计关注数和粉丝数
    const followingCountResult = await this.db.collection('botc-user-follows')
      .where({
        user_id: this.currentUserId,
        status: 1
      })
      .count()
    
    const followersCountResult = await this.db.collection('botc-user-follows')
      .where({
        following_id: this.currentUserId,
        status: 1
      })
      .count()
    
    return returnSuccess({
      _id: userInfo._id,
      uid: userInfo._id,
      mobile: userInfo.mobile,
      nickname: userInfo.nickname,
      avatar: userInfo.avatar || '',
      gender: userInfo.gender || 0,
      level: userInfo.level || 1,
      exp: userInfo.exp || 0,
      status: userInfo.status,
      role: userInfo.role || 0,
      register_date: userInfo.register_date,
      last_login_date: userInfo.last_login_date,
      following_count: followingCountResult.total || 0,
      followers_count: followersCountResult.total || 0,
      background_image: userInfo.background_image || ''
    }, '更新成功')
  }
}

