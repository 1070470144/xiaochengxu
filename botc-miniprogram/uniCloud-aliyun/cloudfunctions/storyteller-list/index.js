'use strict';

/**
 * 说书人列表云函数
 * 获取说书人列表，支持筛选和搜索
 */
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const dbCmd = db.command;
  const { page = 1, pageSize = 10, filter = 'all', keyword = '' } = event;
  
  try {
    // 构建查询条件
    let whereCondition = {
      status: dbCmd.eq(1), // 状态正常
      deleted_at: dbCmd.exists(false)
    };
    
    // 关键词搜索
    if (keyword) {
      whereCondition['user.nickname'] = new RegExp(keyword, 'i');
    }
    
    // 筛选条件
    switch (filter) {
      case 'certified':
        // 认证说书人
        whereCondition.is_certified = dbCmd.eq(true);
        break;
      case 'high_rating':
        // 高评分（4.5分以上）
        whereCondition.rating = dbCmd.gte(4.5);
        break;
      case 'nearby':
        // 附近（需要用户位置，这里暂时按地区）
        // 实际应用中可以基于地理位置查询
        break;
    }
    
    // 查询说书人列表
    const result = await db.collection('botc-storyteller-profiles')
      .where(whereCondition)
      .field({
        _id: true,
        user_id: true,
        introduction: true,
        is_certified: true,
        rating: true,
        review_count: true,
        game_count: true,
        specialties: true,
        location: true,
        tags: true,
        created_at: true
      })
      .orderBy('is_certified', 'desc')
      .orderBy('rating', 'desc')
      .orderBy('game_count', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 获取用户信息
    const userIds = result.data.map(item => item.user_id);
    const usersResult = await db.collection('uni-id-users')
      .where({
        _id: dbCmd.in(userIds)
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true
      })
      .get();
    
    // 组装数据
    const userMap = {};
    usersResult.data.forEach(user => {
      userMap[user._id] = user;
    });
    
    const list = result.data.map(storyteller => ({
      ...storyteller,
      user: userMap[storyteller.user_id] || {}
    }));
    
    return {
      code: 0,
      message: '获取说书人列表成功',
      data: {
        list,
        total: result.data.length,
        page,
        pageSize
      }
    };
    
  } catch (error) {
    console.error('获取说书人列表失败:', error);
    return {
      code: -1,
      message: '获取说书人列表失败：' + error.message,
      data: {
        list: [],
        total: 0,
        page,
        pageSize
      }
    };
  }
};

