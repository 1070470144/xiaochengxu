'use strict';

/**
 * 云函数：获取最新剧本排行榜
 * 按创建时间倒序排列
 */
exports.main = async (event, context) => {
  console.log('[script-ranking-new] 开始获取最新排行');
  
  const db = uniCloud.database();
  
  // 获取参数
  const { 
    page = 1, 
    pageSize = 20 
  } = event;
  
  try {
    // 查询已发布的剧本
    const where = {
      status: 1 // 已发布
    };
    
    // 获取总数
    const countRes = await db.collection('opendb-botc-scripts')
      .where(where)
      .count();
    
    const total = countRes.total;
    
    // 查询剧本列表，按创建时间倒序
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
        created_at: true,
        published_at: true
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 添加排名
    const scripts = res.data.map((script, index) => ({
      ...script,
      rank: (page - 1) * pageSize + index + 1
    }));
    
    console.log(`[script-ranking-new] 成功获取 ${scripts.length} 条数据`);
    
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
    console.error('[script-ranking-new] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

