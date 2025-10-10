'use strict';

// 获取剧本列表云函数
exports.main = async (event, context) => {
  console.log('获取剧本列表，参数：', event)
  
  const { 
    page = 1, 
    pageSize = 20, 
    keyword = '', 
    type = 'all',
    difficulty = 0,
    playerCount = '',
    tags = []
  } = event
  
  // 获取云数据库引用
  const db = uniCloud.database()
  const collection = db.collection('botc-scripts')
  const userCollection = db.collection('uni-id-users')
  
  try {
    // 构建查询条件
    let whereCondition = {
      status: 1 // 只查询已发布的剧本
    }
    
    // 关键词搜索
    if (keyword) {
      whereCondition.$or = [
        { title: new RegExp(keyword, 'i') },
        { author: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') }
      ]
    }
    
    // 难度筛选
    if (difficulty > 0) {
      whereCondition.difficulty = difficulty
    }
    
    // 人数筛选
    if (playerCount) {
      whereCondition.player_count = new RegExp(playerCount, 'i')
    }
    
    // 标签筛选
    if (tags.length > 0) {
      whereCondition.tags = {
        $in: tags
      }
    }
    
    // 构建查询
    let query = collection.where(whereCondition)
    
    // 关联查询创建者信息
    query = collection.aggregate()
      .match(whereCondition)
      .lookup({
        from: 'uni-id-users',
        localField: 'creator_id', 
        foreignField: '_id',
        as: 'creator'
      })
      .addFields({
        creator: {
          $arrayElemAt: ['$creator', 0]
        }
      })
    
    // 排序规则
    let sortCondition = { created_at: -1 } // 默认按创建时间倒序
    switch (type) {
      case 'hot':
        sortCondition = { view_count: -1, rating: -1 }
        break
      case 'rating':
        sortCondition = { rating: -1, rating_count: -1 }
        break
      case 'download':
        sortCondition = { download_count: -1 }
        break
      case 'new':
        sortCondition = { published_at: -1 }
        break
    }
    
    query = query.sort(sortCondition)
    
    // 分页
    const skip = (page - 1) * pageSize
    query = query.skip(skip).limit(pageSize)
    
    // 执行查询
    const listResult = await query.end()
    
    // 获取总数
    const countResult = await collection.where(whereCondition).count()
    
    // 处理返回数据，隐藏敏感信息
    const processedList = listResult.data.map(script => ({
      ...script,
      creator: script.creator ? {
        _id: script.creator._id,
        nickname: script.creator.nickname,
        avatar: script.creator.avatar
      } : null,
      // 不返回完整的json_data，节省带宽
      json_data: undefined
    }))
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: processedList,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize), 
        hasNext: page * pageSize < countResult.total
      }
    }
    
  } catch (error) {
    console.error('获取剧本列表失败：', error)
    return {
      code: 500,
      message: '获取剧本列表失败',
      data: null
    }
  }
}
