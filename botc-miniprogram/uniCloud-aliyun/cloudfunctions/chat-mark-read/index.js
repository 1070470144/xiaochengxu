'use strict';

/**
 * 标记聊天消息为已读的云函数
 */
exports.main = async (event, context) => {
  console.log('标记消息为已读，参数：', event)
  
  const {
    user_id,  // 对方用户ID
    conversation_id,  // 会话ID（可选）
    token
  } = event
  
  // 验证token并获取当前用户ID
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const currentUserId = token.split('_')[0]
  
  if (!currentUserId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  if (!user_id) {
    return {
      code: 400,
      message: '对方用户ID不能为空'
    }
  }
  
  const db = uniCloud.database()
  const $ = db.command
  
  try {
    let conversationResult
    
    // 1. 查找或获取会话ID
    if (conversation_id) {
      // 如果有会话ID，直接使用
      conversationResult = await db.collection('botc-chat-conversations')
        .doc(conversation_id)
        .get()
    } else {
      // 如果没有会话ID，根据用户ID查找
      conversationResult = await db.collection('botc-chat-conversations')
        .where($.or([
          {
            user1_id: currentUserId,
            user2_id: user_id
          },
          {
            user1_id: user_id,
            user2_id: currentUserId
          }
        ]))
        .get()
    }
    
    const conversations = conversationResult.data || []
    
    if (conversations.length === 0) {
      return {
        code: 404,
        message: '会话不存在'
      }
    }
    
    const conversation = conversations[0]
    const actualConversationId = conversation._id
    
    // 2. 将该会话中接收到的消息标记为已读
    const messagesUpdateResult = await db.collection('botc-chat-messages')
      .where({
        conversation_id: actualConversationId,
        receiver_id: currentUserId,  // 只标记当前用户接收到的消息
        is_read: false  // 只更新未读消息
      })
      .update({
        is_read: true
      })
    
    console.log(`标记了 ${messagesUpdateResult.updated} 条消息为已读`)
    
    // 3. 更新会话的未读数量
    let updateData = {}
    
    if (conversation.user1_id === currentUserId) {
      // 当前用户是user1，清零user1的未读数
      updateData.user1_unread_count = 0
    } else {
      // 当前用户是user2，清零user2的未读数  
      updateData.user2_unread_count = 0
    }
    
    await db.collection('botc-chat-conversations')
      .doc(actualConversationId)
      .update(updateData)
    
    console.log('更新会话未读数量:', updateData)
    
    return {
      code: 0,
      message: '标记成功',
      data: {
        conversation_id: actualConversationId,
        marked_messages_count: messagesUpdateResult.updated,
        updated_conversation: updateData
      }
    }
    
  } catch (error) {
    console.error('标记消息为已读失败：', error)
    return {
      code: 500,
      message: '标记失败，请重试',
      error: error.message
    }
  }
}
