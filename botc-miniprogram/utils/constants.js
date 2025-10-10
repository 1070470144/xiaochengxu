// 血染钟楼小程序常量定义

// 用户角色
export const USER_ROLES = {
  NORMAL: 1,    // 普通用户
  VIP: 2,       // VIP用户
  STORYTELLER: 3, // 说书人
  ADMIN: 9      // 管理员
}

// 用户状态
export const USER_STATUS = {
  DISABLED: 0,  // 禁用
  NORMAL: 1     // 正常
}

// 剧本状态
export const SCRIPT_STATUS = {
  PENDING: 0,   // 待审核
  PUBLISHED: 1, // 已发布
  REJECTED: 2   // 已下架
}

// 剧本难度
export const SCRIPT_DIFFICULTY = {
  EASY: 1,      // 简单
  NORMAL: 2,    // 中等
  HARD: 3,      // 困难
  EXPERT: 4     // 专家
}

export const DIFFICULTY_TEXT = {
  [SCRIPT_DIFFICULTY.EASY]: '简单',
  [SCRIPT_DIFFICULTY.NORMAL]: '中等',
  [SCRIPT_DIFFICULTY.HARD]: '困难',
  [SCRIPT_DIFFICULTY.EXPERT]: '专家'
}

export const DIFFICULTY_COLORS = {
  [SCRIPT_DIFFICULTY.EASY]: '#52c41a',
  [SCRIPT_DIFFICULTY.NORMAL]: '#1890ff',
  [SCRIPT_DIFFICULTY.HARD]: '#faad14',
  [SCRIPT_DIFFICULTY.EXPERT]: '#f5222d'
}

// 拼车房间状态
export const CARPOOL_STATUS = {
  CANCELLED: 0, // 已取消
  RECRUITING: 1, // 招募中
  FULL: 2,      // 已满员
  CONFIRMED: 3, // 已确认
  FINISHED: 4   // 已结束
}

export const CARPOOL_STATUS_TEXT = {
  [CARPOOL_STATUS.CANCELLED]: '已取消',
  [CARPOOL_STATUS.RECRUITING]: '招募中',
  [CARPOOL_STATUS.FULL]: '已满员',
  [CARPOOL_STATUS.CONFIRMED]: '已确认',
  [CARPOOL_STATUS.FINISHED]: '已结束'
}

export const CARPOOL_STATUS_COLORS = {
  [CARPOOL_STATUS.CANCELLED]: '#d9d9d9',
  [CARPOOL_STATUS.RECRUITING]: '#52c41a',
  [CARPOOL_STATUS.FULL]: '#faad14',
  [CARPOOL_STATUS.CONFIRMED]: '#1890ff',
  [CARPOOL_STATUS.FINISHED]: '#999999'
}

// 拼车成员状态
export const MEMBER_STATUS = {
  LEFT: 0,      // 已退出
  APPLIED: 1,   // 已报名
  CONFIRMED: 2  // 已确认
}

export const MEMBER_STATUS_TEXT = {
  [MEMBER_STATUS.LEFT]: '已退出',
  [MEMBER_STATUS.APPLIED]: '已报名',
  [MEMBER_STATUS.CONFIRMED]: '已确认'
}

// 消息类型
export const MESSAGE_TYPE = {
  TEXT: 1,      // 文本
  IMAGE: 2      // 图片
}

// 说书人认证状态
export const STORYTELLER_STATUS = {
  UNCERTIFIED: 0, // 未认证
  CERTIFIED: 1    // 已认证
}

// 用户等级配置
export const USER_LEVELS = [
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
]

// 经验值获取规则
export const EXP_RULES = {
  LOGIN: 5,           // 每日首次登录
  UPLOAD_SCRIPT: 20,  // 上传剧本
  COMMENT: 10,        // 发表评论
  SHARE: 5,           // 分享内容
  CREATE_CARPOOL: 10, // 创建拼车房间
  REVIEW_STORYTELLER: 5 // 评价说书人
}

// 血染钟楼游戏相关常量
export const BOTC_CONSTANTS = {
  // 常见剧本标签
  SCRIPT_TAGS: [
    '经典剧本', '新手友好', '老手局', '剧情丰富', '推理烧脑',
    '快节奏', '慢节奏', '创新玩法', '大型剧本', '小型剧本',
    '多结局', '单结局', '角色丰富', '机制复杂', '简单易懂'
  ],
  
  // 拼车标签
  CARPOOL_TAGS: [
    '新手友好', '老手局', '剧情丰富', '推理烧脑', 
    '快节奏', '慢节奏', '经典剧本', '创新玩法',
    '线下聚会', '定期局', 'BYOB', '提供茶水',
    '桌游店', '私人场所', '包场', '散台'
  ],
  
  // 常见人数配置
  PLAYER_COUNTS: [
    '5人', '6人', '7人', '8人', '9人', '10人',
    '5-7人', '6-8人', '7-9人', '8-10人',
    '10-15人', '15-20人', '5-20人'
  ],
  
  // 游戏时长范围
  DURATION_RANGES: [
    { min: 60, max: 90, text: '1-1.5小时' },
    { min: 90, max: 120, text: '1.5-2小时' },
    { min: 120, max: 180, text: '2-3小时' },
    { min: 180, max: 240, text: '3-4小时' },
    { min: 240, max: 360, text: '4-6小时' }
  ]
}

// API响应码
export const RESPONSE_CODE = {
  SUCCESS: 0,           // 成功
  PARAM_ERROR: 400,     // 参数错误  
  UNAUTHORIZED: 401,    // 未授权
  FORBIDDEN: 403,       // 禁止访问
  NOT_FOUND: 404,       // 未找到
  SERVER_ERROR: 500     // 服务器错误
}

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  SEARCH_HISTORY: 'searchHistory',
  VIEWED_SCRIPTS: 'viewedScripts',
  APP_CONFIG: 'appConfig'
}

// 页面路径
export const PAGE_PATHS = {
  INDEX: '/pages/index/index',
  LOGIN: '/pages/user/login/login',
  SCRIPT_LIST: '/pages/script/list/list',
  SCRIPT_DETAIL: '/pages/script/detail/detail',
  CARPOOL_LIST: '/pages/carpool/list/list',
  CARPOOL_CREATE: '/pages/carpool/create/create',
  CARPOOL_DETAIL: '/pages/carpool/detail/detail',
  CHAT_LIST: '/pages/community/chat/list/list',
  USER_PROFILE: '/pages/user/profile/profile'
}

// 分享配置
export const SHARE_CONFIG = {
  DEFAULT_TITLE: '血染钟楼 - 剧本分享与线下组局平台',
  DEFAULT_PATH: '/pages/index/index',
  DEFAULT_IMAGE: '/static/images/share-cover.png'
}
