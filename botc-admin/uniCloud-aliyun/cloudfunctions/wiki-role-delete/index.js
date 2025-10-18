'use strict';

/**
 * 云函数：删除角色
 * 功能：从wiki_role_list中删除指定角色
 */
exports.main = async (event, context) => {
  console.log('[wiki-role-delete] 收到请求:', event);
  
  const { role_ids } = event;
  
  // 参数校验
  if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
    return {
      code: 400,
      message: '请提供要删除的角色ID数组'
    };
  }
  
  const db = uniCloud.database();
  const collection = db.collection('wiki_role_list');
  
  try {
    const results = {
      success: [],
      failed: []
    };
    
    for (const role_id of role_ids) {
      try {
        const deleteRes = await collection.doc(role_id).remove();
        
        console.log('[wiki-role-delete] 删除结果:', deleteRes);
        
        if (deleteRes.deleted > 0) {
          results.success.push(role_id);
        } else {
          results.failed.push({ role_id, reason: '未找到该角色' });
        }
      } catch (err) {
        console.error('[wiki-role-delete] 删除失败:', err);
        results.failed.push({ role_id, reason: err.message });
      }
    }
    
    const message = `成功删除 ${results.success.length} 个角色` +
      (results.failed.length > 0 ? `，${results.failed.length} 个失败` : '');
    
    return {
      code: 0,
      message: message,
      data: results
    };
    
  } catch (error) {
    console.error('[wiki-role-delete] 错误:', error);
    return {
      code: 500,
      message: '删除失败: ' + error.message
    };
  }
};
