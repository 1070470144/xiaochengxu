'use strict';

// 获取剧本详情云函数
exports.main = async (event, context) => {
  console.log('获取剧本详情，参数：', event)
  
  const { id, token } = event
  
  if (!id) {
    return {
      code: 400,
      message: '剧本ID不能为空',
      data: null
    }
  }
  
  // 提取当前用户ID（如果有token）
  let currentUserId = null
  if (token) {
    currentUserId = token.split('_')[0]
  }
  
  const db = uniCloud.database()
  const collection = db.collection('botc-scripts')
  
  try {
    // 先查询剧本基本信息
    const scriptRes = await collection.doc(id).get()
    
    if (!scriptRes.data || scriptRes.data.length === 0) {
      return {
        code: 404,
        message: '剧本不存在',
        data: null
      }
    }
    
    const script = scriptRes.data[0]
    
    // 权限判断：
    // 1. status=1（已发布）所有人都可以看
    // 2. status=0（待审核）只有上传者本人可以看
    // 3. status=2（已拒绝）只有上传者本人可以看
    const isPublished = script.status === 1
    const isOwner = currentUserId && script.creator_id === currentUserId
    
    if (!isPublished && !isOwner) {
      return {
        code: 403,
        message: '该剧本暂未发布',
        data: null
      }
    }
    
    // 关联创建者信息
    let creator = null
    if (script.creator_id) {
      const userRes = await db.collection('uni-id-users').doc(script.creator_id).get()
      if (userRes.data && userRes.data.length > 0) {
        const user = userRes.data[0]
        creator = {
          _id: user._id,
          nickname: user.nickname,
          avatar: user.avatar
        }
      }
    }
    
    // 增加浏览量（仅对已发布的剧本，异步执行）
    if (isPublished) {
      collection.doc(id).update({
        view_count: db.command.inc(1)
      }).catch(err => {
        console.error('更新浏览量失败：', err)
      })
    }
    
    // 处理返回数据
    const processedScript = {
      ...script,
      creator: creator
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
