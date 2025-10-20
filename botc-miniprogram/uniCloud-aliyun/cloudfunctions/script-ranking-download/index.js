'use strict';

/**
 * 云函数：获取下载量排行榜
 * 按下载次数倒序排列
 */
exports.main = async (event, context) => {
  console.log('[script-ranking-download] 开始获取下载排行');
  
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
      download_count: dbCmd.gt(0), // 至少有1次下载
      ...timeFilter
    };
    
    // 获取总数
    const countRes = await db.collection('opendb-botc-scripts')
      .where(where)
      .count();
    
    const total = countRes.total;
    
    // 查询剧本列表，按下载量倒序
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
      .orderBy('download_count', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 添加排名
    const scripts = res.data.map((script, index) => ({
      ...script,
      rank: (page - 1) * pageSize + index + 1
    }));
    
    console.log(`[script-ranking-download] 成功获取 ${scripts.length} 条数据`);
    
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
    console.error('[script-ranking-download] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

