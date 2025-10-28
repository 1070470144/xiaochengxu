'use strict';

/**
 * 删除剧本
 * 只能删除自己上传的剧本
 */

exports.main = async (event, context) => {
  const { scriptId, token } = event
  
  if (!scriptId) {
    return {
      code: 400,
      message: '缺少剧本ID'
    }
  }
  
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
    
    // 先查询剧本，验证权限
    const scriptRes = await scriptsCollection
      .doc(scriptId)
      .get()
    
    if (!scriptRes.data || scriptRes.data.length === 0) {
      return {
        code: 404,
        message: '剧本不存在'
      }
    }
    
    const script = scriptRes.data[0]
    
    // 验证是否是本人上传的
    if (script.creator_id !== userId) {
      return {
        code: 403,
        message: '无权删除他人上传的剧本'
      }
    }
    
    // 如果已发布，不允许直接删除
    if (script.status === 1) {
      return {
        code: 403,
        message: '已发布的剧本无法删除，请联系管理员'
      }
    }
    
    // 执行删除（软删除，设置deleted_at字段）
    await scriptsCollection.doc(scriptId).update({
      deleted_at: Date.now(),
      status: -1 // -1表示已删除
    })
    
    // 更新说书人的剧本数统计
    const usersCollection = db.collection('uni-id-users')
    const userDoc = await usersCollection.doc(userId).get()
    const user = userDoc.data && userDoc.data.length > 0 ? userDoc.data[0] : {}
    
    // 如果是认证说书人，更新 storyteller_stats.script_count
    if (user.storyteller_certified && user.storyteller_stats) {
      const currentScriptCount = user.storyteller_stats.script_count || 0
      await usersCollection.doc(userId).update({
        'storyteller_stats.script_count': Math.max(0, currentScriptCount - 1)
      })
      console.log('[SCRIPT-DELETE] Updated storyteller script count:', Math.max(0, currentScriptCount - 1))
    }
    
    return {
      code: 0,
      message: '删除成功'
    }
  } catch (error) {
    console.error('[SCRIPT-DELETE] Error:', error)
    return {
      code: 500,
      message: '删除失败：' + error.message
    }
  }
}

