'use strict';

/**
 * 发送私聊消息云函数
 */
exports.main = async (event, context) => {
  console.log('发送私聊消息，参数：', event)
  
  const {
    receiver_id,  // 接收者ID
    content,      // 消息内容
    message_type = 1,  // 消息类型：1-文本
    token
  } = event
  
  // 验证参数
  if (!receiver_id) {
    return {
      code: 400,
      message: '接收者ID不能为空'
    }
  }
  
  if (!content || content.trim().length === 0) {
    return {
      code: 400,
      message: '消息内容不能为空'
    }
  }
  
  if (content.length > 1000) {
    return {
      code: 400,
      message: '消息内容不能超过1000字'
    }
  }
  
  // 验证token并获取当前用户ID
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const senderId = token.split('_')[0]
  
  if (!senderId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  // 不能给自己发消息
  if (senderId === receiver_id) {
    return {
      code: 400,
      message: '不能给自己发消息'
    }
  }
  
  const db = uniCloud.database()
  const conversationsCollection = db.collection('botc-chat-conversations')
  const messagesCollection = db.collection('botc-chat-messages')
  
  try {
    // 1. 查找或创建会话
    let conversation
    const conversationResult = await conversationsCollection
      .where(db.command.or([
        {
          user1_id: senderId,
          user2_id: receiver_id
        },
        {
          user1_id: receiver_id,
          user2_id: senderId
        }
      ]))
      .get()
    
    if (conversationResult.data && conversationResult.data.length > 0) {
      // 会话已存在
      conversation = conversationResult.data[0]
    } else {
      // 创建新会话
      const newConvResult = await conversationsCollection.add({
        user1_id: senderId,
        user2_id: receiver_id,
        last_message: '',
        last_message_time: new Date(),
        user1_unread_count: 0,
        user2_unread_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      })
      
      conversation = {
        _id: newConvResult.id,
        user1_id: senderId,
        user2_id: receiver_id
      }
    }
    
    // 2. 创建消息记录
    const messageResult = await messagesCollection.add({
      conversation_id: conversation._id,
      sender_id: senderId,
      receiver_id: receiver_id,
      content: content.trim(),
      message_type: message_type,
      is_read: false,
      created_at: new Date()
    })
    
    // 3. 更新会话信息
    const updateData = {
      last_message: content.trim().substring(0, 200),
      last_message_time: new Date(),
      updated_at: new Date()
    }
    
    // 更新接收方的未读数
    if (conversation.user1_id === receiver_id) {
      updateData.user1_unread_count = (conversation.user1_unread_count || 0) + 1
    } else {
      updateData.user2_unread_count = (conversation.user2_unread_count || 0) + 1
    }
    
    await conversationsCollection.doc(conversation._id).update(updateData)
    
    return {
      code: 0,
      message: '发送成功',
      data: {
        message_id: messageResult.id,
        conversation_id: conversation._id,
        created_at: new Date()
      }
    }
    
  } catch (error) {
    console.error('发送消息失败：', error)
    return {
      code: 500,
      message: '发送失败，请重试',
      error: error.message
    }
  }
}

