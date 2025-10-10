'use strict';

// 发送私聊消息云函数
exports.main = async (event, context) => {
  console.log('发送私聊消息，参数：', event)
  
  const { toUserId, content, messageType = 1, mediaUrl, token } = event
  
  if (!toUserId || !content) {
    return {
      code: 400,
      message: '接收者和消息内容不能为空',
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
  
  const uid = token.split('_')[0]
  
  if (!uid) {
    return {
      code: 401,
      message: 'Token无效',
      data: null
    }
  }
  
  // 不能给自己发消息
  if (uid === toUserId) {
    return {
      code: 400,
      message: '不能给自己发消息',
      data: null
    }
  }
  
  const db = uniCloud.database()
  const collection = db.collection('botc-chat-messages')
  const userCollection = db.collection('uni-id-users')
  
  try {
    // 检查接收者是否存在
    const toUserResult = await userCollection.doc(toUserId).get()
    if (toUserResult.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      }
    }
    
    // 创建消息记录
    const messageData = {
      from_user_id: uid,
      to_user_id: toUserId,
      content: content.trim(),
      message_type: parseInt(messageType),
      media_url: mediaUrl || '',
      is_read: false,
      created_at: new Date()
    }
    
    const result = await collection.add(messageData)
    
    // TODO: 这里可以添加实时推送逻辑
    // 由于uniCloud不直接支持WebSocket，可以使用uni-push推送
    
    return {
      code: 0,
      message: '消息发送成功',
      data: {
        message_id: result.id,
        created_at: messageData.created_at
      }
    }
    
  } catch (error) {
    console.error('发送消息失败：', error)
    return {
      code: 500,
      message: '发送失败，请重试',
      data: null
    }
  }
}
