'use strict';

// 报名参加拼车云函数
exports.main = async (event, context) => {
  console.log('报名参加拼车，参数：', event)
  
  const { roomId, message = '' } = event
  
  if (!roomId) {
    return {
      code: 400,
      message: '房间ID不能为空',
      data: null
    }
  }
  
  // 获取当前用户ID
  const uniIdCommon = require('uni-id-common')
  const { uid } = await uniIdCommon.checkToken(event.uniIdToken)
  
  if (!uid) {
    return {
      code: 401,
      message: '请先登录',
      data: null
    }
  }
  
  const db = uniCloud.database()
  const roomCollection = db.collection('botc-carpool-rooms')
  const memberCollection = db.collection('botc-carpool-members')
  
  try {
    // 检查房间是否存在且可报名
    const roomResult = await roomCollection.doc(roomId).get()
    
    if (roomResult.data.length === 0) {
      return {
        code: 404,
        message: '拼车房间不存在',
        data: null
      }
    }
    
    const room = roomResult.data[0]
    
    // 检查房间状态
    if (room.status !== 1) {
      return {
        code: 400,
        message: '该房间不在招募状态',
        data: null
      }
    }
    
    // 检查是否已经报名
    const existingMember = await memberCollection.where({
      room_id: roomId,
      user_id: uid,
      status: db.command.neq(0) // 不等于已退出
    }).get()
    
    if (existingMember.data.length > 0) {
      return {
        code: 400,
        message: '您已经报名过了',
        data: null
      }
    }
    
    // 检查是否是房主（房主不能报名自己的房间）
    if (room.host_id === uid) {
      return {
        code: 400,
        message: '不能报名自己发起的拼车',
        data: null
      }
    }
    
    // 检查人数是否已满
    if (room.current_players >= room.max_players) {
      return {
        code: 400,
        message: '房间人数已满',
        data: null
      }
    }
    
    // 添加成员记录
    const memberData = {
      room_id: roomId,
      user_id: uid,
      join_type: 1, // 主动报名
      message: message.trim(),
      status: 1, // 已报名，等待确认
      joined_at: new Date()
    }
    
    await memberCollection.add(memberData)
    
    // 更新房间当前人数
    await roomCollection.doc(roomId).update({
      current_players: db.command.inc(1),
      updated_at: new Date()
    })
    
    // 检查是否满员，如果满员则更新状态
    const newCurrentPlayers = room.current_players + 1
    if (newCurrentPlayers >= room.max_players) {
      await roomCollection.doc(roomId).update({
        status: 2 // 已满员
      })
    }
    
    return {
      code: 0,
      message: '报名成功，等待房主确认',
      data: {
        room_id: roomId,
        current_players: newCurrentPlayers,
        is_full: newCurrentPlayers >= room.max_players
      }
    }
    
  } catch (error) {
    console.error('报名拼车失败：', error)
    return {
      code: 500,
      message: '报名失败，请重试',
      data: null
    }
  }
}
