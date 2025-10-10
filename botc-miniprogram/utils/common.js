// 血染钟楼小程序通用工具函数
import { 
  DIFFICULTY_TEXT, 
  DIFFICULTY_COLORS,
  CARPOOL_STATUS_TEXT,
  CARPOOL_STATUS_COLORS,
  USER_LEVELS 
} from './constants.js'

/**
 * 格式化时间
 * @param {string|number|Date} timestamp 时间戳
 * @param {string} format 格式化类型: 'relative', 'datetime', 'date', 'time'
 */
export function formatTime(timestamp, format = 'relative') {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  switch (format) {
    case 'relative':
      return getRelativeTime(diff, date)
    case 'datetime':
      return getDateTime(date)
    case 'date':
      return getDate(date)
    case 'time':
      return getTime(date)
    default:
      return getRelativeTime(diff, date)
  }
}

// 获取相对时间
function getRelativeTime(diff, date) {
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

// 获取日期时间
function getDateTime(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 获取日期
function getDate(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 获取时间
function getTime(date) {
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

/**
 * 获取难度文本和颜色
 * @param {number} difficulty 难度等级
 */
export function getDifficulty(difficulty) {
  return {
    text: DIFFICULTY_TEXT[difficulty] || '未知',
    color: DIFFICULTY_COLORS[difficulty] || '#d9d9d9'
  }
}

/**
 * 获取拼车状态文本和颜色
 * @param {number} status 拼车状态
 */
export function getCarpoolStatus(status) {
  return {
    text: CARPOOL_STATUS_TEXT[status] || '未知',
    color: CARPOOL_STATUS_COLORS[status] || '#d9d9d9'
  }
}

/**
 * 获取用户等级信息
 * @param {number} level 用户等级
 * @param {number} exp 用户经验值
 */
export function getUserLevelInfo(level, exp) {
  const currentLevel = USER_LEVELS.find(l => l.level === level) || USER_LEVELS[0]
  const nextLevel = USER_LEVELS.find(l => l.level === level + 1)
  
  let progress = 100 // 默认满级
  if (nextLevel) {
    const currentLevelExp = currentLevel.exp
    const nextLevelExp = nextLevel.exp
    progress = Math.floor(((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100)
  }
  
  return {
    level,
    name: currentLevel.name,
    exp,
    nextLevelExp: nextLevel ? nextLevel.exp : null,
    progress: Math.max(0, Math.min(100, progress))
  }
}

/**
 * 验证手机号
 * @param {string} phone 手机号
 */
export function validatePhone(phone) {
  const phoneReg = /^1[3-9]\d{9}$/
  return phoneReg.test(phone)
}

/**
 * 验证微信号
 * @param {string} wechat 微信号
 */
export function validateWechat(wechat) {
  // 微信号规则：6-20位，字母、数字、下划线、减号
  const wechatReg = /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/
  return wechatReg.test(wechat)
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {number} interval 间隔时间
 */
export function throttle(fn, interval = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn.apply(this, args)
    }
  }
}

/**
 * 深度克隆
 * @param {any} obj 要克隆的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  const clonedObj = {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }
  
  return clonedObj
}

/**
 * 生成随机字符串
 * @param {number} length 字符串长度
 */
export function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 格式化文件大小
 * @param {number} size 文件大小（字节）
 */
export function formatFileSize(size) {
  if (size === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(k))
  
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取图片临时路径（用于上传）
 * @param {Object} options 选择图片的选项
 */
export function chooseImage(options = {}) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: options.count || 1,
      sizeType: options.sizeType || ['compressed', 'original'],
      sourceType: options.sourceType || ['album', 'camera'],
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 上传文件到云存储
 * @param {string} filePath 文件路径
 * @param {string} cloudPath 云存储路径
 */
export async function uploadToCloud(filePath, cloudPath) {
  try {
    const result = await uniCloud.uploadFile({
      filePath,
      cloudPath
    })
    
    return {
      success: true,
      fileID: result.fileID,
      url: result.tempFileURL
    }
  } catch (error) {
    console.error('上传文件失败：', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 显示确认对话框
 * @param {string} title 标题
 * @param {string} content 内容
 */
export function showConfirm(title, content) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 复制到剪贴板
 * @param {string} data 要复制的数据
 * @param {string} message 成功提示信息
 */
export function copyToClipboard(data, message = '已复制到剪贴板') {
  uni.setClipboardData({
    data,
    success: () => {
      uni.showToast({
        title: message,
        icon: 'success'
      })
    }
  })
}
