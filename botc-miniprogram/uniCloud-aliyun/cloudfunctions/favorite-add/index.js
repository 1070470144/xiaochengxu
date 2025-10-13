'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { target_type, target_id, token } = event;
  
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
  if (!target_type || !target_id) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  // 验证类型
  const validTypes = ['script', 'post'];
  if (!validTypes.includes(target_type)) {
    return {
      code: 400,
      message: '无效的目标类型'
    };
  }
  
  try {
    // 查询是否已收藏
    const existingResult = await db.collection('botc-favorites')
      .where({
        user_id: userId,
        target_type: target_type,
        target_id: target_id
      })
      .get();
    
    if (existingResult.data && existingResult.data.length > 0) {
      return {
        code: 400,
        message: '已收藏过了'
      };
    }
    
    // 创建收藏记录
    await db.collection('botc-favorites')
      .add({
        user_id: userId,
        target_type: target_type,
        target_id: target_id,
        created_at: new Date()
      });
    
    return {
      code: 0,
      message: '收藏成功'
    };
    
  } catch (error) {
    console.error('收藏失败：', error);
    return {
      code: 500,
      message: '收藏失败：' + error.message
    };
  }
};

