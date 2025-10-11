'use strict';

/**
 * 获取用户统计数据云函数
 */
exports.main = async (event, context) => {
  console.log('获取用户统计，参数：', event)
  
  const { token } = event
  
  // 验证token并获取用户ID
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const userId = token.split('_')[0]
  
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  const db = uniCloud.database()
  
  try {
    // 并行获取各项统计数据
    const [
      uploadCount,      // 上传剧本数
      favoriteCount,    // 收藏剧本数
      carpoolCount,     // 创建拼车数
      joinedCarpoolCount, // 参与拼车数
      postCount,        // 发布帖子数
      commentCount,     // 发表评论数
      likeCount,        // 获得点赞数
      viewCount         // 获得浏览数
    ] = await Promise.all([
      // 上传剧本数（假设有botc-scripts表）
      db.collection('botc-scripts').where({
        uploader_id: userId
      }).count(),
      
      // 收藏剧本数（假设有botc-favorites表）
      db.collection('botc-favorites').where({
        user_id: userId,
        type: 'script'
      }).count().catch(() => ({ total: 0 })),
      
      // 创建拼车数
      db.collection('botc-carpool-rooms').where({
        host_id: userId
      }).count(),
      
      // 参与拼车数
      db.collection('botc-carpool-members').where({
        user_id: userId,
        status: db.command.neq(0) // 排除已退出
      }).count(),
      
      // 发布帖子数
      db.collection('botc-posts').where({
        user_id: userId,
        status: db.command.neq(0) // 排除已删除
      }).count(),
      
      // 发表评论数
      db.collection('botc-post-comments').where({
        user_id: userId,
        status: db.command.neq(0) // 排除已删除
      }).count(),
      
      // 获得点赞数（帖子）
      db.collection('botc-posts').where({
        user_id: userId,
        status: 1
      }).field({
        like_count: true
      }).get().then(res => {
        return { total: res.data.reduce((sum, item) => sum + (item.like_count || 0), 0) }
      }),
      
      // 获得浏览数（帖子）
      db.collection('botc-posts').where({
        user_id: userId,
        status: 1
      }).field({
        view_count: true
      }).get().then(res => {
        return { total: res.data.reduce((sum, item) => sum + (item.view_count || 0), 0) }
      })
    ])
    
    return {
      code: 0,
      message: 'success',
      data: {
        uploadCount: uploadCount.total || 0,
        favoriteCount: favoriteCount.total || 0,
        carpoolCount: carpoolCount.total || 0,
        joinedCarpoolCount: joinedCarpoolCount.total || 0,
        postCount: postCount.total || 0,
        commentCount: commentCount.total || 0,
        likeCount: likeCount.total || 0,
        viewCount: viewCount.total || 0
      }
    }
    
  } catch (error) {
    console.error('获取用户统计失败：', error)
    return {
      code: 500,
      message: '获取统计数据失败'
    }
  }
}

