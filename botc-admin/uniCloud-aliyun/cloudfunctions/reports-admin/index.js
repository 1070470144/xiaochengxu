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
      const reportedUserId = report.reported_user_id
      
      if (handleResult === 'delete') {
        // 删除被举报内容
        await deleteContent(contentType, contentId)
      } else if (handleResult === 'warn') {
        // 警告用户（可以发送系统通知）
        await warnUser(reportedUserId, contentType)
      } else if (handleResult === 'ban') {
        // 封禁用户
        await banUser(reportedUserId, handleRemark)
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
      await db.collection(collection).doc(contentId).remove()
      console.log(`已删除${contentType}: ${contentId}`)
    } catch (error) {
      console.error('删除内容失败：', error)
    }
  }
}

// 警告用户
async function warnUser(userId, contentType) {
  // 可以发送系统通知或记录警告次数
  console.log(`警告用户 ${userId}，原因：${contentType}`)
  // TODO: 实现系统通知功能
}

// 封禁用户
async function banUser(userId, reason) {
  try {
    await db.collection('uni-id-users')
      .doc(userId)
      .update({
        status: 1, // 1表示禁用
        ban_reason: reason,
        banned_at: Date.now()
      })
    console.log(`已封禁用户：${userId}`)
  } catch (error) {
    console.error('封禁用户失败：', error)
  }
}

