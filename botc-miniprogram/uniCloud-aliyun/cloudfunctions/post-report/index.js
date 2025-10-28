'use strict';

/**
 * 举报帖子云函数
 */
exports.main = async (event, context) => {
  const {
    target_id,      // 被举报对象ID（兼容旧参数）
    target_type,    // 举报类型（兼容旧参数）
    report_type,    // 举报原因类型（兼容旧参数）
    report_reason,  // 详细原因（兼容旧参数）
    content_id,     // 新参数：被举报内容ID
    content_type,   // 新参数：内容类型
    reason,         // 新参数：举报原因
    description,    // 新参数：详细描述
    images,         // 举报截图
    token
  } = event
  
  // 统一使用新字段名（兼容旧参数）
  const reportContentId = content_id || target_id
  const reportContentType = content_type || target_type
  const reportReason = reason || report_type
  const reportDescription = description || report_reason || ''
  const reportImages = images || []
  
  // 验证参数
  if (!reportContentId || !reportContentType || !reportReason) {
    return {
      code: 400,
      message: '参数不完整'
    }
  }
  
  // 验证token
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const reporter_id = token.split('_')[0]
  
  if (!reporter_id) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  const db = uniCloud.database()
  const dbCmd = db.command
  
  try {
    // 获取举报人信息
    const userRes = await db.collection('uni-id-users')
      .doc(reporter_id)
      .field({ nickname: true })
      .get()
    
    const reporter_nickname = userRes.data && userRes.data.length > 0 ? userRes.data[0].nickname : '匿名用户'
    
    // 检查是否已经举报过
    const existCheck = await db.collection('botc-reports')
      .where({
        content_id: reportContentId,
        reporter_id: reporter_id
      })
      .get()
    
    if (existCheck.data.length > 0) {
      return {
        code: 400,
        message: '您已经举报过该内容'
      }
    }
    
    // 创建举报记录（使用新的字段名）
    await db.collection('botc-reports').add({
      reporter_id: reporter_id,
      reporter_nickname: reporter_nickname,
      content_type: reportContentType,
      content_id: reportContentId,
      content_title: '', // 后续可以查询获取
      reported_user_id: '', // 后续可以查询获取
      reported_user_nickname: '', // 后续可以查询获取
      reason: reportReason,
      description: reportDescription,
      images: reportImages,
      status: 'pending', // 新状态：待处理
      created_at: Date.now()
    })
    
    // 统计该内容的举报次数
    const reportCount = await db.collection('botc-reports')
      .where({
        content_id: reportContentId,
        status: 'pending' // 只统计待处理的
      })
      .count()
    
    // 自动处理规则
    if (reportCount.total >= 3 && reportContentType === 'post') {
      // 3人举报自动隐藏帖子
      await db.collection('botc-posts').doc(reportContentId).update({
        status: 0, // 0=已隐藏
        updated_at: Date.now()
      })
      
      console.log(`帖子 ${reportContentId} 因被举报3次自动隐藏`)
    }
    
    if (reportCount.total >= 5 && reportContentType === 'post') {
      // 5人举报永久封禁
      await db.collection('botc-posts').doc(reportContentId).update({
        status: -1, // -1=已封禁
        updated_at: Date.now()
      })
      
      console.log(`帖子 ${reportContentId} 因被举报5次永久封禁`)
    }
    
    return {
      code: 0,
      message: '举报成功，我们会尽快处理',
      data: {
        report_count: reportCount.total
      }
    }
    
  } catch (error) {
    console.error('举报失败:', error)
    return {
      code: 500,
      message: '举报失败，请重试'
    }
  }
}

