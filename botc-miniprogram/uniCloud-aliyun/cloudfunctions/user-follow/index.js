'use strict';

/**
 * 用户关注/取消关注云函数
 */
exports.main = async (event, context) => {
  console.log('用户关注操作，参数：', event)
  
  const {
    target_user_id,  // 目标用户ID
    action,          // 操作：follow-关注 unfollow-取消关注
    token
  } = event
  
  // 验证参数
  if (!target_user_id) {
    return {
      code: 400,
      message: '目标用户ID不能为空'
    }
  }
  
  if (!action || !['follow', 'unfollow'].includes(action)) {
    return {
      code: 400,
      message: '操作类型无效'
    }
  }
  
  // 验证token并获取当前用户ID
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const currentUserId = token.split('_')[0]
  
  if (!currentUserId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  // 不能关注自己
  if (currentUserId === target_user_id) {
    return {
      code: 400,
      message: '不能关注自己'
    }
  }
  
  const db = uniCloud.database()
  const followsCollection = db.collection('botc-user-follows')
  const usersCollection = db.collection('uni-id-users')
  
  try {
    if (action === 'follow') {
      // 关注操作
      
      // 检查是否已关注
      const existResult = await followsCollection
        .where({
          follower_id: currentUserId,
          following_id: target_user_id,
          status: 1
        })
        .count()
      
      if (existResult.total > 0) {
        return {
          code: 400,
          message: '已经关注过了'
        }
      }
      
      // 创建关注记录
      await followsCollection.add({
        follower_id: currentUserId,
        following_id: target_user_id,
        status: 1,
        created_at: new Date()
      })
      
      // 更新双方的关注数和粉丝数
      // 当前用户：关注数+1
      const currentUserDoc = await usersCollection.doc(currentUserId).get()
      const currentUser = currentUserDoc.data && currentUserDoc.data.length > 0 ? currentUserDoc.data[0] : {}
      await usersCollection.doc(currentUserId).update({
        following_count: (currentUser.following_count || 0) + 1
      })
      
      // 目标用户：粉丝数+1
      const targetUserDoc = await usersCollection.doc(target_user_id).get()
      const targetUser = targetUserDoc.data && targetUserDoc.data.length > 0 ? targetUserDoc.data[0] : {}
      await usersCollection.doc(target_user_id).update({
        followers_count: (targetUser.followers_count || 0) + 1
      })
      
      return {
        code: 0,
        message: '关注成功',
        data: {
          is_following: true
        }
      }
      
    } else {
      // 取消关注操作
      
      // 查找关注记录
      const followResult = await followsCollection
        .where({
          follower_id: currentUserId,
          following_id: target_user_id,
          status: 1
        })
        .get()
      
      if (!followResult.data || followResult.data.length === 0) {
        return {
          code: 400,
          message: '未关注该用户'
        }
      }
      
      // 删除关注记录
      await followsCollection.doc(followResult.data[0]._id).remove()
      
      // 更新双方的关注数和粉丝数
      // 当前用户：关注数-1
      const currentUserDoc = await usersCollection.doc(currentUserId).get()
      const currentUser = currentUserDoc.data && currentUserDoc.data.length > 0 ? currentUserDoc.data[0] : {}
      await usersCollection.doc(currentUserId).update({
        following_count: Math.max(0, (currentUser.following_count || 0) - 1)
      })
      
      // 目标用户：粉丝数-1
      const targetUserDoc = await usersCollection.doc(target_user_id).get()
      const targetUser = targetUserDoc.data && targetUserDoc.data.length > 0 ? targetUserDoc.data[0] : {}
      await usersCollection.doc(target_user_id).update({
        followers_count: Math.max(0, (targetUser.followers_count || 0) - 1)
      })
      
      return {
        code: 0,
        message: '取消关注成功',
        data: {
          is_following: false
        }
      }
    }
    
  } catch (error) {
    console.error('关注操作失败：', error)
    return {
      code: 500,
      message: '操作失败，请重试',
      error: error.message
    }
  }
}

