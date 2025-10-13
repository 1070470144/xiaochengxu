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
  
  try {
    // 删除收藏记录
    const result = await db.collection('botc-favorites')
      .where({
        user_id: userId,
        target_type: target_type,
        target_id: target_id
      })
      .remove();
    
    if (result.deleted > 0) {
      return {
        code: 0,
        message: '取消收藏成功'
      };
    } else {
      return {
        code: 400,
        message: '未找到收藏记录'
      };
    }
    
  } catch (error) {
    console.error('取消收藏失败：', error);
    return {
      code: 500,
      message: '取消收藏失败：' + error.message
    };
  }
};

