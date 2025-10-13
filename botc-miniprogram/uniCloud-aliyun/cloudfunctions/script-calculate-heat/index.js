'use strict';

/**
 * 计算剧本热度云函数
 * 热度计算规则：
 * - 帖子数 × 10
 * - 评价数 × 5
 * - 帖子点赞数 × 2
 * - 帖子评论数 × 3
 * - 浏览数 × 0.1
 * - 下载数 × 1
 */
exports.main = async (event, context) => {
  console.log('计算剧本热度，参数：', event)
  
  const {
    script_id  // 可选，如果提供则只计算指定剧本，否则计算所有剧本
  } = event
  
  const db = uniCloud.database()
  
  try {
    // 如果指定了剧本ID，只计算该剧本
    if (script_id) {
      return await calculateSingleScript(script_id, db)
    }
    
    // 否则计算所有剧本
    return await calculateAllScripts(db)
    
  } catch (error) {
    console.error('计算热度失败：', error)
    return {
      code: 500,
      message: '计算失败，请重试',
      error: error.message
    }
  }
}

/**
 * 计算单个剧本热度
 */
async function calculateSingleScript(scriptId, db) {
  const heat = await getScriptHeat(scriptId, db)
  
  // 更新剧本热度值
  await db.collection('botc-scripts').doc(scriptId).update({
    heat_score: heat,
    heat_updated_at: new Date()
  })
  
  return {
    code: 0,
    message: '计算成功',
    data: {
      script_id: scriptId,
      heat_score: heat
    }
  }
}

/**
 * 计算所有剧本热度
 */
async function calculateAllScripts(db) {
  // 获取所有剧本
  const scriptsResult = await db.collection('botc-scripts')
    .field('_id')
    .get()
  
  const scripts = scriptsResult.data || []
  
  let updated = 0
  let failed = 0
  
  // 批量更新
  for (const script of scripts) {
    try {
      const heat = await getScriptHeat(script._id, db)
      
      await db.collection('botc-scripts').doc(script._id).update({
        heat_score: heat,
        heat_updated_at: new Date()
      })
      
      updated++
    } catch (error) {
      console.error(`计算剧本 ${script._id} 热度失败：`, error)
      failed++
    }
  }
  
  return {
    code: 0,
    message: '批量计算完成',
    data: {
      total: scripts.length,
      updated: updated,
      failed: failed
    }
  }
}

/**
 * 获取剧本热度分数
 */
async function getScriptHeat(scriptId, db) {
  // 1. 获取帖子统计
  const postsResult = await db.collection('botc-posts')
    .where({
      script_id: scriptId,
      status: 1
    })
    .get()
  
  const posts = postsResult.data || []
  const postCount = posts.length
  const postLikeCount = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
  const postCommentCount = posts.reduce((sum, post) => sum + (post.comment_count || 0), 0)
  
  // 2. 获取评价数
  const reviewsResult = await db.collection('botc-script-reviews')
    .where({
      script_id: scriptId,
      status: 1
    })
    .count()
  
  const reviewCount = reviewsResult.total || 0
  
  // 3. 获取剧本自身数据
  const scriptResult = await db.collection('botc-scripts')
    .doc(scriptId)
    .field('view_count,download_count')
    .get()
  
  const script = scriptResult.data && scriptResult.data.length > 0 ? scriptResult.data[0] : {}
  const viewCount = script.view_count || 0
  const downloadCount = script.download_count || 0
  
  // 4. 计算热度分数
  const heatScore = 
    (postCount * 10) +          // 帖子数权重最高
    (reviewCount * 5) +          // 评价数次之
    (postLikeCount * 2) +        // 帖子点赞
    (postCommentCount * 3) +     // 帖子评论
    (viewCount * 0.1) +          // 浏览数权重最低
    (downloadCount * 1)          // 下载数
  
  // 5. 添加时间衰减（可选）
  // 新发布的剧本获得额外加成
  if (script.created_at) {
    const daysSinceCreated = (Date.now() - new Date(script.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated < 30) {
      // 30天内的新剧本，获得递减加成
      const newBonus = Math.max(0, 100 * (1 - daysSinceCreated / 30))
      return Math.round(heatScore + newBonus)
    }
  }
  
  return Math.round(heatScore)
}

