'use strict';

/**
 * 云函数：更新拼车状态
 * 发起人可以关闭招募、确认成团、取消拼车等
 */
exports.main = async (event, context) => {
  console.log('[carpool-update-status] 更新拼车状态');
  
  const db = uniCloud.database();
  
  // 获取参数
  const { 
    carpoolId,    // 拼车ID
    newStatus     // 新状态：0-已取消，1-招募中，2-已满员，3-已确认，4-已结束
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
  
  if (!carpoolId || newStatus === undefined) {
    return {
      code: 400,
      message: '参数不完整',
      data: null
    };
  }
  
  // 验证状态值
  if (![0, 1, 2, 3, 4].includes(newStatus)) {
    return {
      code: 400,
      message: '无效的状态值',
      data: null
    };
  }
  
  try {
    // 查询拼车信息
    const carpoolRes = await db.collection('opendb-botc-carpools')
      .doc(carpoolId)
      .field({
        host_id: true,
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
        message: '只有发起人可以更新状态',
        data: null
      };
    }
    
    // 状态变更验证
    const oldStatus = carpool.status;
    
    // 已结束的拼车不能再修改
    if (oldStatus === 4) {
      return {
        code: 400,
        message: '拼车已结束，无法修改',
        data: null
      };
    }
    
    // 已取消的拼车不能恢复
    if (oldStatus === 0 && newStatus !== 0) {
      return {
        code: 400,
        message: '已取消的拼车无法恢复',
        data: null
      };
    }
    
    // 更新状态
    await db.collection('opendb-botc-carpools')
      .doc(carpoolId)
      .update({
        status: newStatus
      });
    
    const statusNames = {
      0: '已取消',
      1: '招募中',
      2: '已满员',
      3: '已确认',
      4: '已结束'
    };
    
    console.log(`[carpool-update-status] 拼车 ${carpool.title} 状态从 ${statusNames[oldStatus]} 更新为 ${statusNames[newStatus]}`);
    
    return {
      code: 0,
      message: '状态更新成功',
      data: {
        carpoolId,
        oldStatus,
        newStatus,
        statusName: statusNames[newStatus]
      }
    };
    
  } catch (error) {
    console.error('[carpool-update-status] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

