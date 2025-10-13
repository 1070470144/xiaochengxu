'use strict';

/**
 * 获取帖子列表云函数
 */
exports.main = async (event, context) => {
  console.log('获取帖子列表，参数：', event)
  
  const {
    page = 1,
    pageSize = 10,
    type,        // 帖子类型筛选
    userId,      // 用户ID筛选（查看某用户的帖子）
    sortBy = 'time'  // 排序方式：time-时间 hot-热度
  } = event
  
  const db = uniCloud.database()
  const dbCmd = db.command
  const postsCollection = db.collection('botc-posts')
  
  try {
    // 构建查询条件
    const whereCondition = {
      status: 1  // 只显示正常状态的帖子
    }
    
    if (type) {
      whereCondition.type = type
    }
    
    if (userId) {
      whereCondition.user_id = userId
    }
    
    // 排序规则
    let sortRule = {}
    if (sortBy === 'hot') {
      // 热度排序：置顶 > 热门 > 点赞数 > 评论数 > 时间
      sortRule = {
        is_top: -1,
        is_hot: -1,
        like_count: -1,
        comment_count: -1,
        created_at: -1
      }
    } else {
      // 时间排序：置顶 > 时间
      sortRule = {
        is_top: -1,
        created_at: -1
      }
    }
    
    // 分页查询
    const skip = (page - 1) * pageSize
    
    // 获取帖子列表（关联用户信息）
    const result = await postsCollection.aggregate()
      .match(whereCondition)
      .sort(sortRule)
      .skip(skip)
      .limit(pageSize)
      .lookup({
        from: 'uni-id-users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      })
      .addFields({
        user: { $arrayElemAt: ['$user', 0] }
      })
      .end()
    
    // 获取总数
    const countResult = await postsCollection.where(whereCondition).count()
    
    // 处理返回数据，只返回必要的用户信息
    const processedPosts = result.data.map(post => ({
      _id: post._id,
      user_id: post.user_id, // 添加 user_id 字段
      content: post.content,
      images: post.images || [],
      type: post.type,
      tags: post.tags || [],
      location: post.location || '',
      view_count: post.view_count || 0,
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      share_count: post.share_count || 0,
      is_top: post.is_top || false,
      is_hot: post.is_hot || false,
      created_at: post.created_at,
      user: post.user ? {
        _id: post.user._id,
        nickname: post.user.nickname,
        avatar: post.user.avatar,
        level: post.user.level
      } : null
    }))
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: processedPosts,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + processedPosts.length < countResult.total
      }
    }
    
  } catch (error) {
    console.error('获取帖子列表失败：', error)
    return {
      code: 500,
      message: '获取帖子列表失败'
    }
  }
}

