'use strict';

/**
 * 云函数：获取角色列表
 * 功能：支持搜索、筛选、分页
 */
exports.main = async (event, context) => {
  console.log('[wiki-role-list] 收到请求:', event);
  
  const { 
    keyword = '',           // 搜索关键词
    sync_status = 'all',    // 筛选状态：all/synced/unsynced/failed
    page = 1, 
    page_size = 20 
  } = event;
  
  const db = uniCloud.database();
  const collection = db.collection('wiki_role_list');
  
  try {
    // 构建查询条件
    let where = {};
    
    // 搜索条件
    if (keyword && keyword.trim()) {
      where.role_name = new RegExp(keyword.trim(), 'i');
    }
    
    // 状态筛选
    if (sync_status === 'synced') {
      where.is_synced = true;
      where.sync_status = 'success';
    } else if (sync_status === 'unsynced') {
      where.is_synced = false;
    } else if (sync_status === 'failed') {
      where.sync_status = 'failed';
    }
    
    console.log('[wiki-role-list] 查询条件:', where);
    
    // 查询总数
    const countRes = await collection.where(where).count();
    const total = countRes.total || 0;
    
    // 查询列表
    const listRes = await collection
      .where(where)
      .orderBy('created_at', 'desc')
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get();
    
    const list = listRes.data || [];
    
    console.log(`[wiki-role-list] 查询成功，共 ${total} 条，返回 ${list.length} 条`);
    
    return {
      code: 0,
      message: '查询成功',
      data: {
        list: list,
        total: total,
        page: page,
        page_size: page_size
      }
    };
    
  } catch (error) {
    console.error('[wiki-role-list] 错误:', error);
    return {
      code: 500,
      message: '查询失败: ' + error.message
    };
  }
};
