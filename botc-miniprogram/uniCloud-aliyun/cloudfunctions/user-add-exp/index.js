'use strict';

/**
 * 云函数：增加用户经验值
 * 自动计算等级升级
 */

// 等级配置（与 speckit 规范一致）
const LEVEL_CONFIG = [
  { level: 1, name: '初来乍到', exp: 0 },
  { level: 2, name: '略知一二', exp: 100 },
  { level: 3, name: '初窥门径', exp: 300 },
  { level: 4, name: '渐入佳境', exp: 600 },
  { level: 5, name: '驾轻就熟', exp: 1000 },
  { level: 6, name: '炉火纯青', exp: 1500 },
  { level: 7, name: '登峰造极', exp: 2200 },
  { level: 8, name: '出神入化', exp: 3000 },
  { level: 9, name: '无与伦比', exp: 4000 },
  { level: 10, name: '传奇玩家', exp: 5500 }
];

// 经验值获取规则
const EXP_RULES = {
  LOGIN: 5,            // 每日首次登录
  UPLOAD_SCRIPT: 20,   // 上传剧本
  COMMENT: 10,         // 发表评论
  SHARE: 5,            // 分享内容
  CREATE_CARPOOL: 10,  // 创建拼车房间
  REVIEW: 5            // 评价说书人
};

// 计算等级
function calculateLevel(exp) {
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_CONFIG[i].exp) {
      return LEVEL_CONFIG[i].level;
    }
  }
  return 1;
}

// 获取下一等级所需经验
function getNextLevelExp(currentLevel) {
  const nextLevel = LEVEL_CONFIG.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.exp : null;
}

exports.main = async (event, context) => {
  console.log('[user-add-exp] 开始增加经验值');
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 获取参数
  const { 
    expType,    // 经验类型：LOGIN, UPLOAD_SCRIPT, COMMENT等
    customExp   // 自定义经验值（可选）
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
  
  try {
    // 计算增加的经验值
    const expToAdd = customExp || EXP_RULES[expType] || 0;
    
    if (expToAdd <= 0) {
      return {
        code: 400,
        message: '无效的经验类型',
        data: null
      };
    }
    
    // 查询用户当前信息
    const userRes = await db.collection('uni-id-users')
      .doc(uid)
      .field({
        exp: true,
        level: true,
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
    const currentExp = user.exp || 0;
    const currentLevel = user.level || 1;
    
    // 计算新的经验值和等级
    const newExp = currentExp + expToAdd;
    const newLevel = calculateLevel(newExp);
    const levelUp = newLevel > currentLevel;
    
    // 更新用户经验和等级
    await db.collection('uni-id-users')
      .doc(uid)
      .update({
        exp: newExp,
        level: newLevel
      });
    
    console.log(`[user-add-exp] 用户 ${user.nickname} 获得 ${expToAdd} 经验，当前 ${newExp}，等级 ${newLevel}`);
    
    // 返回结果
    return {
      code: 0,
      message: 'success',
      data: {
        expAdded: expToAdd,
        currentExp: newExp,
        currentLevel: newLevel,
        levelUp,
        levelName: LEVEL_CONFIG.find(l => l.level === newLevel).name,
        nextLevelExp: getNextLevelExp(newLevel),
        expType
      }
    };
    
  } catch (error) {
    console.error('[user-add-exp] 错误:', error);
    return {
      code: -1,
      message: error.message,
      data: null
    };
  }
};

