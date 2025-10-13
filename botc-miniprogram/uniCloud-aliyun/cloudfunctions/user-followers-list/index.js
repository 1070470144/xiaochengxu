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
    // 查询关注我的人
    const followsResult = await db.collection('botc-user-follows')
      .where({
        following_id: userId
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
    
    // 获取关注者的ID列表
    const followerIds = follows.map(f => f.follower_id);
    
    // 查询关注者的详细信息
    const usersResult = await db.collection('uni-id-users')
      .where({
        _id: $.in(followerIds)
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
    
    // 查询我是否也关注了这些用户（互关状态）
    const mutualFollowsResult = await db.collection('botc-user-follows')
      .where({
        follower_id: userId,
        following_id: $.in(followerIds)
      })
      .get();
    
    const mutualFollowsSet = new Set(mutualFollowsResult.data.map(f => f.following_id));
    
    // 组合数据
    const list = follows.map(follow => {
      const user = usersMap[follow.follower_id] || {};
      return {
        user_id: follow.follower_id,
        nickname: user.nickname || '未知用户',
        avatar: user.avatar || '',
        level: user.level || 1,
        followed_at: follow.created_at,
        is_mutual: mutualFollowsSet.has(follow.follower_id) // 是否互关
      };
    });
    
    // 获取总数
    const countResult = await db.collection('botc-user-follows')
      .where({
        following_id: userId
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
    console.error('获取粉丝列表失败：', error);
    return {
      code: 500,
      message: '获取失败：' + error.message
    };
  }
};

