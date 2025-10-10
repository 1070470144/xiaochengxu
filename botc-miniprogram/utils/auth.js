/**
 * 用户认证工具类
 */

class Auth {
  /**
   * 检查用户是否已登录
   */
  static isLogin() {
    const token = uni.getStorageSync('uni_id_token')
    const tokenExpired = uni.getStorageSync('uni_id_token_expired')
    
    if (!token) {
      return false
    }
    
    // 检查token是否过期
    if (tokenExpired && tokenExpired < Date.now()) {
      this.logout()
      return false
    }
    
    return true
  }

  /**
   * 获取用户信息
   */
  static getUserInfo() {
    return uni.getStorageSync('userInfo')
  }

  /**
   * 获取token
   */
  static getToken() {
    return uni.getStorageSync('uni_id_token')
  }

  /**
   * 登出
   */
  static logout() {
    uni.removeStorageSync('uni_id_token')
    uni.removeStorageSync('uni_id_token_expired')
    uni.removeStorageSync('userInfo')
  }

  /**
   * 跳转到登录页
   */
  static toLogin() {
    uni.navigateTo({
      url: '/pages/login/sms-login'
    })
  }

  /**
   * 需要登录才能继续（装饰器模式）
   */
  static requireLogin(callback) {
    if (this.isLogin()) {
      callback && callback()
    } else {
      uni.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.toLogin()
          }
        }
      })
    }
  }
}

export default Auth

