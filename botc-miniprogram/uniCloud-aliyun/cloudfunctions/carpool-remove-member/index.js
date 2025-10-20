'use strict';

/**
 * 云函数：拼车发起人移除成员
 */
exports.main = async (event, context) => {
  console.log('[carpool-remove-member] 移除拼车成员');
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 获取参数
  const { 
    carpoolId,    // 拼车ID
    memberId      // 成员ID（报名记录ID）
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
  
  if (!carpoolId || !memberId) {
    return {
      code: 400,
      message: '参数不完整',
      data: null
    };
  }
  
  try {
    // 查询拼车信息
    const carpoolRes = await db.collection('opendb-botc-carpools')
      .doc(carpoolId)
      .field({
        host_id: true,
        current_players: true,
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
        message: '只有发起人可以移除成员',
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
    
    // 更新报名状态为已移除
    await db.collection('opendb-botc-carpool-members')
      .doc(memberId)
      .update({
        status: 0  // 已退出
      });
    
    // 更新拼车当前人数
    if (carpool.current_players > 1) {
      await db.collection('opendb-botc-carpools')
        .doc(carpoolId)
        .update({
          current_players: dbCmd.inc(-1),
          status: 1  // 移除后状态回到招募中
        });
    }
    
    console.log(`[carpool-remove-member] 移除成员 ${member.user_id} 从拼车 ${carpool.title}`);
    
    return {
      code: 0,
      message: '移除成功',
      data: {
        carpoolId,
        memberId
      }
    };
    
  } catch (error) {
    console.error('[carpool-remove-member] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

