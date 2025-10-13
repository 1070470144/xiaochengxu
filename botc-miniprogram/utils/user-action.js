/**
 * 用户交互工具类
 * 处理用户点击、私聊、关注等操作
 */

import Auth from './auth.js'

class UserAction {
  /**
   * 显示用户操作菜单
   * @param {String} userId - 用户ID
   * @param {Object} userInfo - 用户信息（可选）
   */
  static showUserMenu(userId, userInfo = {}) {
    console.log('showUserMenu called:', userId, userInfo)
    
    // 检查userId是否有效
    if (!userId) {
      console.warn('userId is empty')
      uni.showToast({
        title: '用户信息无效',
        icon: 'none'
      })
      return
    }
    
    // 检查是否是自己
    const currentUserInfo = Auth.getUserInfo()
    const currentUserId = currentUserInfo ? (currentUserInfo.uid || currentUserInfo._id || currentUserInfo.id) : null
    console.log('currentUserId:', currentUserId)
    
    if (userId === currentUserId) {
      uni.showToast({
        title: '这是你自己哦',
        icon: 'none'
      })
      return
    }
    
    // 显示操作菜单
    console.log('显示操作菜单...')
    uni.showActionSheet({
      itemList: ['发私信', '查看主页', '关注TA'],
      success: (res) => {
        console.log('选择了菜单项:', res.tapIndex)
        switch (res.tapIndex) {
          case 0:
            // 发私信
            UserAction.goToChat(userId, userInfo)
            break
          case 1:
            // 查看主页
            UserAction.goToProfile(userId, userInfo)
            break
          case 2:
            // 关注
            UserAction.followUser(userId)
            break
        }
      },
      fail: (err) => {
        console.error('showActionSheet failed:', err)
      }
    })
  }
  
  /**
   * 直接发起私聊
   * @param {String} userId - 用户ID
   * @param {Object} userInfo - 用户信息（可选）
   */
  static goToChat(userId, userInfo = {}) {
    // 检查登录
    if (!Auth.isLogin()) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        Auth.toLogin()
      }, 1500)
      return
    }
    
    // 检查是否是自己
    const currentUserInfo = Auth.getUserInfo()
    const currentUserId = currentUserInfo ? (currentUserInfo.uid || currentUserInfo._id || currentUserInfo.id) : null
    
    if (userId === currentUserId) {
      uni.showToast({
        title: '不能给自己发私信',
        icon: 'none'
      })
      return
    }
    
    // 跳转到私聊页面
    uni.navigateTo({
      url: `/pages/chat/detail/detail?user_id=${userId}`
    })
  }
  
  /**
   * 跳转到用户主页
   * @param {String} userId - 用户ID
   * @param {Object} userInfo - 用户信息（可选）
   */
  static goToProfile(userId, userInfo = {}) {
    console.log('goToProfile called:', userId)
    
    // 检查userId是否有效
    if (!userId) {
      uni.showToast({
        title: '用户ID无效',
        icon: 'none'
      })
      return
    }
    
    // 跳转到用户主页
    uni.navigateTo({
      url: `/pages/user/other-profile/other-profile?user_id=${userId}`
    })
  }
  
  /**
   * 关注用户
   * @param {String} userId - 用户ID
   */
  static async followUser(userId) {
    // 检查登录
    if (!Auth.isLogin()) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        Auth.toLogin()
      }, 1500)
      return
    }
    
    uni.showLoading({ title: '操作中...' })
    
    try {
      const result = await uniCloud.callFunction({
        name: 'user-follow',
        data: {
          target_user_id: userId,
          action: 'follow',
          token: Auth.getToken()
        }
      })
      
      uni.hideLoading()
      
      if (result.result.code === 0) {
        uni.showToast({
          title: '关注成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.result.message)
      }
    } catch (error) {
      uni.hideLoading()
      console.error('关注失败：', error)
      uni.showToast({
        title: error.message || '关注失败',
        icon: 'none'
      })
    }
  }
  
  /**
   * 快捷发起私聊（长按事件）
   * @param {String} userId - 用户ID
   * @param {Object} userInfo - 用户信息（可选）
   */
  static onLongPressUser(userId, userInfo = {}) {
    // 震动反馈
    uni.vibrateShort()
    
    // 显示操作菜单
    this.showUserMenu(userId, userInfo)
  }
}

export default UserAction

