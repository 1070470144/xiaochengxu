'use strict';

/**
 * Carpool 云对象
 * 拼车功能统一管理
 * 
 * 功能列表：
 * 1. create - 创建拼车
 * 2. getList - 获取拼车列表
 * 3. getDetail - 获取拼车详情
 * 4. apply - 申请加入拼车
 * 5. getMyApplications - 获取我的申请列表
 * 6. cancelApply - 取消申请
 * 7. confirmMember - 确认成员（车主操作）
 * 8. removeMember - 移除成员（车主操作）
 * 9. updateStatus - 更新拼车状态（车主操作）
 */

// ========== 工具函数（外部，避免 this 上下文问题）==========

/**
 * 统一返回成功
 */
function returnSuccess(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data
  }
}

/**
 * 统一返回错误
 */
function returnError(message, code = 500) {
  return {
    code,
    message,
    data: null
  }
}

/**
 * 解析用户 ID
 */
function parseUserId(clientInfo, token) {
  // 尝试从 clientInfo 中获取
  if (clientInfo && clientInfo.uniIdToken) {
    try {
      const tokenPayload = JSON.parse(Buffer.from(clientInfo.uniIdToken.split('.')[1], 'base64').toString())
      if (tokenPayload.uid) {
        return tokenPayload.uid
      }
    } catch (e) {
      console.log('解析 uniIdToken 失败:', e)
    }
  }
  
  // 尝试从简单 token 中获取
  if (token) {
    const uid = token.split('_')[0]
    if (uid) {
      return uid
    }
  }
  
  return null
}

/**
 * 验证登录
 */
function checkAuth(userId) {
  if (!userId) {
    throw new Error('请先登录')
  }
}

/**
 * 验证拼车数据
 */
function validateCarpoolData(data) {
  const required = ['title', 'game_time', 'location']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`缺少必填字段: ${field}`)
    }
  }
  
  // 验证游戏时间不能是过去
  const gameTime = new Date(data.game_time)
  const now = new Date()
  if (gameTime <= now) {
    throw new Error('游戏时间不能是过去的时间')
  }
}

/**
 * 生成房间号
 */
function generateRoomNumber() {
  return 'BOTC' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100).toString().padStart(2, '0')
}

/**
 * 格式化拼车数据
 */
function formatCarpoolData(data, userId) {
  return {
    room_number: generateRoomNumber(),
    title: data.title,
    script_id: data.script_id || null,
    host_id: userId,
    storyteller_id: data.storyteller_id || null,
    game_time: new Date(data.game_time),
    location: data.location,
    location_detail: data.location_detail || '',
    latitude: data.latitude ? parseFloat(data.latitude) : null,
    longitude: data.longitude ? parseFloat(data.longitude) : null,
    max_players: parseInt(data.max_players || 7),
    current_players: 1, // 创建者自动算1人
    description: data.description || '',
    requirements: data.requirements || '',
    contact_wechat: data.contact_wechat || '',
    contact_phone: data.contact_phone || '',
    status: 1, // 招募中
    is_public: true,
    tags: data.tags || [],
    created_at: new Date(),
    updated_at: new Date()
  }
}

/**
 * 验证是否是车主
 */
async function checkIsCreator(db, roomId, userId) {
  const room = await db.collection('botc-carpool-rooms')
    .doc(roomId)
    .field({ host_id: true })
    .get()
  
  if (!room.data.length) {
    throw new Error('拼车不存在')
  }
  
  if (room.data[0].host_id !== userId) {
    throw new Error('无权操作')
  }
  
  return room.data[0]
}

/**
 * 处理列表数据，隐藏敏感信息
 */
function processListData(list) {
  return list.map(room => ({
    ...room,
    host: room.host ? {
      _id: room.host._id,
      nickname: room.host.nickname,
      avatar: room.host.avatar,
      level: room.host.level
    } : null,
    script: room.script ? {
      _id: room.script._id,
      title: room.script.title,
      player_count: room.script.player_count,
      difficulty: room.script.difficulty
    } : null,
    storyteller: room.storyteller ? {
      _id: room.storyteller._id,
      nickname: room.storyteller.nickname,
      avatar: room.storyteller.avatar
    } : null,
    // 隐藏敏感联系信息，详情页才显示
    contact_wechat: undefined,
    contact_phone: undefined
  }))
}

