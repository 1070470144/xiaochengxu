'use strict';

// 获取拼车列表云函数
exports.main = async (event, context) => {
  console.log('获取拼车列表，参数：', event)
  
  const { 
    page = 1, 
    pageSize = 20, 
    type = 'all',
    location = '',
    status = '',
    dateFilter = ''
  } = event
  
  const db = uniCloud.database()
  const collection = db.collection('botc-carpool-rooms')
  
  try {
    // 构建查询条件
    let whereCondition = {
      is_public: true // 只查询公开的拼车
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = parseInt(status)
    } else {
      // 默认只显示招募中和已满员的
      whereCondition.status = db.command.in([1, 2])
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
      whereCondition.game_time = {
        $gte: todayStart,
        $lt: todayEnd
      }
    } else if (dateFilter === 'week') {
      const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      whereCondition.game_time = {
        $gte: weekStart,
        $lt: weekEnd
      }
    } else {
      // 默认只显示未来的拼车
      whereCondition.game_time = {
        $gte: now
      }
    }
    
    // 使用聚合查询，关联用户和剧本信息
    let query = collection.aggregate()
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
    const countResult = await collection.where(whereCondition).count()
    
    // 处理返回数据，只返回必要信息
    const processedList = listResult.data.map(room => ({
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
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: processedList,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        hasNext: page * pageSize < countResult.total
      }
    }
    
  } catch (error) {
    console.error('获取拼车列表失败：', error)
    return {
      code: 500,
      message: '获取拼车列表失败',
      data: null
    }
  }
}
