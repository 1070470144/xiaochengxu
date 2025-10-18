'use strict';

/**
 * 云函数：获取角色评论列表
 */
exports.main = async (event, context) => {
  const { role_id, page = 1, page_size = 20 } = event;
  
  if (!role_id) {
    return {
      code: 400,
      message: '缺少角色ID'
    };
  }
  
  const db = uniCloud.database();
  
  try {
    // 查询评论列表
    const res = await db.collection('wiki_role_comments')
      .where({
        role_id: role_id,
        status: 1
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get();
    
    // 查询总数
    const countRes = await db.collection('wiki_role_comments')
      .where({
        role_id: role_id,
        status: 1
      })
      .count();
    
    const list = res.data || [];
    const total = countRes.total || 0;
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list: list,
        total: total,
        page: page,
        page_size: page_size,
        has_more: total > page * page_size
      }
    };
  } catch (error) {
    console.error('[wiki-role-comment-list] 错误:', error);
    return {
      code: 500,
      message: '获取失败: ' + error.message
    };
  }
};

