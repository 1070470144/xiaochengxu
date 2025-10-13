'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { page = 1, page_size = 10, token } = event;
  
  // 验证token
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    };
  }
  
  // 简化的token验证
  const userId = token.split('_')[0];
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    };
  }
  
  try {
    // 查询用户报名的拼车申请
    const applicationsResult = await db.collection('botc-carpool-applications')
      .where({
        user_id: userId
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get();
    
    const applications = applicationsResult.data || [];
    
    if (applications.length === 0) {
      return {
        code: 0,
        message: 'success',
        data: {
          list: [],
          total: 0
        }
      };
    }
    
    // 提取所有拼车房间ID
    const carpoolIds = applications.map(app => app.carpool_id);
    
    // 查询拼车房间信息
    const carpoolsResult = await db.collection('botc-carpool-rooms')
      .where({
        _id: db.command.in(carpoolIds)
      })
      .get();
    
    const carpoolsMap = {};
    (carpoolsResult.data || []).forEach(room => {
      carpoolsMap[room._id] = room;
    });
    
    // 提取所有发起者ID
    const hostIds = [...new Set(
      (carpoolsResult.data || []).map(room => room.host_id)
    )];
    
    // 查询发起者信息
    const hostsResult = await db.collection('uni-id-users')
      .where({
        _id: db.command.in(hostIds)
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true
      })
      .get();
    
    const hostsMap = {};
    (hostsResult.data || []).forEach(user => {
      hostsMap[user._id] = user;
    });
    
    // 组合数据
    const list = applications.map(app => {
      const carpool = carpoolsMap[app.carpool_id] || {};
      const host = hostsMap[carpool.host_id] || {};
      
      return {
        application_id: app._id,
        carpool_id: app.carpool_id,
        status: app.status, // 1-待审核 2-已通过 3-已拒绝
        created_at: app.created_at,
        carpool: {
          title: carpool.title,
          game_time: carpool.game_time,
          location: carpool.location,
          current_count: carpool.current_count,
          max_count: carpool.max_count,
          status: carpool.status,
          host_id: carpool.host_id
        },
        host: {
          _id: carpool.host_id,
          nickname: host.nickname || '未知用户',
          avatar: host.avatar || ''
        }
      };
    });
    
    // 获取总数
    const countResult = await db.collection('botc-carpool-applications')
      .where({
        user_id: userId
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
    console.error('查询报名记录失败：', error);
    return {
      code: 500,
      message: '查询失败：' + error.message
    };
  }
};

