'use strict';

/**
 * 云函数：获取用户的系统消息
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
  // 从参数中获取用户ID，或者从 context 中获取
  let userId = event.userId
  
  // 如果没有传 userId，尝试从 context 获取
  if (!userId) {
    const clientInfo = context.CLIENTINFO || {}
    userId = clientInfo.uid || clientInfo.user_id
  }
  
  if (!userId) {
    console.error('未提供用户ID')
    return {
      code: 401,
      message: '未登录：缺少用户ID'
    }
  }
  
  const { messageId, page = 1, pageSize = 20 } = event
  
  console.log('=== 查询系统消息 ===')
  console.log('用户ID:', userId)
  console.log('消息ID:', messageId || '无（查询列表）')
  console.log('来源:', event.userId ? '参数传递' : 'context获取')
  
  // 如果提供了 messageId，查询单条消息详情
  if (messageId) {
    return await getMessageDetail(userId, messageId)
  }
  
  try {
    console.log('页码:', page)
    console.log('每页条数:', pageSize)
    
    // 查询消息列表
    const res = await db.collection('botc-system-messages')
      .where({
        user_id: userId
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    console.log('查询结果条数:', res.data ? res.data.length : 0)
    
    // 查询未读数量
    const unreadRes = await db.collection('botc-system-messages')
      .where({
        user_id: userId,
        is_read: false
      })
      .count()
    
    return {
      code: 0,
      message: '查询成功',
      data: {
        list: res.data || [],
        total: res.data ? res.data.length : 0,
        unreadCount: unreadRes.total || 0,
        page,
        pageSize
      }
    }
    
  } catch (error) {
    console.error('查询系统消息失败:', error)
    return {
      code: 500,
      message: '查询失败: ' + error.message
    }
  }
}

// 获取消息详情
async function getMessageDetail(userId, messageId) {
  try {
    console.log('=== 查询消息详情 ===')
    console.log('用户ID:', userId)
    console.log('消息ID:', messageId)
    
    const res = await db.collection('botc-system-messages')
      .doc(messageId)
      .get()
    
    if (!res.data || res.data.length === 0) {
      return {
        code: 404,
        message: '消息不存在'
      }
    }
    
    const message = res.data[0]
    
    // 验证消息是否属于该用户
    if (message.user_id !== userId) {
      return {
        code: 403,
        message: '无权访问该消息'
      }
    }
    
    // 如果消息未读，标记为已读
    if (!message.is_read) {
      await db.collection('botc-system-messages')
        .doc(messageId)
        .update({
          is_read: true,
          read_at: Date.now()
        })
      
      message.is_read = true
      message.read_at = Date.now()
    }
    
    return {
      code: 0,
      message: '查询成功',
      data: message
    }
    
  } catch (error) {
    console.error('查询消息详情失败:', error)
    return {
      code: 500,
      message: '查询失败: ' + error.message
    }
  }
}

