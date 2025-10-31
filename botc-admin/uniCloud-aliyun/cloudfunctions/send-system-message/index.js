'use strict';

/**
 * 云函数：发送系统消息
 * 用途：管理端发送系统消息给用户
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
  const { userId, type, title, content, relatedType, relatedId } = event
  
  // 参数验证
  if (!userId) {
    return {
      code: 400,
      message: '缺少用户ID'
    }
  }
  
  if (!title || !content) {
    return {
      code: 400,
      message: '缺少标题或内容'
    }
  }
  
  try {
    console.log('=== 云函数：发送系统消息 ===')
    console.log('目标用户ID:', userId)
    console.log('消息类型:', type)
    console.log('标题:', title)
    console.log('内容:', content)
    
    // 写入数据库（云函数有完全权限，不受schema限制）
    const result = await db.collection('botc-system-messages').add({
      user_id: userId,
      type: type || 'system',
      title: title,
      content: content,
      related_type: relatedType || '',
      related_id: relatedId || '',
      is_read: false,
      created_at: Date.now()
    })
    
    console.log('写入结果:', result)
    
    if (result.id) {
      console.log('✅ 系统消息发送成功，ID:', result.id)
      
      return {
        code: 0,
        message: '发送成功',
        data: {
          messageId: result.id
        }
      }
    } else {
      console.error('❌ 写入失败，没有返回ID')
      return {
        code: 500,
        message: '发送失败'
      }
    }
    
  } catch (error) {
    console.error('发送系统消息失败:', error)
    return {
      code: 500,
      message: '发送失败: ' + error.message
    }
  }
}

