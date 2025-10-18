'use strict';

/**
 * 云函数：说书人榜单
 */
exports.main = async (event, context) => {
  const { type = 'fans_count', limit = 50 } = event;
  
  const db = uniCloud.database();
  
  try {
    let orderField = 'storyteller_stats.fans_count';
    
    if (type === 'heat_score') {
      orderField = 'storyteller_stats.heat_score';
    }
    
    const res = await db.collection('uni-id-users')
      .where({
        [`storyteller_stats.${type}`]: db.command.gt(0)
      })
      .field({
        _id: true,
        nickname: true,
        avatar_file: true,
        storyteller_stats: true
      })
      .orderBy(orderField, 'desc')
      .limit(limit)
      .get();
    
    const list = res.data || [];
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list: list,
        total: list.length
      }
    };
  } catch (error) {
    console.error('[wiki-ranking-storytellers] 错误:', error);
    return {
      code: 500,
      message: '获取失败: ' + error.message
    };
  }
};

