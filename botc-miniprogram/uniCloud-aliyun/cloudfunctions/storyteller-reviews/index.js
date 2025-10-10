'use strict';

/**
 * 说书人评价列表云函数
 * 获取说书人的评价列表
 */
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { storytellerId, page = 1, pageSize = 10 } = event;
  
  if (!storytellerId) {
    return {
      code: -1,
      message: '缺少说书人ID',
      data: { list: [], total: 0 }
    };
  }
  
  try {
    // 获取评价列表
    const reviewsRes = await db.collection('botc-storyteller-reviews')
      .where({
        storyteller_id: storytellerId,
        deleted_at: db.command.exists(false)
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 获取评价用户信息
    const userIds = reviewsRes.data.map(item => item.user_id);
    const usersRes = await db.collection('uni-id-users')
      .where({
        _id: db.command.in(userIds)
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true
      })
      .get();
    
    // 组装数据
    const userMap = {};
    usersRes.data.forEach(user => {
      userMap[user._id] = user;
    });
    
    const list = reviewsRes.data.map(review => ({
      ...review,
      user: userMap[review.user_id] || {}
    }));
    
    return {
      code: 0,
      message: '获取评价列表成功',
      data: {
        list,
        total: reviewsRes.data.length,
        page,
        pageSize
      }
    };
    
  } catch (error) {
    console.error('获取评价列表失败:', error);
    return {
      code: -1,
      message: '获取评价列表失败：' + error.message,
      data: { list: [], total: 0 }
    };
  }
};

