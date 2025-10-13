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
  const validTypes = ['script', 'post', 'carpool'];
  if (!validTypes.includes(target_type)) {
    return {
      code: 400,
      message: '无效的目标类型'
    };
  }
  
  try {
    // 查询是否已存在记录
    const existingResult = await db.collection('botc-browse-history')
      .where({
        user_id: userId,
        target_type: target_type,
        target_id: target_id
      })
      .get();
    
    const now = new Date();
    
    if (existingResult.data && existingResult.data.length > 0) {
      // 已存在，更新时间
      await db.collection('botc-browse-history')
        .doc(existingResult.data[0]._id)
        .update({
          updated_at: now
        });
    } else {
      // 不存在，创建新记录
      await db.collection('botc-browse-history')
        .add({
          user_id: userId,
          target_type: target_type,
          target_id: target_id,
          created_at: now,
          updated_at: now
        });
    }
    
    return {
      code: 0,
      message: '记录成功'
    };
    
  } catch (error) {
    console.error('记录浏览历史失败：', error);
    return {
      code: 500,
      message: '记录失败：' + error.message
    };
  }
};

