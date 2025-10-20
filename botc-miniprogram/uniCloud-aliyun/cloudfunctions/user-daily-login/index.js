'use strict';

/**
 * 云函数：每日登录签到
 * 每日首次登录获得经验值
 */
exports.main = async (event, context) => {
  console.log('[user-daily-login] 每日登录签到');
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 获取当前用户ID
  const { uid } = context;
  if (!uid) {
    return {
      code: 401,
      message: '未登录',
      data: null
    };
  }
  
  try {
    // 查询用户信息
    const userRes = await db.collection('uni-id-users')
      .doc(uid)
      .field({
        last_login_at: true,
        login_count: true,
        nickname: true
      })
      .get();
    
    if (!userRes.data || userRes.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      };
    }
    
    const user = userRes.data[0];
    const now = new Date();
    const lastLoginAt = user.last_login_at ? new Date(user.last_login_at) : null;
    
    // 判断是否是今天首次登录
    let isFirstLoginToday = true;
    
    if (lastLoginAt) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastLoginDate = new Date(lastLoginAt.getFullYear(), lastLoginAt.getMonth(), lastLoginAt.getDate());
      
      isFirstLoginToday = today.getTime() > lastLoginDate.getTime();
    }
    
    // 更新登录时间和次数
    await db.collection('uni-id-users')
      .doc(uid)
      .update({
        last_login_at: now,
        login_count: dbCmd.inc(1)
      });
    
    console.log(`[user-daily-login] 用户 ${user.nickname} 登录，今日首次: ${isFirstLoginToday}`);
    
    // 如果是今日首次登录，增加经验值
    let expData = null;
    if (isFirstLoginToday) {
      const addExpRes = await uniCloud.callFunction({
        name: 'user-add-exp',
        data: {
          expType: 'LOGIN'
        }
      });
      
      if (addExpRes.result && addExpRes.result.code === 0) {
        expData = addExpRes.result.data;
      }
    }
    
    return {
      code: 0,
      message: 'success',
      data: {
        isFirstLoginToday,
        expGained: expData ? expData.expAdded : 0,
        expData: expData,
        loginCount: (user.login_count || 0) + 1
      }
    };
    
  } catch (error) {
    console.error('[user-daily-login] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

