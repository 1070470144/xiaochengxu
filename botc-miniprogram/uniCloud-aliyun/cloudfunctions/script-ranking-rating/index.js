'use strict';

/**
 * 云函数：获取评分排行榜
 * 按平均评分倒序排列（需要至少5个评分）
 */
exports.main = async (event, context) => {
  console.log('[script-ranking-rating] 开始获取评分排行');
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 获取参数
  const { 
    page = 1, 
    pageSize = 20,
    minRatingCount = 5 // 最少评分数
  } = event;
  
  try {
    // 查询已发布的剧本，且评分数>=5
    const where = {
      status: 1, // 已发布
      rating_count: dbCmd.gte(minRatingCount) // 至少5个评分
    };
    
    // 获取总数
    const countRes = await db.collection('opendb-botc-scripts')
      .where(where)
      .count();
    
    const total = countRes.total;
    
    // 查询剧本列表，按评分倒序
    const res = await db.collection('opendb-botc-scripts')
      .where(where)
      .field({
        title: true,
        subtitle: true,
        author: true,
        cover_image: true,
        player_count: true,
        duration: true,
        difficulty: true,
        rating: true,
        rating_count: true,
        view_count: true,
        download_count: true,
        favorite_count: true,
        comment_count: true,
        script_type: true,
        created_at: true
      })
      .orderBy('rating', 'desc')
      .orderBy('rating_count', 'desc') // 评分相同时，评分人数多的靠前
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 添加排名
    const scripts = res.data.map((script, index) => ({
      ...script,
      rank: (page - 1) * pageSize + index + 1
    }));
    
    console.log(`[script-ranking-rating] 成功获取 ${scripts.length} 条数据`);
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: scripts,
        total,
        page,
        pageSize,
        hasNext: page * pageSize < total
      }
    };
    
  } catch (error) {
    console.error('[script-ranking-rating] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

