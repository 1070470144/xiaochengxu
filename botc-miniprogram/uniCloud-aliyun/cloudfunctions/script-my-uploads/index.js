'use strict';

/**
 * 查询我的上传
 * 获取当前用户上传的剧本列表
 */

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10, token } = event
  
  // 验证token并获取用户ID（参考项目现有方式）
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const userId = token.split('_')[0]
  
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  try {
    const db = uniCloud.database()
    const scriptsCollection = db.collection('botc-scripts')
    
    // 查询该用户上传的剧本
    const countRes = await scriptsCollection
      .where({
        creator_id: userId
      })
      .count()
    
    const total = countRes.total
    
    // 分页查询
    const listRes = await scriptsCollection
      .where({
        creator_id: userId
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    const hasMore = page * pageSize < total
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: listRes.data,
        total,
        page,
        pageSize,
        hasMore
      }
    }
  } catch (error) {
    console.error('[SCRIPT-MY-UPLOADS] Error:', error)
    return {
      code: 500,
      message: '查询失败：' + error.message
    }
  }
}

