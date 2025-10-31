'use strict';

/**
 * 云函数：举报管理（管理端）
 * 功能：获取列表、处理举报、统计数据
 */

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { action, reportId, pageNo = 1, pageSize = 20, status, contentType, reason } = event
  
  try {
    // 获取举报列表
    if (action === 'list') {
      const where = {}
      
      // 状态筛选
      if (status) {
        where.status = status
      }
      
      // 内容类型筛选
      if (contentType) {
        where.content_type = contentType
      }
      
      // 原因筛选
      if (reason) {
        where.reason = reason
      }
      
      // 查询总数
      const countRes = await db.collection('botc-reports')
        .where(where)
        .count()
      
      // 查询列表
      const listRes = await db.collection('botc-reports')
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          list: listRes.data,
          total: countRes.total,
          pageNo,
          pageSize
        }
      }
    }
    
    // 处理举报
    if (action === 'handle') {
      if (!reportId) {
        return { code: 400, message: '缺少举报ID' }
      }
      
      const { handleResult, handleRemark } = event
      
      if (!handleResult) {
        return { code: 400, message: '请选择处理结果' }
      }
      
      // 获取举报信息
      const reportRes = await db.collection('botc-reports')
        .doc(reportId)
        .get()
      
      if (!reportRes.data || reportRes.data.length === 0) {
        return { code: 404, message: '举报记录不存在' }
      }
      
      const report = reportRes.data[0]
      
      // 更新举报状态
      await db.collection('botc-reports')
        .doc(reportId)
        .update({
          status: 'resolved',
          handle_result: handleResult,
          handle_remark: handleRemark || '',
          handled_at: Date.now(),
          updated_at: Date.now()
        })
      
      // 根据处理结果执行相应操作
      const contentType = report.content_type || report.target_type
      const contentId = report.content_id || report.target_id
      let reportedUserId = report.reported_user_id
      
      // 如果没有被举报用户ID，尝试从内容中获取
      if (!reportedUserId && contentId) {
        reportedUserId = await getUserIdFromContent(contentType, contentId)
      }
      
      if (handleResult === 'delete') {
        // 删除被举报内容
        await deleteContent(contentType, contentId)
      } else if (handleResult === 'warn') {
        // 警告用户（发送系统通知）
        if (reportedUserId) {
          await warnUser(reportedUserId, contentType)
        } else {
          console.log('警告失败：未找到被举报用户ID')
        }
      } else if (handleResult === 'ban') {
        // 封禁用户
        if (reportedUserId) {
          await banUser(reportedUserId, handleRemark)
        } else {
          console.log('封禁失败：未找到被举报用户ID')
        }
      }
      
      return {
        code: 0,
        message: '处理成功'
      }
    }
    
    // 驳回举报
    if (action === 'reject') {
      if (!reportId) {
        return { code: 400, message: '缺少举报ID' }
      }
      
      const { rejectRemark } = event
      
      await db.collection('botc-reports')
        .doc(reportId)
        .update({
          status: 'rejected',
          handle_remark: rejectRemark || '',
          handled_at: Date.now(),
          updated_at: Date.now()
        })
      
      return {
        code: 0,
        message: '已驳回举报'
      }
    }
    
    // 获取统计数据
    if (action === 'stats') {
      const [pendingRes, processingRes, resolvedRes, rejectedRes] = await Promise.all([
        db.collection('botc-reports').where({ status: 'pending' }).count(),
        db.collection('botc-reports').where({ status: 'processing' }).count(),
        db.collection('botc-reports').where({ status: 'resolved' }).count(),
        db.collection('botc-reports').where({ status: 'rejected' }).count()
      ])
      
      return {
        code: 0,
        data: {
          pending: pendingRes.total,
          processing: processingRes.total,
          resolved: resolvedRes.total,
          rejected: rejectedRes.total,
          total: pendingRes.total + processingRes.total + resolvedRes.total + rejectedRes.total
        }
      }
    }
    
    return {
      code: 400,
      message: '未知操作'
    }
    
  } catch (error) {
    console.error('举报管理失败：', error)
    return {
      code: 500,
      message: '操作失败：' + error.message
    }
  }
}

