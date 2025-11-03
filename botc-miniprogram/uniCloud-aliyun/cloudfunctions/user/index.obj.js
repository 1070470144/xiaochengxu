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
  },
  
  /**
   * 获取他人公开资料
   * @param {String} userId - 目标用户ID
   * @returns {Object} 返回用户公开资料、统计数据、关注状态等
   */
  async getProfile(userId) {
    // 验证参数
    if (!userId) {
      throw new Error('用户ID不能为空')
    }
    
    // 1. 获取用户基本信息
    const userResult = await this.db.collection('uni-id-users')
      .doc(userId)
      .field({
        _id: true,
        nickname: true,
        avatar: true,
        gender: true,
        level: true,
        exp: true,
        register_date: true,
        followers_count: true,
        following_count: true,
        background_image: true
      })
      .get()
    
    if (!userResult.data || userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const userInfo = userResult.data[0]
    
    // 2. 统计用户数据
    // 帖子数量
    const postsCountResult = await this.db.collection('botc-posts')
      .where({
        user_id: userId,
        status: 1
      })
      .count()
    
    // 剧本评价数量
    const reviewsCountResult = await this.db.collection('botc-script-reviews')
      .where({
        user_id: userId,
        status: 1
      })
      .count()
    
    // 拼车数量
    const carpoolCountResult = await this.db.collection('botc-carpool-rooms')
      .where({
        host_id: userId,
        status: this.dbCmd.neq(0)
      })
      .count()
    
    // 获赞数量
    const likesCountResult = await this.db.collection('botc-post-likes')
      .where({
        target_user_id: userId,
        type: 1
      })
      .count()
    
    // 3. 如果当前用户已登录，获取关注状态
    let isFollowing = false
    let isMutual = false
    const isSelf = this.currentUserId === userId
    
    if (this.currentUserId && !isSelf) {
      // 检查是否已关注
      const followResult = await this.db.collection('botc-user-follows')
        .where({
          follower_id: this.currentUserId,
          following_id: userId,
          status: 1
        })
        .count()
      
      isFollowing = followResult.total > 0
      
      // 检查是否互关
      if (isFollowing) {
        const mutualResult = await this.db.collection('botc-user-follows')
          .where({
            follower_id: userId,
            following_id: this.currentUserId,
            status: 1
          })
          .count()
        
        isMutual = mutualResult.total > 0
      }
    }
    
    // 4. 获取最近发布的帖子（3条）
    const recentPostsResult = await this.db.collection('botc-posts')
      .where({
        user_id: userId,
        status: 1
      })
      .orderBy('created_at', 'desc')
      .limit(3)
      .field({
        _id: true,
        content: true,
        images: true,
        like_count: true,
        comment_count: true,
        created_at: true
      })
      .get()
    
    // 5. 获取最近评价的剧本（3条）
    const recentReviewsResult = await this.db.collection('botc-script-reviews')
      .aggregate()
      .match({
        user_id: userId,
        status: 1
      })
      .sort({ created_at: -1 })
      .limit(3)
      .lookup({
        from: 'botc-scripts',
        localField: 'script_id',
        foreignField: '_id',
        as: 'script'
      })
      .addFields({
        script: { $arrayElemAt: ['$script', 0] }
      })
      .end()
    
    const processedReviews = (recentReviewsResult.data || []).map(review => ({
      _id: review._id,
      script_id: review.script_id,
      script_name: review.script?.title || '未知剧本',
      script_cover: review.script?.cover_image || '',
      rating: review.rating,
      content: review.content,
      created_at: review.created_at
    }))
    
    return returnSuccess({
      user: {
        _id: userInfo._id,
        nickname: userInfo.nickname || '未知用户',
        avatar: userInfo.avatar || '',
        gender: userInfo.gender || 0,
        level: userInfo.level || 1,
        exp: userInfo.exp || 0,
        register_date: userInfo.register_date,
        followers_count: userInfo.followers_count || 0,
        following_count: userInfo.following_count || 0,
        background_image: userInfo.background_image || ''
      },
      stats: {
        posts_count: postsCountResult.total || 0,
        reviews_count: reviewsCountResult.total || 0,
        carpool_count: carpoolCountResult.total || 0,
        likes_count: likesCountResult.total || 0
      },
      follow_status: {
        is_following: isFollowing,
        is_mutual: isMutual,
        is_self: isSelf
      },
      recent_posts: recentPostsResult.data || [],
      recent_reviews: processedReviews
    }, '获取成功')
  },
  
  /**
   * 关注用户
   * @param {String} targetUserId - 目标用户ID
   * @returns {Object} 返回关注结果
   */
  async follow(targetUserId) {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    // 验证参数
    if (!targetUserId) {
      throw new Error('目标用户ID不能为空')
    }
    
    // 不能关注自己
    if (this.currentUserId === targetUserId) {
      throw new Error('不能关注自己')
    }
    
    // 检查目标用户是否存在
    const targetUserResult = await this.db.collection('uni-id-users')
      .doc(targetUserId)
      .get()
    
    if (!targetUserResult.data || targetUserResult.data.length === 0) {
      throw new Error('目标用户不存在')
    }
    
    // 检查是否已关注
    const existResult = await this.db.collection('botc-user-follows')
      .where({
        follower_id: this.currentUserId,
        following_id: targetUserId,
        status: 1
      })
      .count()
    
    if (existResult.total > 0) {
      throw new Error('已经关注过了')
    }
    
    // 创建关注记录
    await this.db.collection('botc-user-follows').add({
      follower_id: this.currentUserId,
      following_id: targetUserId,
      status: 1,
      created_at: Date.now()
    })
    
    // 更新双方的关注数和粉丝数
    // 当前用户：关注数+1
    const currentUserDoc = await this.db.collection('uni-id-users').doc(this.currentUserId).get()
    const currentUser = currentUserDoc.data && currentUserDoc.data.length > 0 ? currentUserDoc.data[0] : {}
    await this.db.collection('uni-id-users').doc(this.currentUserId).update({
      following_count: (currentUser.following_count || 0) + 1
    })
    
    // 目标用户：粉丝数+1
    const targetUser = targetUserResult.data[0]
    const newFollowersCount = (targetUser.followers_count || 0) + 1
    
    const updateData = {
      followers_count: newFollowersCount
    }
    
    // 如果目标用户是认证说书人，同步更新 storyteller_stats.fans_count
    if (targetUser.storyteller_certified && targetUser.storyteller_stats) {
      updateData['storyteller_stats.fans_count'] = newFollowersCount
    }
    
    await this.db.collection('uni-id-users').doc(targetUserId).update(updateData)
    
    console.log('👥 关注成功:', { follower: this.currentUserId, following: targetUserId })
    
    return returnSuccess({
      is_following: true
    }, '关注成功')
  },
  
  /**
   * 取消关注
   * @param {String} targetUserId - 目标用户ID
   * @returns {Object} 返回取消关注结果
   */
  async unfollow(targetUserId) {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    // 验证参数
    if (!targetUserId) {
      throw new Error('目标用户ID不能为空')
    }
    
    // 查找关注记录
    const followResult = await this.db.collection('botc-user-follows')
      .where({
        follower_id: this.currentUserId,
        following_id: targetUserId,
        status: 1
      })
      .get()
    
    if (!followResult.data || followResult.data.length === 0) {
      throw new Error('未关注该用户')
    }
    
    // 删除关注记录
    await this.db.collection('botc-user-follows').doc(followResult.data[0]._id).remove()
    
    // 更新双方的关注数和粉丝数
    // 当前用户：关注数-1
    const currentUserDoc = await this.db.collection('uni-id-users').doc(this.currentUserId).get()
    const currentUser = currentUserDoc.data && currentUserDoc.data.length > 0 ? currentUserDoc.data[0] : {}
    await this.db.collection('uni-id-users').doc(this.currentUserId).update({
      following_count: Math.max(0, (currentUser.following_count || 0) - 1)
    })
    
    // 目标用户：粉丝数-1
    const targetUserDoc = await this.db.collection('uni-id-users').doc(targetUserId).get()
    const targetUser = targetUserDoc.data && targetUserDoc.data.length > 0 ? targetUserDoc.data[0] : {}
    const newFollowersCount = Math.max(0, (targetUser.followers_count || 0) - 1)
    
    const updateData = {
      followers_count: newFollowersCount
    }
    
    // 如果目标用户是认证说书人，同步更新 storyteller_stats.fans_count
    if (targetUser.storyteller_certified && targetUser.storyteller_stats) {
      updateData['storyteller_stats.fans_count'] = newFollowersCount
    }
    
    await this.db.collection('uni-id-users').doc(targetUserId).update(updateData)
    
    console.log('💔 取消关注成功:', { follower: this.currentUserId, following: targetUserId })
    
    return returnSuccess({
      is_following: false
    }, '取消关注成功')
  },
  
  /**
   * 获取关注列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @returns {Object} 返回关注列表
   */
  async getFollowingList(page = 1, pageSize = 20) {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    // 查询我关注的人
    const followsResult = await this.db.collection('botc-user-follows')
      .where({
        follower_id: this.currentUserId,
        status: 1
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    const follows = followsResult.data || []
    
    if (follows.length === 0) {
      return returnSuccess({
        list: [],
        total: 0,
        page,
        pageSize
      })
    }
    
    // 获取被关注者的ID列表
    const followingIds = follows.map(f => f.following_id)
    
    // 查询被关注者的详细信息
    const usersResult = await this.db.collection('uni-id-users')
      .where({
        _id: this.dbCmd.in(followingIds)
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true,
        level: true,
        gender: true
      })
      .get()
    
    const usersMap = {}
    usersResult.data.forEach(user => {
      usersMap[user._id] = user
    })
    
    // 组合数据
    const list = follows.map(follow => {
      const user = usersMap[follow.following_id] || {}
      return {
        user_id: follow.following_id,
        nickname: user.nickname || '未知用户',
        avatar: user.avatar || '',
        level: user.level || 1,
        gender: user.gender || 0,
        followed_at: follow.created_at
      }
    })
    
    // 获取总数
    const countResult = await this.db.collection('botc-user-follows')
      .where({
        follower_id: this.currentUserId,
        status: 1
      })
      .count()
    
    return returnSuccess({
      list,
      total: countResult.total,
      page,
      pageSize
    }, '获取成功')
  },
  
  /**
   * 获取粉丝列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @returns {Object} 返回粉丝列表
   */
  async getFollowersList(page = 1, pageSize = 20) {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    // 查询关注我的人
    const followsResult = await this.db.collection('botc-user-follows')
      .where({
        following_id: this.currentUserId,
        status: 1
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    const follows = followsResult.data || []
    
    if (follows.length === 0) {
      return returnSuccess({
        list: [],
        total: 0,
        page,
        pageSize
      })
    }
    
    // 获取关注者的ID列表
    const followerIds = follows.map(f => f.follower_id)
    
    // 查询关注者的详细信息
    const usersResult = await this.db.collection('uni-id-users')
      .where({
        _id: this.dbCmd.in(followerIds)
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true,
        level: true,
        gender: true
      })
      .get()
    
    const usersMap = {}
    usersResult.data.forEach(user => {
      usersMap[user._id] = user
    })
    
    // 查询我是否也关注了这些用户（互关状态）
    const mutualFollowsResult = await this.db.collection('botc-user-follows')
      .where({
        follower_id: this.currentUserId,
        following_id: this.dbCmd.in(followerIds),
        status: 1
      })
      .get()
    
    const mutualFollowsSet = new Set(mutualFollowsResult.data.map(f => f.following_id))
    
    // 组合数据
    const list = follows.map(follow => {
      const user = usersMap[follow.follower_id] || {}
      return {
        user_id: follow.follower_id,
        nickname: user.nickname || '未知用户',
        avatar: user.avatar || '',
        level: user.level || 1,
        gender: user.gender || 0,
        followed_at: follow.created_at,
        is_mutual: mutualFollowsSet.has(follow.follower_id) // 是否互关
      }
    })
    
    // 获取总数
    const countResult = await this.db.collection('botc-user-follows')
      .where({
        following_id: this.currentUserId,
        status: 1
      })
      .count()
    
    return returnSuccess({
      list,
      total: countResult.total,
      page,
      pageSize
    }, '获取成功')
  },
  
  /**
   * 检查关注状态
   * @param {String} targetUserId - 目标用户ID
   * @returns {Object} 返回关注状态
   */
  async checkFollow(targetUserId) {
    // 检查登录状态
    checkAuth(this.currentUserId)
    
    // 验证参数
    if (!targetUserId) {
      throw new Error('目标用户ID不能为空')
    }
    
    // 检查是否关注
    const followResult = await this.db.collection('botc-user-follows')
      .where({
        follower_id: this.currentUserId,
        following_id: targetUserId,
        status: 1
      })
      .count()
    
    const isFollowing = followResult.total > 0
    
    // 检查是否互关
    let isMutual = false
    if (isFollowing) {
      const mutualResult = await this.db.collection('botc-user-follows')
        .where({
          follower_id: targetUserId,
          following_id: this.currentUserId,
          status: 1
        })
        .count()
      
      isMutual = mutualResult.total > 0
    }
    
    return returnSuccess({
      is_following: isFollowing,
      is_mutual: isMutual,
      is_self: this.currentUserId === targetUserId
    })
  },
  
  /**
   * 获取用户等级信息
   * @param {String} targetUserId - 目标用户ID（可选，默认当前用户）
   * @returns {Object} 返回等级信息
   */
  async getLevel(targetUserId) {
    // 如果没有传targetUserId，使用当前登录用户
    const userId = targetUserId || this.currentUserId
    
    if (!userId) {
      throw new Error('请先登录或提供用户ID')
    }
    
    // 等级配置
    const LEVEL_CONFIG = [
      { level: 1, name: '初来乍到', exp: 0, icon: '🌱' },
      { level: 2, name: '略知一二', exp: 100, icon: '🌿' },
      { level: 3, name: '初窥门径', exp: 300, icon: '🍀' },
      { level: 4, name: '渐入佳境', exp: 600, icon: '🌳' },
      { level: 5, name: '驾轻就熟', exp: 1000, icon: '🌲' },
      { level: 6, name: '炉火纯青', exp: 1500, icon: '⭐' },
      { level: 7, name: '登峰造极', exp: 2200, icon: '🌟' },
      { level: 8, name: '出神入化', exp: 3000, icon: '💫' },
      { level: 9, name: '无与伦比', exp: 4000, icon: '✨' },
      { level: 10, name: '传奇玩家', exp: 5500, icon: '👑' }
    ]
    
    // 查询用户信息
    const userResult = await this.db.collection('uni-id-users')
      .doc(userId)
      .field({
        nickname: true,
        avatar: true,
        exp: true,
        level: true
      })
      .get()
    
    if (!userResult.data || userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const user = userResult.data[0]
    const currentExp = user.exp || 0
    const currentLevel = user.level || 1
    
    // 获取当前等级配置
    const currentLevelConfig = LEVEL_CONFIG.find(l => l.level === currentLevel) || LEVEL_CONFIG[0]
    
    // 获取下一等级配置
    const nextLevelConfig = LEVEL_CONFIG.find(l => l.level === currentLevel + 1)
    
    // 计算升级进度
    let progress = 100
    let expToNext = 0
    
    if (nextLevelConfig) {
      const currentLevelExp = currentLevelConfig.exp
      const nextLevelExp = nextLevelConfig.exp
      const expInCurrentLevel = currentExp - currentLevelExp
      const expNeeded = nextLevelExp - currentLevelExp
      
      progress = Math.min(100, Math.round((expInCurrentLevel / expNeeded) * 100))
      expToNext = nextLevelExp - currentExp
    }
    
    // 计算等级特权
    const privileges = []
    if (currentLevel >= 1) {
      privileges.push('可以上传剧本')
      privileges.push('可以评论和评分')
    }
    if (currentLevel >= 3) {
      privileges.push('可以创建拼车房间')
      privileges.push('评论优先显示')
    }
    if (currentLevel >= 5) {
      privileges.push('可以申请说书人认证')
      privileges.push('个人主页更多展示位')
    }
    if (currentLevel >= 7) {
      privileges.push('精选剧本推荐权重+50%')
      privileges.push('专属等级头像框')
    }
    if (currentLevel >= 10) {
      privileges.push('传奇玩家标识')
      privileges.push('所有特权全部解锁')
    }
    
    return returnSuccess({
      userId,
      nickname: user.nickname,
      avatar: user.avatar || '',
      
      // 当前等级信息
      currentLevel,
      currentLevelName: currentLevelConfig.name,
      currentLevelIcon: currentLevelConfig.icon,
      currentExp,
      
      // 下一等级信息
      nextLevel: nextLevelConfig ? nextLevelConfig.level : null,
      nextLevelName: nextLevelConfig ? nextLevelConfig.name : '已满级',
      nextLevelExp: nextLevelConfig ? nextLevelConfig.exp : null,
      
      // 升级进度
      progress,
      expToNext,
      isMaxLevel: currentLevel >= 10,
      
      // 等级特权
      privileges,
      
      // 全部等级配置
      allLevels: LEVEL_CONFIG
    }, '获取成功')
  },
  
  /**
   * 增加经验值
   * @param {String} targetUserId - 目标用户ID
   * @param {Number} expAmount - 经验值数量
   * @param {String} reason - 原因
   * @returns {Object} 返回经验值增加结果
   */
  async addExp(targetUserId, expAmount, reason = '') {
    // 注意：这个方法通常应该由系统调用，而不是用户直接调用
    // 可以添加权限检查
    
    // 验证参数
    if (!targetUserId) {
      throw new Error('目标用户ID不能为空')
    }
    
    if (!expAmount || expAmount <= 0) {
      throw new Error('经验值必须大于0')
    }
    
    // 查询用户当前等级和经验
    const userResult = await this.db.collection('uni-id-users')
      .doc(targetUserId)
      .get()
    
    if (!userResult.data || userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const user = userResult.data[0]
    const oldExp = user.exp || 0
    const oldLevel = user.level || 1
    const newExp = oldExp + expAmount
    
    // 计算新等级
    const LEVEL_CONFIG = [
      { level: 1, exp: 0 },
      { level: 2, exp: 100 },
      { level: 3, exp: 300 },
      { level: 4, exp: 600 },
      { level: 5, exp: 1000 },
      { level: 6, exp: 1500 },
      { level: 7, exp: 2200 },
      { level: 8, exp: 3000 },
      { level: 9, exp: 4000 },
      { level: 10, exp: 5500 }
    ]
    
    let newLevel = 1
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
      if (newExp >= LEVEL_CONFIG[i].exp) {
        newLevel = LEVEL_CONFIG[i].level
        break
      }
    }
    
    // 更新用户经验和等级
    await this.db.collection('uni-id-users')
      .doc(targetUserId)
      .update({
        exp: newExp,
        level: newLevel
      })
    
    const leveledUp = newLevel > oldLevel
    
    console.log('⭐ 增加经验值:', {
      userId: targetUserId,
      expAmount,
      reason,
      oldExp,
      newExp,
      oldLevel,
      newLevel,
      leveledUp
    })
    
    return returnSuccess({
      old_exp: oldExp,
      new_exp: newExp,
      exp_added: expAmount,
      old_level: oldLevel,
      new_level: newLevel,
      leveled_up: leveledUp,
      reason
    }, leveledUp ? `恭喜！升级到 ${newLevel} 级` : '经验值增加成功')
  },
  
  /**
   * 获取用户统计数据
   * @param {String} targetUserId - 目标用户ID（可选，默认当前用户）
   * @returns {Object} 返回用户各项统计数据
   */
  async getStats(targetUserId) {
    const userId = targetUserId || this.currentUserId
    
    if (!userId) {
      throw new Error('用户ID不能为空')
    }
    
    try {
      // 并行获取各项统计数据
      const [
        uploadCount,      // 上传剧本数
        favoriteCount,    // 收藏数（剧本+帖子）
        carpoolCount,     // 创建拼车数
        joinedCarpoolCount, // 参与拼车数
        postCount,        // 发布帖子数
        commentCount,     // 发表评论数
        likeCount,        // 获得点赞数
        viewCount,        // 获得浏览数
        chatCount,        // 私聊会话数
        historyCount      // 浏览历史数
      ] = await Promise.all([
        // 上传剧本数
        this.db.collection('botc-scripts').where({
          uploader_id: userId
        }).count(),
        
        // 收藏数（剧本+帖子）
        this.db.collection('botc-favorites').where({
          user_id: userId
        }).count().catch(() => ({ total: 0 })),
        
        // 创建拼车数
        this.db.collection('botc-carpool-rooms').where({
          host_id: userId
        }).count(),
        
        // 参与拼车数
        this.db.collection('botc-carpool-members').where({
          user_id: userId,
          status: this.dbCmd.neq(0) // 排除已退出
        }).count(),
        
        // 发布帖子数
        this.db.collection('botc-posts').where({
          user_id: userId,
          status: this.dbCmd.neq(0) // 排除已删除
        }).count(),
        
        // 发表评论数
        this.db.collection('botc-post-comments').where({
          user_id: userId,
          status: this.dbCmd.neq(0) // 排除已删除
        }).count(),
        
        // 获得点赞数（帖子）
        this.db.collection('botc-posts').where({
          user_id: userId,
          status: 1
        }).field({
          like_count: true
        }).get().then(res => {
          return { total: res.data.reduce((sum, item) => sum + (item.like_count || 0), 0) }
        }),
        
        // 获得浏览数（帖子）
        this.db.collection('botc-posts').where({
          user_id: userId,
          status: 1
        }).field({
          view_count: true
        }).get().then(res => {
          return { total: res.data.reduce((sum, item) => sum + (item.view_count || 0), 0) }
        }),
        
        // 私聊会话数
        this.db.collection('botc-chat-conversations').where(
          this.dbCmd.or([
            { user1_id: userId },
            { user2_id: userId }
          ])
        ).count().catch(() => ({ total: 0 })),
        
        // 浏览历史数
        this.db.collection('botc-browse-history').where({
          user_id: userId
        }).count().catch(() => ({ total: 0 }))
      ])
      
      return returnSuccess({
        uploadCount: uploadCount.total || 0,
        favoriteCount: favoriteCount.total || 0,
        carpoolCount: carpoolCount.total || 0,
        joinedCarpoolCount: joinedCarpoolCount.total || 0,
        postCount: postCount.total || 0,
        commentCount: commentCount.total || 0,
        likeCount: likeCount.total || 0,
        viewCount: viewCount.total || 0,
        chatCount: chatCount.total || 0,
        historyCount: historyCount.total || 0
      }, '获取统计数据成功')
      
    } catch (error) {
      console.error('❌ 获取用户统计失败:', error)
      throw new Error('获取统计数据失败')
    }
  },
  
  /**
   * 同步用户关注和粉丝数据
   * 修复数据不一致的问题
   * @param {String} targetUserId - 目标用户ID（可选，为空则同步所有用户）
   * @returns {Object} 返回同步结果
   */
  async syncFollowData(targetUserId) {
    try {
      let fixedCount = 0
      let totalCount = 0
      
      // 如果指定了用户ID，只同步该用户
      if (targetUserId) {
        const user = await this.db.collection('uni-id-users')
          .doc(targetUserId)
          .get()
        
        if (!user.data || user.data.length === 0) {
          throw new Error('用户不存在')
        }
        
        // 统计该用户的关注数
        const followingCountResult = await this.db.collection('botc-user-follows')
          .where({
            follower_id: targetUserId,
            status: 1
          })
          .count()
        
        // 统计该用户的粉丝数
        const followersCountResult = await this.db.collection('botc-user-follows')
          .where({
            following_id: targetUserId,
            status: 1
          })
          .count()
        
        const actualFollowingCount = followingCountResult.total || 0
        const actualFollowersCount = followersCountResult.total || 0
        
        // 更新用户数据
        await this.db.collection('uni-id-users').doc(targetUserId).update({
          following_count: actualFollowingCount,
          followers_count: actualFollowersCount
        })
        
        totalCount = 1
        fixedCount = 1
        
        console.log(`✅ 用户关注数据已同步: 关注${actualFollowingCount}, 粉丝${actualFollowersCount}`)
        
      } else {
        // 同步所有用户（管理员功能）
        // 检查权限（仅限管理员）
        checkAuth(this.currentUserId)
        
        // 获取所有用户
        const usersResult = await this.db.collection('uni-id-users').get()
        const users = usersResult.data || []
        
        totalCount = users.length
        console.log(`📊 共找到 ${totalCount} 个用户需要同步`)
        
        // 批量处理用户
        for (const user of users) {
          try {
            // 统计该用户的关注数
            const followingCountResult = await this.db.collection('botc-user-follows')
              .where({
                follower_id: user._id,
                status: 1
              })
              .count()
            
            // 统计该用户的粉丝数
            const followersCountResult = await this.db.collection('botc-user-follows')
              .where({
                following_id: user._id,
                status: 1
              })
              .count()
            
            const actualFollowingCount = followingCountResult.total || 0
            const actualFollowersCount = followersCountResult.total || 0
            
            // 检查是否需要更新
            const needUpdate = 
              (user.following_count || 0) !== actualFollowingCount ||
              (user.followers_count || 0) !== actualFollowersCount
            
            if (needUpdate) {
              await this.db.collection('uni-id-users').doc(user._id).update({
                following_count: actualFollowingCount,
                followers_count: actualFollowersCount
              })
              
              console.log(`✅ 用户 ${user.nickname || user._id} 数据已同步: 关注${actualFollowingCount}, 粉丝${actualFollowersCount}`)
              fixedCount++
            }
            
          } catch (userError) {
            console.error(`❌ 处理用户 ${user._id} 时出错:`, userError)
          }
        }
      }
      
      console.log(`🎉 同步完成: 总用户数${totalCount}, 修复用户数${fixedCount}`)
      
      return returnSuccess({
        total_users: totalCount,
        fixed_users: fixedCount,
        success_rate: totalCount > 0 ? ((totalCount - fixedCount + fixedCount) / totalCount * 100).toFixed(2) + '%' : '100%'
      }, '同步成功')
      
    } catch (error) {
      console.error('❌ 同步用户关注数据失败:', error)
      throw new Error('同步失败：' + error.message)
    }
  }
}

