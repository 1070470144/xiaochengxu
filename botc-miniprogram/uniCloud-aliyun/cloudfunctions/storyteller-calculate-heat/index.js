'use strict';

/**
 * 云函数：计算说书人热度分数
 * 
 * 热度计算公式：
 * heat_score = 粉丝数 * 10 + 剧本数 * 50 + 剧本总下载量 * 1 + 剧本总评分 * 20
 * 
 * 建议使用定时触发器每天计算一次
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
  const { user_id } = event  // 如果提供user_id，只计算该用户；否则计算所有认证说书人
  
  try {
    console.log('=== 开始计算说书人热度 ===')
    
    // 查询需要计算热度的用户
    let whereCondition = { storyteller_certified: true }
    if (user_id) {
      whereCondition._id = user_id
    }
    
    const usersRes = await db.collection('uni-id-users')
      .where(whereCondition)
      .field({
        _id: true,
        nickname: true,
        followers_count: true,
        storyteller_stats: true
      })
      .get()
    
    const users = usersRes.data || []
    console.log(`找到 ${users.length} 个认证说书人`)
    
    if (users.length === 0) {
      return {
        code: 0,
        message: '没有需要计算的说书人',
        data: { count: 0 }
      }
    }
    
    // 逐个计算热度
    const updatePromises = users.map(async (user) => {
      try {
        // 获取该说书人的剧本统计
        const scriptsRes = await db.collection('botc-scripts')
          .where({
            creator_id: user._id,
            status: 1  // 只统计已发布的剧本
          })
          .field({
            download_count: true,
            rating: true,
            rating_count: true
          })
          .get()
        
        const scripts = scriptsRes.data || []
        
        // 计算总下载量和总评分
        let totalDownloads = 0
        let totalRating = 0
        
        scripts.forEach(script => {
          totalDownloads += script.download_count || 0
          if (script.rating_count > 0) {
            totalRating += (script.rating || 0) * (script.rating_count || 0)
          }
        })
        
        // 计算热度分数
        const fansCount = user.followers_count || 0
        const scriptCount = scripts.length
        
        const heatScore = 
          fansCount * 10 +       // 每个粉丝 10 分
          scriptCount * 50 +     // 每个剧本 50 分
          totalDownloads * 1 +   // 每次下载 1 分
          totalRating * 20       // 每个评分 20 分
        
        console.log(`${user.nickname}: 粉丝${fansCount} 剧本${scriptCount} 下载${totalDownloads} 评分${totalRating.toFixed(1)} = 热度${heatScore}`)
        
        // 更新热度分数
        await db.collection('uni-id-users')
          .doc(user._id)
          .update({
            'storyteller_stats.heat_score': Math.round(heatScore)
          })
        
        return {
          user_id: user._id,
          nickname: user.nickname,
          heat_score: Math.round(heatScore)
        }
        
      } catch (error) {
        console.error(`计算 ${user.nickname} 的热度失败:`, error)
        return null
      }
    })
    
    const results = await Promise.all(updatePromises)
    const successCount = results.filter(r => r !== null).length
    
    console.log(`=== 计算完成：成功 ${successCount}/${users.length} ===`)
    
    return {
      code: 0,
      message: `成功计算 ${successCount} 个说书人的热度`,
      data: {
        count: successCount,
        results: results.filter(r => r !== null)
      }
    }
    
  } catch (error) {
    console.error('计算热度失败：', error)
    return {
      code: 500,
      message: '计算失败：' + error.message
    }
  }
}

