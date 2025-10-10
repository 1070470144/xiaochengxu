'use strict';

// 获取聊天会话列表云函数
exports.main = async (event, context) => {
  console.log('获取聊天会话列表，参数：', event)
  
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
  const messageCollection = db.collection('botc-chat-messages')
  
  try {
    // 获取用户的所有聊天对象
    const conversationsResult = await messageCollection.aggregate()
      .match({
        $or: [
          { from_user_id: uid },
          { to_user_id: uid }
        ]
      })
      .group({
        _id: {
          $cond: {
            if: { $eq: ['$from_user_id', uid] },
            then: '$to_user_id',
            else: '$from_user_id'
          }
        },
        last_message: { $last: '$$ROOT' },
        last_message_time: { $max: '$created_at' },
        unread_count: {
          $sum: {
            $cond: {
              if: { 
                $and: [
                  { $eq: ['$to_user_id', uid] },
                  { $eq: ['$is_read', false] }
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      })
      .lookup({
        from: 'uni-id-users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      })
      .addFields({
        user: { $arrayElemAt: ['$user', 0] }
      })
      .sort({ last_message_time: -1 })
      .end()
    
    // 处理会话数据
    const conversations = conversationsResult.data.map(conv => ({
      user_id: conv._id,
      user: {
        _id: conv.user._id,
        nickname: conv.user.nickname,
        avatar: conv.user.avatar,
        level: conv.user.level
      },
      last_message: {
        content: conv.last_message.content,
        message_type: conv.last_message.message_type,
        created_at: conv.last_message.created_at,
        is_from_me: conv.last_message.from_user_id === uid
      },
      unread_count: conv.unread_count,
      last_message_time: conv.last_message_time
    }))
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: conversations
      }
    }
    
  } catch (error) {
    console.error('获取会话列表失败：', error)
    return {
      code: 500,
      message: '获取会话列表失败',
      data: null
    }
  }
}
