'use strict';

// 创建拼车房间云函数
exports.main = async (event, context) => {
  console.log('创建拼车房间，参数：', event)
  
  const {
    title,
    script_id,
    storyteller_id,
    game_time,
    location,
    location_detail,
    max_players = 7,
    description,
    requirements,
    contact_wechat,
    contact_phone,
    tags = [],
    token
  } = event
  
  // 参数验证
  if (!title || !game_time || !location) {
    return {
      code: 400,
      message: '标题、时间、地点不能为空',
      data: null
    }
  }
  
  // 验证token并获取用户ID
  if (!token) {
    return {
      code: 401,
      message: '请先登录',
      data: null
    }
  }
  
  // 解析token获取userId（简化方案）
  const uid = token.split('_')[0]
  
  if (!uid) {
    return {
      code: 401,
      message: 'Token无效',
      data: null
    }
  }
  
  const db = uniCloud.database()
  const collection = db.collection('botc-carpool-rooms')
  
  try {
    // 生成房间号
    const roomNumber = 'BOTC' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100).toString().padStart(2, '0')
    
    // 检查游戏时间是否合理（不能是过去时间）
    const gameTime = new Date(game_time)
    const now = new Date()
    if (gameTime <= now) {
      return {
        code: 400,
        message: '游戏时间不能是过去的时间',
        data: null
      }
    }
    
    // 创建拼车房间
    const carpoolData = {
      room_number: roomNumber,
      title,
      script_id: script_id || null,
      host_id: uid,
      storyteller_id: storyteller_id || null,
      game_time: gameTime,
      location,
      location_detail,
      max_players: parseInt(max_players),
      current_players: 1, // 创建者自动算1人
      description,
      requirements,
      contact_wechat,
      contact_phone,
      status: 1, // 招募中
      is_public: true,
      tags,
      created_at: new Date()
    }
    
    const result = await collection.add(carpoolData)
    
    // 自动将创建者加入到成员表
    const memberCollection = db.collection('botc-carpool-members')
    await memberCollection.add({
      room_id: result.id,
      user_id: uid,
      join_type: 1, // 主动创建
      status: 2, // 已确认（房主默认确认）
      joined_at: new Date(),
      confirmed_at: new Date()
    })
    
    return {
      code: 0,
      message: '创建拼车成功',
      data: {
        room_id: result.id,
        room_number: roomNumber,
        status: 1
      }
    }
    
  } catch (error) {
    console.error('创建拼车失败：', error)
    return {
      code: 500,
      message: '创建拼车失败',
      data: null
    }
  }
}
