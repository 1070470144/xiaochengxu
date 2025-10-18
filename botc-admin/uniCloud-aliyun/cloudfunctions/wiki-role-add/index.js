'use strict';

/**
 * 云函数：添加角色到同步列表
 * 功能：接收角色名称，生成URL，存入wiki_role_list
 */
exports.main = async (event, context) => {
  console.log('[wiki-role-add] 收到请求:', event);
  
  const { role_names } = event;
  
  // 参数校验
  if (!role_names || !Array.isArray(role_names) || role_names.length === 0) {
    return {
      code: 400,
      message: '请提供角色名称数组'
    };
  }
  
  const db = uniCloud.database();
  const collection = db.collection('wiki_role_list');
  
  try {
    const results = {
      success: [],
      failed: [],
      duplicate: []
    };
    
    for (const role_name of role_names) {
      const trimmedName = role_name.trim();
      
      if (!trimmedName) {
        results.failed.push({ role_name, reason: '角色名称不能为空' });
        continue;
      }
      
      // 检查是否已存在
      const existRes = await collection.where({ role_name: trimmedName }).count();
      const count = existRes.total || 0;
      
      if (count > 0) {
        results.duplicate.push(trimmedName);
        continue;
      }
      
      // 生成URL（直接使用中文名称，浏览器会自动编码）
      const role_url = `https://clocktower-wiki.gstonegames.com/index.php?title=${trimmedName}`;
      
      // 插入数据库
      const addRes = await collection.add({
        role_name: trimmedName,
        role_url: role_url,
        is_synced: false,
        sync_status: 'pending',
        created_at: Date.now(),
        updated_at: Date.now()
      });
      
      console.log('[wiki-role-add] 插入结果:', addRes);
      
      if (addRes.id) {
        results.success.push(trimmedName);
      } else {
        results.failed.push({ role_name: trimmedName, reason: '数据库插入失败' });
      }
    }
    
    // 返回结果
    const message = `成功添加 ${results.success.length} 个角色` +
      (results.duplicate.length > 0 ? `，${results.duplicate.length} 个重复` : '') +
      (results.failed.length > 0 ? `，${results.failed.length} 个失败` : '');
    
    return {
      code: 0,
      message: message,
      data: results
    };
    
  } catch (error) {
    console.error('[wiki-role-add] 错误:', error);
    return {
      code: 500,
      message: '添加失败: ' + error.message
    };
  }
};
