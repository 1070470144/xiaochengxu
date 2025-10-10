'use strict';

// 获取拼车详情云函数
exports.main = async (event, context) => {
  console.log('获取拼车详情，参数：', event)
  
  const { id } = event
  
  if (!id) {
    return {
      code: 400,
      message: '房间ID不能为空',
      data: null
    }
  }
  
  const db = uniCloud.database()
  const roomCollection = db.collection('botc-carpool-rooms')
  const memberCollection = db.collection('botc-carpool-members')
  
  try {
    // 获取拼车房间详情（关联用户和剧本信息）
    const roomResult = await roomCollection.aggregate()
      .match({ _id: id })
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
    
    if (roomResult.data.length === 0) {
      return {
        code: 404,
        message: '拼车房间不存在',
        data: null
      }
    }
    
    const room = roomResult.data[0]
    
    // 获取报名成员列表
    const membersResult = await memberCollection.aggregate()
      .match({ 
        room_id: id,
        status: db.command.neq(0) // 排除已退出的成员
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
      .sort({ joined_at: 1 }) // 按报名时间排序
      .end()
    
    // 处理成员数据，只返回必要信息
    const processedMembers = membersResult.data.map(member => ({
      _id: member._id,
      user: member.user ? {
        _id: member.user._id,
        nickname: member.user.nickname,
        avatar: member.user.avatar,
        level: member.user.level
      } : null,
      message: member.message,
      status: member.status,
      joined_at: member.joined_at,
      confirmed_at: member.confirmed_at
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
        author: room.script.author,
        player_count: room.script.player_count,
        difficulty: room.script.difficulty,
        description: room.script.description
      } : null,
      storyteller: room.storyteller ? {
        _id: room.storyteller._id,
        nickname: room.storyteller.nickname,
        avatar: room.storyteller.avatar
      } : null,
      members: processedMembers
    }
    
    return {
      code: 0,
      message: 'success',
      data: processedRoom
    }
    
  } catch (error) {
    console.error('获取拼车详情失败：', error)
    return {
      code: 500,
      message: '获取拼车详情失败',
      data: null
    }
  }
}
