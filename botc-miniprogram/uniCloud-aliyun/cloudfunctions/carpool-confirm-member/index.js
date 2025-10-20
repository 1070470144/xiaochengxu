'use strict';

/**
 * 云函数：拼车发起人确认报名成员
 * 发起人可以确认或拒绝报名者
 */
exports.main = async (event, context) => {
  console.log('[carpool-confirm-member] 确认拼车成员');
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 获取参数
  const { 
    carpoolId,    // 拼车ID
    memberId,     // 成员ID（报名记录ID）
    action        // 操作：'confirm' 确认 或 'reject' 拒绝
  } = event;
  
  // 获取当前用户ID
  const { uid } = context;
  if (!uid) {
    return {
      code: 401,
      message: '未登录',
      data: null
    };
  }
  
  if (!carpoolId || !memberId || !action) {
    return {
      code: 400,
      message: '参数不完整',
      data: null
    };
  }
  
  if (action !== 'confirm' && action !== 'reject') {
    return {
      code: 400,
      message: '无效的操作',
      data: null
    };
  }
  
  try {
    // 查询拼车信息
    const carpoolRes = await db.collection('opendb-botc-carpools')
      .doc(carpoolId)
      .field({
        host_id: true,
        max_players: true,
        current_players: true,
        status: true,
        title: true
      })
      .get();
    
    if (!carpoolRes.data || carpoolRes.data.length === 0) {
      return {
        code: 404,
        message: '拼车不存在',
        data: null
      };
    }
    
    const carpool = carpoolRes.data[0];
    
    // 验证是否是发起人
    if (carpool.host_id !== uid) {
      return {
        code: 403,
        message: '只有发起人可以确认成员',
        data: null
      };
    }
    
    // 验证拼车状态
    if (carpool.status !== 1) {
      return {
        code: 400,
        message: '拼车不在招募中',
        data: null
      };
    }
    
    // 查询报名记录
    const memberRes = await db.collection('opendb-botc-carpool-members')
      .doc(memberId)
      .get();
    
    if (!memberRes.data || memberRes.data.length === 0) {
      return {
        code: 404,
        message: '报名记录不存在',
        data: null
      };
    }
    
    const member = memberRes.data[0];
    
    // 验证报名记录是否属于此拼车
    if (member.carpool_id !== carpoolId) {
      return {
        code: 400,
        message: '报名记录不匹配',
        data: null
      };
    }
    
    // 更新报名状态
    if (action === 'confirm') {
      // 确认成员
      await db.collection('opendb-botc-carpool-members')
        .doc(memberId)
        .update({
          status: 2,  // 已确认
          confirmed_at: new Date()
        });
      
      console.log(`[carpool-confirm-member] 确认成员 ${member.user_id} 加入拼车 ${carpool.title}`);
      
      // 检查是否已满员
      const confirmedCount = await db.collection('opendb-botc-carpool-members')
        .where({
          carpool_id: carpoolId,
          status: 2  // 已确认
        })
        .count();
      
      const totalConfirmed = confirmedCount.total + 1; // 包括发起人
      
      // 如果已满员，更新拼车状态
      if (carpool.max_players && totalConfirmed >= carpool.max_players) {
        await db.collection('opendb-botc-carpools')
          .doc(carpoolId)
          .update({
            status: 2,  // 已满员
            current_players: totalConfirmed
          });
        
        console.log(`[carpool-confirm-member] 拼车 ${carpool.title} 已满员`);
      } else {
        // 更新当前人数
        await db.collection('opendb-botc-carpools')
          .doc(carpoolId)
          .update({
            current_players: totalConfirmed
          });
      }
      
      return {
        code: 0,
        message: '确认成功',
        data: {
          action: 'confirm',
          isFull: totalConfirmed >= carpool.max_players,
          currentPlayers: totalConfirmed
        }
      };
      
    } else {
      // 拒绝成员
      await db.collection('opendb-botc-carpool-members')
        .doc(memberId)
        .update({
          status: 3  // 已拒绝
        });
      
      console.log(`[carpool-confirm-member] 拒绝成员 ${member.user_id} 的报名`);
      
      return {
        code: 0,
        message: '已拒绝',
        data: {
          action: 'reject'
        }
      };
    }
    
  } catch (error) {
    console.error('[carpool-confirm-member] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