// 删除被举报内容
async function deleteContent(contentType, contentId) {
  const collectionMap = {
    'post': 'botc-posts',
    'comment': 'botc-post-comments',
    'script': 'botc-scripts',
    'review': 'botc-script-reviews'
  }
  
  const collection = collectionMap[contentType]
  if (collection) {
    try {
      // 先获取内容信息（用于通知）
      const contentRes = await db.collection(collection).doc(contentId).get()
      const content = contentRes.data && contentRes.data.length > 0 ? contentRes.data[0] : null
      
      // 删除内容
      await db.collection(collection).doc(contentId).remove()
      console.log(`已删除${contentType}: ${contentId}`)
      
      // 发送系统消息给内容作者
      if (content && content.user_id) {
        await sendSystemMessage({
          userId: content.user_id,
          type: 'warning',
          title: '内容违规通知',
          content: `您发布的${getContentTypeName(contentType)}因违反社区规范已被删除。请遵守社区规则，文明发言。`,
          relatedType: contentType,
          relatedId: contentId
        })
      }
      
      return true
    } catch (error) {
      console.error('删除内容失败：', error)
      return false
    }
  }
  return false
}

// 警告用户
async function warnUser(userId, contentType) {
  if (!userId) {
    console.log('用户ID为空，无法发送警告')
    return false
  }
  
  try {
    // 发送警告消息
    await sendSystemMessage({
      userId: userId,
      type: 'warning',
      title: '违规警告',
      content: `您发布的${getContentTypeName(contentType)}存在违规行为，已被管理员警告。请注意遵守社区规范，多次违规将被封禁账号。`,
      relatedType: contentType,
      relatedId: ''
    })
    
    // 记录警告次数（可选）
    await db.collection('uni-id-users')
      .doc(userId)
      .update({
        warning_count: dbCmd.inc(1),
        last_warning_at: Date.now()
      })
    
    console.log(`已警告用户 ${userId}`)
    return true
  } catch (error) {
    console.error('警告用户失败：', error)
    return false
  }
}

// 封禁用户
async function banUser(userId, reason) {
  if (!userId) {
    console.log('用户ID为空，无法封禁')
    return false
  }
  
  try {
    // 发送封禁通知
    await sendSystemMessage({
      userId: userId,
      type: 'warning',
      title: '账号封禁通知',
      content: `您的账号因违反社区规范已被封禁。封禁原因：${reason || '多次违规'}。如有疑问，请联系客服。`,
      relatedType: 'user',
      relatedId: userId
    })
    
    // 封禁用户
    await db.collection('uni-id-users')
      .doc(userId)
      .update({
        status: 1, // 1表示禁用
        ban_reason: reason,
        banned_at: Date.now()
      })
    
    console.log(`已封禁用户：${userId}`)
    return true
  } catch (error) {
    console.error('封禁用户失败：', error)
    return false
  }
}

// 发送系统消息
async function sendSystemMessage({ userId, type, title, content, relatedType, relatedId }) {
  try {
    await db.collection('botc-system-messages').add({
      user_id: userId,
      type: type || 'system',
      title: title,
      content: content,
      related_type: relatedType || '',
      related_id: relatedId || '',
      is_read: false
    })
    console.log(`已发送系统消息给用户 ${userId}`)
    return true
  } catch (error) {
    console.error('发送系统消息失败：', error)
    return false
  }
}

// 获取内容类型中文名称
function getContentTypeName(contentType) {
  const typeMap = {
    'post': '帖子',
    'comment': '评论',
    'script': '剧本',
    'review': '评价',
    'user': '用户资料'
  }
  return typeMap[contentType] || '内容'
}

// 从内容中获取用户ID
async function getUserIdFromContent(contentType, contentId) {
  const collectionMap = {
    'post': 'botc-posts',
    'comment': 'botc-post-comments',
    'script': 'botc-scripts',
    'review': 'botc-script-reviews'
  }
  
  const collection = collectionMap[contentType]
  if (!collection) {
    return null
  }
  
  try {
    const res = await db.collection(collection)
      .doc(contentId)
      .field({ user_id: true })
      .get()
    
    if (res.data && res.data.length > 0) {
      return res.data[0].user_id
    }
  } catch (error) {
    console.error('获取用户ID失败：', error)
  }
  
  return null
}

