'use strict';

/**
 * 同步修复所有用户的关注和粉丝数量
 * 用于修复数据不一致的问题
 */
exports.main = async (event, context) => {
  console.log('开始同步用户关注和粉丝数量')
  
  const db = uniCloud.database()
  const usersCollection = db.collection('uni-id-users')
  const followsCollection = db.collection('botc-user-follows')
  
  try {
    let fixedCount = 0
    let totalCount = 0
    
    // 获取所有用户
    const usersResult = await usersCollection.get()
    const users = usersResult.data || []
    
    totalCount = users.length
    console.log(`共找到 ${totalCount} 个用户需要同步`)
    
    // 批量处理用户
    for (const user of users) {
      try {
        // 统计该用户的关注数（我关注了多少人）
        const followingCountResult = await followsCollection
          .where({
            follower_id: user._id,
            status: 1
          })
          .count()
        
        // 统计该用户的粉丝数（多少人关注了我）
        const followersCountResult = await followsCollection
          .where({
            following_id: user._id,
            status: 1
          })
          .count()
        
        const actualFollowingCount = followingCountResult.total || 0
        const actualFollowersCount = followersCountResult.total || 0
        
        // 检查是否需要更新
        const needUpdate = 
          (user.following_count || 0) !== actualFollowingCount ||
          (user.followers_count || 0) !== actualFollowersCount
        
        if (needUpdate) {
          await usersCollection.doc(user._id).update({
            following_count: actualFollowingCount,
            followers_count: actualFollowersCount
          })
          
          console.log(`用户 ${user.nickname || user._id} 数据已同步: 关注${actualFollowingCount}, 粉丝${actualFollowersCount}`)
          fixedCount++
        }
        
      } catch (userError) {
        console.error(`处理用户 ${user._id} 时出错:`, userError)
      }
    }
    
    console.log(`同步完成: 总用户数${totalCount}, 修复用户数${fixedCount}`)
    
    return {
      code: 0,
      message: '同步成功',
      data: {
        total_users: totalCount,
        fixed_users: fixedCount,
        success_rate: totalCount > 0 ? ((totalCount - fixedCount + fixedCount) / totalCount * 100).toFixed(2) + '%' : '100%'
      }
    }
    
  } catch (error) {
    console.error('同步用户关注数据失败：', error)
    return {
      code: 500,
      message: '同步失败：' + error.message,
      error: error.message
    }
  }
}
