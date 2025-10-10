'use strict';

// 获取剧本详情云函数
exports.main = async (event, context) => {
  console.log('获取剧本详情，参数：', event)
  
  const { id } = event
  
  if (!id) {
    return {
      code: 400,
      message: '剧本ID不能为空',
      data: null
    }
  }
  
  const db = uniCloud.database()
  const collection = db.collection('botc-scripts')
  
  try {
    // 使用聚合查询，关联创建者信息
    const result = await collection.aggregate()
      .match({ _id: id, status: 1 }) // 只查询已发布的剧本
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
      .end()
    
    if (result.data.length === 0) {
      return {
        code: 404,
        message: '剧本不存在或已下架',
        data: null
      }
    }
    
    const script = result.data[0]
    
    // 增加浏览量（异步执行，不影响响应速度）
    collection.doc(id).update({
      view_count: db.command.inc(1)
    }).catch(err => {
      console.error('更新浏览量失败：', err)
    })
    
    // 处理返回数据
    const processedScript = {
      ...script,
      creator: script.creator ? {
        _id: script.creator._id,
        nickname: script.creator.nickname,
        avatar: script.creator.avatar
      } : null
    }
    
    return {
      code: 0,
      message: 'success',
      data: processedScript
    }
    
  } catch (error) {
    console.error('获取剧本详情失败：', error)
    return {
      code: 500,
      message: '获取剧本详情失败',
      data: null
    }
  }
}
