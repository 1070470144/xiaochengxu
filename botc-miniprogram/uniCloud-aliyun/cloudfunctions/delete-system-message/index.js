'use strict';

/**
 * 云函数：删除系统消息
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
  const { userId, messageId, deleteAll } = event
  
  if (!userId) {
    return {
      code: 401,
      message: '未登录：缺少用户ID'
    }
  }
  
  try {
    if (deleteAll) {
      // 删除该用户的所有消息
      console.log('=== 删除所有消息 ===')
      console.log('用户ID:', userId)
      
      const result = await db.collection('botc-system-messages')
        .where({
          user_id: userId
        })
        .remove()
      
      console.log('删除结果:', result)
      console.log('删除数量:', result.deleted)
      
      return {
        code: 0,
        message: '删除成功',
        data: {
          deleted: result.deleted
        }
      }
      
    } else if (messageId) {
      // 删除单条消息
      console.log('=== 删除单条消息 ===')
      console.log('用户ID:', userId)
      console.log('消息ID:', messageId)
      
      // 先查询消息，验证是否属于该用户
      const checkRes = await db.collection('botc-system-messages')
        .doc(messageId)
        .get()
      
      if (!checkRes.data || checkRes.data.length === 0) {
        return {
          code: 404,
          message: '消息不存在'
        }
      }
      
      const message = checkRes.data[0]
      if (message.user_id !== userId) {
        return {
          code: 403,
          message: '无权删除该消息'
        }
      }
      
      // 删除消息
      await db.collection('botc-system-messages')
        .doc(messageId)
        .remove()
      
      console.log('删除成功')
      
      return {
        code: 0,
        message: '删除成功'
      }
      
    } else {
      return {
        code: 400,
        message: '缺少参数：messageId 或 deleteAll'
      }
    }
    
  } catch (error) {
    console.error('删除消息失败:', error)
    return {
      code: 500,
      message: '删除失败: ' + error.message
    }
  }
}

