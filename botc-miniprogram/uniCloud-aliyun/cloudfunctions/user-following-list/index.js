'use strict';
const db = uniCloud.database();
const $ = db.command;

exports.main = async (event, context) => {
  const { page = 1, page_size = 20, token } = event;
  
  // 验证token
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    };
  }
  
  const userId = token.split('_')[0];
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    };
  }
  
  try {
    // 查询我关注的人
    const followsResult = await db.collection('botc-user-follows')
      .where({
        follower_id: userId
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get();
    
    const follows = followsResult.data || [];
    
    if (follows.length === 0) {
      return {
        code: 0,
        message: 'success',
        data: {
          list: [],
          total: 0
        }
      };
    }
    
    // 获取被关注者的ID列表
    const followingIds = follows.map(f => f.following_id);
    
    // 查询被关注者的详细信息
    const usersResult = await db.collection('uni-id-users')
      .where({
        _id: $.in(followingIds)
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true,
        level: true
      })
      .get();
    
    const usersMap = {};
    usersResult.data.forEach(user => {
      usersMap[user._id] = user;
    });
    
    // 组合数据
    const list = follows.map(follow => {
      const user = usersMap[follow.following_id] || {};
      return {
        user_id: follow.following_id,
        nickname: user.nickname || '未知用户',
        avatar: user.avatar || '',
        level: user.level || 1,
        followed_at: follow.created_at
      };
    });
    
    // 获取总数
    const countResult = await db.collection('botc-user-follows')
      .where({
        follower_id: userId
      })
      .count();
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: list,
        total: countResult.total
      }
    };
    
  } catch (error) {
    console.error('获取关注列表失败：', error);
    return {
      code: 500,
      message: '获取失败：' + error.message
    };
  }
};

