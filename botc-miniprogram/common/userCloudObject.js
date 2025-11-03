/**
 * 用户云对象统一导入
 * 所有页面统一使用此文件导入 user 云对象
 */

let userObj = null

/**
 * 获取用户云对象实例
 * @returns {Object} 用户云对象
 */
export function getUserCloudObject() {
  if (!userObj) {
    userObj = uniCloud.importObject('user', {
      customUI: true,
      debugFunction: false // 禁用本地调试，使用云端
    })
  }
  return userObj
}

/**
 * 重置云对象实例（用于登出等场景）
 */
export function resetUserCloudObject() {
  userObj = null
}

export default {
  getUserCloudObject,
  resetUserCloudObject
}

