'use strict';

/**
 * 云函数：获取热门剧本排行榜
 * 算法：热度分数 = 浏览量×0.3 + 下载量×0.4 + 评分×20 + 收藏×0.3
 */
exports.main = async (event, context) => {
  console.log('[script-ranking-hot] 开始获取热门排行');
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 获取参数
  const { 
    page = 1, 
    pageSize = 20,
    period = 'all' // all-总榜, weekly-周榜, monthly-月榜
  } = event;
  
  try {
    // 计算时间范围
    let timeFilter = {};
    const now = new Date();
    
    if (period === 'weekly') {
      // 最近7天
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      timeFilter = {
        created_at: dbCmd.gte(weekAgo)
      };
    } else if (period === 'monthly') {
      // 最近30天
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      timeFilter = {
        created_at: dbCmd.gte(monthAgo)
      };
    }
    
    // 查询已发布的剧本
    const where = {
      status: 1, // 已发布
      ...timeFilter
    };
    
    // 获取总数
    const countRes = await db.collection('opendb-botc-scripts')
      .where(where)
      .count();
    
    const total = countRes.total;
    
    // 查询剧本列表
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
        heat_score: true // 如果已经计算好的热度分数
      })
      .orderBy('heat_score', 'desc') // 先按已计算的热度排序
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 计算热度分数（如果没有预计算）
    const scripts = res.data.map((script, index) => {
      const viewCount = script.view_count || 0;
      const downloadCount = script.download_count || 0;
      const rating = script.rating || 0;
      const favoriteCount = script.favorite_count || 0;
      
      // 热度算法
      const heatScore = (
        viewCount * 0.3 + 
        downloadCount * 0.4 + 
        rating * 20 + 
        favoriteCount * 0.3
      );
      
      return {
        ...script,
        calculated_heat: Math.round(heatScore * 100) / 100,
        rank: (page - 1) * pageSize + index + 1
      };
    });
    
    // 按计算的热度重新排序
    scripts.sort((a, b) => b.calculated_heat - a.calculated_heat);
    
    // 更新排名
    scripts.forEach((script, index) => {
      script.rank = (page - 1) * pageSize + index + 1;
    });
    
    console.log(`[script-ranking-hot] 成功获取 ${scripts.length} 条数据`);
    
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
    console.error('[script-ranking-hot] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

