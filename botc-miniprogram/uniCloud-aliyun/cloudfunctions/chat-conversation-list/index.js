'use strict';

/**
 * 获取私聊会话列表云函数
 */
exports.main = async (event, context) => {
  console.log('获取私聊会话列表，参数：', event)
  
  const {
    page = 1,
    page_size = 20,
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
  
  const db = uniCloud.database()
  const conversationsCollection = db.collection('botc-chat-conversations')
  const usersCollection = db.collection('uni-id-users')
  
  try {
    // 查询当前用户的所有会话
    const conversationsResult = await conversationsCollection
      .where(db.command.or([
        { user1_id: currentUserId },
        { user2_id: currentUserId }
      ]))
      .orderBy('last_message_time', 'desc')
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get()
    
    const conversations = conversationsResult.data || []
    
    if (conversations.length === 0) {
      return {
        code: 0,
        message: '获取成功',
        data: {
          list: [],
          total: 0,
          page: page,
          page_size: page_size
        }
      }
    }
    
    // 获取所有对方用户ID
    const otherUserIds = conversations.map(conv => {
      return conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id
    })
    
    // 查询对方用户信息
    const usersResult = await usersCollection
      .where({
        _id: db.command.in(otherUserIds)
      })
      .field('_id,nickname,avatar')
      .get()
    
    const users = usersResult.data || []
    const usersMap = {}
    users.forEach(user => {
      usersMap[user._id] = user
    })
    
    // 组装会话列表数据
    const list = conversations.map(conv => {
      const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id
      const unreadCount = conv.user1_id === currentUserId ? conv.user1_unread_count : conv.user2_unread_count
      
      return {
        conversation_id: conv._id,
        other_user: usersMap[otherUserId] || {
          _id: otherUserId,
          nickname: '未知用户',
          avatar: ''
        },
        last_message: conv.last_message,
        last_message_time: conv.last_message_time,
        unread_count: unreadCount || 0
      }
    })
    
    // 获取总数
    const countResult = await conversationsCollection
      .where(db.command.or([
        { user1_id: currentUserId },
        { user2_id: currentUserId }
      ]))
      .count()
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list: list,
        total: countResult.total || 0,
        page: page,
        page_size: page_size
      }
    }
    
  } catch (error) {
    console.error('获取会话列表失败：', error)
    return {
      code: 500,
      message: '获取失败，请重试',
      error: error.message
    }
  }
}