// ========== 云对象主体 ==========

module.exports = {
  _before() {
    // 初始化数据库连接
    this.db = uniCloud.database()
    this.dbCmd = this.db.command
    
    // 获取客户端信息
    this.clientInfo = this.getClientInfo()
    
    // 解析 token
    const token = this.clientInfo.uniIdToken || this.getMethodParam()[0]?.token || ''
    
    // 获取当前用户 ID
    this.currentUserId = parseUserId(this.clientInfo, token)
    
    console.log('🔧 carpool 云对象调用:', {
      method: this.getMethodName(),
      userId: this.currentUserId || '未登录',
      clientIP: this.clientInfo.clientIP
    })
  },
  
  _after(error, result) {
    if (error) {
      console.error('❌ carpool 云对象错误:', {
        method: this.getMethodName(),
        error: error.message,
        stack: error.stack
      })
      
      return returnError(error.message)
    }
    
    console.log('✅ carpool 云对象成功:', {
      method: this.getMethodName(),
      code: result.code
    })
    
    return result
  },
  
  // ========== Phase 1: 核心功能 ==========
  
  /**
   * 1. 创建拼车
   */
  async create(carpoolData) {
    // 1. 验证登录
    checkAuth(this.currentUserId)
    
    // 2. 验证数据
    validateCarpoolData(carpoolData)
    
    // 3. 格式化数据
    const data = formatCarpoolData(carpoolData, this.currentUserId)
    
    // 4. 插入拼车数据
    const roomCollection = this.db.collection('botc-carpool-rooms')
    const result = await roomCollection.add(data)
    
    // 5. 自动将创建者加入到成员表
    const memberCollection = this.db.collection('botc-carpool-members')
    await memberCollection.add({
      room_id: result.id,
      user_id: this.currentUserId,
      join_type: 1, // 主动创建
      status: 2, // 已确认（房主默认确认）
      joined_at: new Date(),
      confirmed_at: new Date()
    })
    
    // 6. 返回结果
    return returnSuccess({
      room_id: result.id,
      room_number: data.room_number,
      status: data.status
    }, '创建拼车成功')
  },
  
  /**
   * 2. 获取拼车列表
   */
  async getList(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      type = 'all',
      location = '',
      status = '',
      dateFilter = ''
    } = options
    
    const roomCollection = this.db.collection('botc-carpool-rooms')
    
    // 构建查询条件
    const whereCondition = {
      is_public: true // 只查询公开的拼车
    }
    
    // 房主筛选（用于"我的拼车"页面）
    if (options.hostId) {
      whereCondition.host_id = options.hostId
      // 如果是查询自己创建的，显示所有状态
      delete whereCondition.status
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = parseInt(status)
    } else if (!options.hostId) {
      // 默认只显示招募中和已满员的（但查询自己创建的时显示全部）
      whereCondition.status = this.dbCmd.in([1, 2])
    }
    
    // 地点筛选
    if (location) {
      whereCondition.location = new RegExp(location, 'i')
    }
    
    // 时间筛选
    const now = new Date()
    if (dateFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      whereCondition.game_time = this.dbCmd.and([
        this.dbCmd.gte(todayStart),
        this.dbCmd.lt(todayEnd)
      ])
    } else if (dateFilter === 'week') {
      const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      whereCondition.game_time = this.dbCmd.and([
        this.dbCmd.gte(weekStart),
        this.dbCmd.lt(weekEnd)
      ])
    } else {
      // 默认只显示未来的拼车
      whereCondition.game_time = this.dbCmd.gte(now)
    }
    
    // 使用聚合查询，关联用户和剧本信息
    let query = roomCollection.aggregate()
      .match(whereCondition)
      .lookup({
        from: 'uni-id-users',
        localField: 'host_id',
        foreignField: '_id',
        as: 'host'
      })
      .lookup({
        from: 'botc-scripts',
        localField: 'script_id',
        foreignField: '_id',
        as: 'script'
      })
      .lookup({
        from: 'uni-id-users',
        localField: 'storyteller_id',
        foreignField: '_id',
        as: 'storyteller'
      })
      .addFields({
        host: { $arrayElemAt: ['$host', 0] },
        script: { $arrayElemAt: ['$script', 0] },
        storyteller: { $arrayElemAt: ['$storyteller', 0] }
      })
    
    // 排序规则
    let sortCondition = { created_at: -1 }
    switch (type) {
      case 'latest':
        sortCondition = { created_at: -1 }
        break
      case 'urgent':
        sortCondition = { game_time: 1 } // 按游戏时间升序，最近的在前
        break
      case 'hot':
        sortCondition = { current_players: -1, created_at: -1 }
        break
    }
    
    query = query.sort(sortCondition)
    
    // 分页
    const skip = (page - 1) * pageSize
    query = query.skip(skip).limit(pageSize)
    
    // 执行查询
    const listResult = await query.end()
    
    // 获取总数
    const countResult = await roomCollection.where(whereCondition).count()
    
    // 处理返回数据
    const processedList = processListData(listResult.data)
    
    return returnSuccess({
      list: processedList,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      hasNext: page * pageSize < countResult.total
    })
  },
  
  /**
   * 3. 获取拼车详情
   */
  async getDetail(roomId) {
    if (!roomId) {
      return returnError('缺少拼车ID', 400)
    }
    
    const roomCollection = this.db.collection('botc-carpool-rooms')
    
    // 使用聚合查询获取详情，包含关联信息
    const result = await roomCollection.aggregate()
      .match({ _id: roomId })
      .lookup({
        from: 'uni-id-users',
        localField: 'host_id',
        foreignField: '_id',
        as: 'host'
      })
      .lookup({
        from: 'botc-scripts',
        localField: 'script_id',
        foreignField: '_id',
        as: 'script'
      })
      .lookup({
        from: 'uni-id-users',
        localField: 'storyteller_id',
        foreignField: '_id',
        as: 'storyteller'
      })
      .addFields({
        host: { $arrayElemAt: ['$host', 0] },
        script: { $arrayElemAt: ['$script', 0] },
        storyteller: { $arrayElemAt: ['$storyteller', 0] }
      })
      .end()
    
    if (!result.data.length) {
      return returnError('拼车不存在', 404)
    }
    
    const room = result.data[0]
    
    // 获取成员列表
    const memberCollection = this.db.collection('botc-carpool-members')
    const membersResult = await memberCollection.aggregate()
      .match({
        room_id: roomId,
        status: this.dbCmd.neq(0) // 不包括已退出的
      })
      .lookup({
        from: 'uni-id-users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      })
      .addFields({
        user: { $arrayElemAt: ['$user', 0] }
      })
      .end()
    
    // 处理成员数据
    const members = membersResult.data.map(member => ({
      _id: member._id,
      user_id: member.user_id,
      nickname: member.user?.nickname,
      avatar: member.user?.avatar,
      level: member.user?.level,
      status: member.status,
      message: member.message,
      joined_at: member.joined_at
    }))
    
    // 处理房间数据
    const processedRoom = {
      ...room,
      host: room.host ? {
        _id: room.host._id,
        nickname: room.host.nickname,
        avatar: room.host.avatar,
        level: room.host.level
      } : null,
      script: room.script ? {
        _id: room.script._id,
        title: room.script.title,
        player_count: room.script.player_count,
        difficulty: room.script.difficulty,
        description: room.script.description
      } : null,
      storyteller: room.storyteller ? {
        _id: room.storyteller._id,
        nickname: room.storyteller.nickname,
        avatar: room.storyteller.avatar
      } : null,
      members: members
    }
    
    return returnSuccess(processedRoom)
  },
  
  /**
   * 4. 申请加入拼车
   */
  async apply(roomId, message = '') {
    // 1. 验证登录
    checkAuth(this.currentUserId)
    
    if (!roomId) {
      return returnError('缺少拼车ID', 400)
    }
    
    const roomCollection = this.db.collection('botc-carpool-rooms')
    const memberCollection = this.db.collection('botc-carpool-members')
    
    // 2. 检查房间是否存在且可报名
    const roomResult = await roomCollection.doc(roomId).get()
    
    if (!roomResult.data.length) {
      return returnError('拼车房间不存在', 404)
    }
    
    const room = roomResult.data[0]
    
    // 3. 检查房间状态
    if (room.status !== 1) {
      return returnError('该房间不在招募状态', 400)
    }
    
    // 4. 检查是否是房主
    if (room.host_id === this.currentUserId) {
      return returnError('不能报名自己发起的拼车', 400)
    }
    
    // 5. 检查是否已经报名
    const existingMember = await memberCollection.where({
      room_id: roomId,
      user_id: this.currentUserId,
      status: this.dbCmd.neq(0) // 不等于已退出
    }).get()
    
    if (existingMember.data.length > 0) {
      return returnError('您已经报名过了', 400)
    }
    
    // 6. 检查人数是否已满
    if (room.current_players >= room.max_players) {
      return returnError('房间人数已满', 400)
    }
    
    // 7. 添加成员记录
    const memberData = {
      room_id: roomId,
      user_id: this.currentUserId,
      join_type: 1, // 主动报名
      message: message.trim(),
      status: 1, // 已报名，等待确认
      joined_at: new Date()
    }
    
    await memberCollection.add(memberData)
    
    // 8. 更新房间当前人数
    await roomCollection.doc(roomId).update({
      current_players: this.dbCmd.inc(1),
      updated_at: new Date()
    })
    
    // 9. 检查是否满员
    const newCurrentPlayers = room.current_players + 1
    if (newCurrentPlayers >= room.max_players) {
      await roomCollection.doc(roomId).update({
        status: 2 // 已满员
      })
    }
    
    return returnSuccess({
      room_id: roomId,
      current_players: newCurrentPlayers,
      is_full: newCurrentPlayers >= room.max_players
    }, '报名成功，等待房主确认')
  },
  
  // ========== Phase 2: 管理功能 ==========
  
  /**
   * 5. 获取我的申请列表
   */
  async getMyApplications(page = 1, pageSize = 10) {
    // 验证登录
    checkAuth(this.currentUserId)
    
    const memberCollection = this.db.collection('botc-carpool-members')
    
    // 查询我的申请
    const result = await memberCollection.aggregate()
      .match({
        user_id: this.currentUserId,
        status: this.dbCmd.neq(0) // 不包括已退出的
      })
      .lookup({
        from: 'botc-carpool-rooms',
        localField: 'room_id',
        foreignField: '_id',
        as: 'room'
      })
      .addFields({
        room: { $arrayElemAt: ['$room', 0] }
      })
      .sort({ joined_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .end()
    
    // 获取总数
    const countResult = await memberCollection.where({
      user_id: this.currentUserId,
      status: this.dbCmd.neq(0)
    }).count()
    
    return returnSuccess({
      list: result.data,
      total: countResult.total,
      page,
      pageSize
    })
  },
  
  /**
   * 6. 取消申请
   */
  async cancelApply(roomId) {
    // 验证登录
    checkAuth(this.currentUserId)
    
    if (!roomId) {
      return returnError('缺少拼车ID', 400)
    }
    
    const roomCollection = this.db.collection('botc-carpool-rooms')
    const memberCollection = this.db.collection('botc-carpool-members')
    
    // 查找申请记录
    const memberResult = await memberCollection.where({
      room_id: roomId,
      user_id: this.currentUserId,
      status: this.dbCmd.in([1, 2]) // 待确认或已确认
    }).get()
    
    if (!memberResult.data.length) {
      return returnError('未找到申请记录', 404)
    }
    
    const member = memberResult.data[0]
    
    // 更新申请状态为已取消
    await memberCollection.doc(member._id).update({
      status: 0, // 已退出
      updated_at: new Date()
    })
    
    // 更新房间人数
    await roomCollection.doc(roomId).update({
      current_players: this.dbCmd.inc(-1),
      updated_at: new Date()
    })
    
    // 如果房间之前是满员状态，现在有空位了，改为招募中
    const roomResult = await roomCollection.doc(roomId).get()
    if (roomResult.data.length && roomResult.data[0].status === 2) {
      await roomCollection.doc(roomId).update({
        status: 1 // 招募中
      })
    }
    
    return returnSuccess(null, '取消申请成功')
  },
  
  /**
   * 7. 确认成员（车主操作）
   */
  async confirmMember(roomId, userId) {
    // 验证登录
    checkAuth(this.currentUserId)
    
    if (!roomId || !userId) {
      return returnError('缺少必要参数', 400)
    }
    
    // 验证是车主
    await checkIsCreator(this.db, roomId, this.currentUserId)
    
    const memberCollection = this.db.collection('botc-carpool-members')
    
    // 查找待确认的申请
    const memberResult = await memberCollection.where({
      room_id: roomId,
      user_id: userId,
      status: 1 // 待确认
    }).get()
    
    if (!memberResult.data.length) {
      return returnError('未找到待确认的申请', 404)
    }
    
    // 更新状态为已确认
    await memberCollection.doc(memberResult.data[0]._id).update({
      status: 2, // 已确认
      confirmed_at: new Date(),
      updated_at: new Date()
    })
    
    return returnSuccess(null, '确认成功')
  },
  
  /**
   * 8. 移除成员（车主操作）
   */
  async removeMember(roomId, userId) {
    // 验证登录
    checkAuth(this.currentUserId)
    
    if (!roomId || !userId) {
      return returnError('缺少必要参数', 400)
    }
    
    // 验证是车主
    await checkIsCreator(this.db, roomId, this.currentUserId)
    
    // 不能移除自己
    if (userId === this.currentUserId) {
      return returnError('不能移除自己', 400)
    }
    
    const roomCollection = this.db.collection('botc-carpool-rooms')
    const memberCollection = this.db.collection('botc-carpool-members')
    
    // 查找成员记录
    const memberResult = await memberCollection.where({
      room_id: roomId,
      user_id: userId,
      status: this.dbCmd.in([1, 2]) // 待确认或已确认
    }).get()
    
    if (!memberResult.data.length) {
      return returnError('未找到成员记录', 404)
    }
    
    // 更新状态为已移除
    await memberCollection.doc(memberResult.data[0]._id).update({
      status: 0, // 已退出
      updated_at: new Date()
    })
    
    // 更新房间人数
    await roomCollection.doc(roomId).update({
      current_players: this.dbCmd.inc(-1),
      updated_at: new Date()
    })
    
    // 如果房间之前是满员状态，改为招募中
    const roomResult = await roomCollection.doc(roomId).get()
    if (roomResult.data.length && roomResult.data[0].status === 2) {
      await roomCollection.doc(roomId).update({
        status: 1 // 招募中
      })
    }
    
    return returnSuccess(null, '移除成功')
  },
  
  /**
   * 9. 更新拼车状态（车主操作）
   */
  async updateStatus(roomId, status) {
    // 验证登录
    checkAuth(this.currentUserId)
    
    if (!roomId || status === undefined) {
      return returnError('缺少必要参数', 400)
    }
    
    // 验证状态有效性
    const validStatuses = [1, 2, 3, 4] // 招募中/已满员/已完成/已取消
    if (!validStatuses.includes(parseInt(status))) {
      return returnError('无效的状态值', 400)
    }
    
    // 验证是车主
    await checkIsCreator(this.db, roomId, this.currentUserId)
    
    const roomCollection = this.db.collection('botc-carpool-rooms')
    
    // 更新状态
    await roomCollection.doc(roomId).update({
      status: parseInt(status),
      updated_at: new Date()
    })
    
    return returnSuccess(null, '状态更新成功')
  }
}

