'use strict';

/**
 * 说书人详情云函数
 * 获取说书人的详细信息
 */
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { storytellerId } = event;
  
  if (!storytellerId) {
    return {
      code: -1,
      message: '缺少说书人ID',
      data: null
    };
  }
  
  try {
    // 获取说书人信息
    const storytellerRes = await db.collection('botc-storyteller-profiles')
      .where({
        _id: storytellerId,
        status: 1,
        deleted_at: db.command.exists(false)
      })
      .get();
    
    if (storytellerRes.data.length === 0) {
      return {
        code: -1,
        message: '说书人不存在',
        data: null
      };
    }
    
    const storyteller = storytellerRes.data[0];
    
    // 获取用户信息
    const userRes = await db.collection('uni-id-users')
      .where({
        _id: storyteller.user_id
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true
      })
      .get();
    
    const user = userRes.data[0] || {};
    
    // 组装数据
    const detail = {
      ...storyteller,
      user
    };
    
    return {
      code: 0,
      message: '获取说书人详情成功',
      data: detail
    };
    
  } catch (error) {
    console.error('获取说书人详情失败:', error);
    return {
      code: -1,
      message: '获取说书人详情失败：' + error.message,
      data: null
    };
  }
};

