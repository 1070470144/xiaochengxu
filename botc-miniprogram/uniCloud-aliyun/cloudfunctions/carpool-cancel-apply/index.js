'use strict';
const db = uniCloud.database();
const $ = db.command;

exports.main = async (event, context) => {
  const { application_id, carpool_id, token } = event;
  
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
  
  // 验证参数
  if (!application_id || !carpool_id) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  try {
    // 查询申请记录
    const applicationResult = await db.collection('botc-carpool-applications')
      .doc(application_id)
      .get();
    
    if (!applicationResult.data || applicationResult.data.length === 0) {
      return {
        code: 404,
        message: '申请记录不存在'
      };
    }
    
    const application = applicationResult.data[0];
    
    // 验证是否是本人的申请
    if (application.user_id !== userId) {
      return {
        code: 403,
        message: '无权操作此申请'
      };
    }
    
    // 检查申请状态
    if (application.status === 3) {
      return {
        code: 400,
        message: '该申请已被拒绝，无需取消'
      };
    }
    
    // 删除申请记录
    await db.collection('botc-carpool-applications')
      .doc(application_id)
      .remove();
    
    // 如果申请已通过，需要减少拼车房间的当前人数
    if (application.status === 2) {
      await db.collection('botc-carpool-rooms')
        .doc(carpool_id)
        .update({
          current_count: $.inc(-1)
        });
    }
    
    return {
      code: 0,
      message: '已取消报名'
    };
    
  } catch (error) {
    console.error('取消报名失败：', error);
    return {
      code: 500,
      message: '取消失败：' + error.message
    };
  }
};

