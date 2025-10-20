'use strict';

/**
 * 云函数：获取用户等级信息
 * 返回当前等级、经验值、升级进度等信息
 */

// 等级配置
const LEVEL_CONFIG = [
  { level: 1, name: '初来乍到', exp: 0, icon: '🌱' },
  { level: 2, name: '略知一二', exp: 100, icon: '🌿' },
  { level: 3, name: '初窥门径', exp: 300, icon: '🍀' },
  { level: 4, name: '渐入佳境', exp: 600, icon: '🌳' },
  { level: 5, name: '驾轻就熟', exp: 1000, icon: '🌲' },
  { level: 6, name: '炉火纯青', exp: 1500, icon: '⭐' },
  { level: 7, name: '登峰造极', exp: 2200, icon: '🌟' },
  { level: 8, name: '出神入化', exp: 3000, icon: '💫' },
  { level: 9, name: '无与伦比', exp: 4000, icon: '✨' },
  { level: 10, name: '传奇玩家', exp: 5500, icon: '👑' }
];

exports.main = async (event, context) => {
  console.log('[user-level-info] 获取用户等级信息');
  
  const db = uniCloud.database();
  
  // 获取参数
  const { userId } = event;
  
  // 如果没有传userId，使用当前登录用户
  const { uid } = context;
  const targetUserId = userId || uid;
  
  if (!targetUserId) {
    return {
      code: 401,
      message: '未登录',
      data: null
    };
  }
  
  try {
    // 查询用户信息
    const userRes = await db.collection('uni-id-users')
      .doc(targetUserId)
      .field({
        nickname: true,
        avatar_file: true,
        exp: true,
        level: true
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
    const currentExp = user.exp || 0;
    const currentLevel = user.level || 1;
    
    // 获取当前等级配置
    const currentLevelConfig = LEVEL_CONFIG.find(l => l.level === currentLevel) || LEVEL_CONFIG[0];
    
    // 获取下一等级配置
    const nextLevelConfig = LEVEL_CONFIG.find(l => l.level === currentLevel + 1);
    
    // 计算升级进度
    let progress = 100;
    let expToNext = 0;
    
    if (nextLevelConfig) {
      const currentLevelExp = currentLevelConfig.exp;
      const nextLevelExp = nextLevelConfig.exp;
      const expInCurrentLevel = currentExp - currentLevelExp;
      const expNeeded = nextLevelExp - currentLevelExp;
      
      progress = Math.min(100, Math.round((expInCurrentLevel / expNeeded) * 100));
      expToNext = nextLevelExp - currentExp;
    }
    
    // 计算等级特权
    const privileges = getLevelPrivileges(currentLevel);
    
    console.log(`[user-level-info] 用户 ${user.nickname} 等级 ${currentLevel} 经验 ${currentExp}`);
    
    return {
      code: 0,
      message: 'success',
      data: {
        userId: targetUserId,
        nickname: user.nickname,
        avatar: user.avatar_file?.url || '',
        
        // 当前等级信息
        currentLevel,
        currentLevelName: currentLevelConfig.name,
        currentLevelIcon: currentLevelConfig.icon,
        currentExp,
        
        // 下一等级信息
        nextLevel: nextLevelConfig ? nextLevelConfig.level : null,
        nextLevelName: nextLevelConfig ? nextLevelConfig.name : '已满级',
        nextLevelExp: nextLevelConfig ? nextLevelConfig.exp : null,
        
        // 升级进度
        progress,
        expToNext,
        isMaxLevel: currentLevel >= 10,
        
        // 等级特权
        privileges,
        
        // 全部等级配置
        allLevels: LEVEL_CONFIG
      }
    };
    
  } catch (error) {
    console.error('[user-level-info] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

// 获取等级特权
function getLevelPrivileges(level) {
  const privileges = [];
  
  // 根据等级解锁特权
  if (level >= 1) {
    privileges.push('可以上传剧本');
    privileges.push('可以评论和评分');
  }
  
  if (level >= 3) {
    privileges.push('可以创建拼车房间');
    privileges.push('评论优先显示');
  }
  
  if (level >= 5) {
    privileges.push('可以申请说书人认证');
    privileges.push('个人主页更多展示位');
  }
  
  if (level >= 7) {
    privileges.push('精选剧本推荐权重+50%');
    privileges.push('专属等级头像框');
  }
  
  if (level >= 10) {
    privileges.push('传奇玩家标识');
    privileges.push('所有特权全部解锁');
  }
  
  return privileges;
}

