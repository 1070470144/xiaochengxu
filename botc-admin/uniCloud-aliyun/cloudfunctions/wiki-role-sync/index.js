'use strict';

/**
 * 云函数：同步角色
 * 功能：根据role_ids批量同步角色，调用wiki-admin-sync-single
 */
exports.main = async (event, context) => {
  console.log('[wiki-role-sync] 收到请求:', event);
  
  const { role_ids } = event;
  
  // 参数校验
  if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
    return {
      code: 400,
      message: '请提供要同步的角色ID数组'
    };
  }
  
  const db = uniCloud.database();
  const collection = db.collection('wiki_role_list');
  
  const start_time = Date.now();
  const results = {
    success: [],
    failed: []
  };
  
  try {
    for (const role_id of role_ids) {
      try {
        // 查询角色信息
        const roleRes = await collection.doc(role_id).get();
        
        if (!roleRes.data || roleRes.data.length === 0) {
          results.failed.push({ 
            role_id, 
            role_name: '未知',
            reason: '角色不存在' 
          });
          continue;
        }
        
        const role = roleRes.data[0];
        console.log(`[wiki-role-sync] 开始同步角色: ${role.role_name}`);
        
        // 调用单个同步云函数
        const syncRes = await uniCloud.callFunction({
          name: 'wiki-admin-sync-single',
          data: {
            url: role.role_url
          }
        });
        
        console.log(`[wiki-role-sync] 同步结果:`, syncRes.result);
        
        // 更新角色状态
        if (syncRes.result.code === 0) {
          await collection.doc(role_id).update({
            is_synced: true,
            sync_status: 'success',
            last_sync_time: Date.now(),
            sync_error: db.command.remove(),
            updated_at: Date.now()
          });
          
          results.success.push({
            role_id,
            role_name: role.role_name
          });
          
          console.log(`[wiki-role-sync] ✓ ${role.role_name} 同步成功`);
        } else {
          await collection.doc(role_id).update({
            is_synced: false,
            sync_status: 'failed',
            last_sync_time: Date.now(),
            sync_error: syncRes.result.message,
            updated_at: Date.now()
          });
          
          results.failed.push({
            role_id,
            role_name: role.role_name,
            reason: syncRes.result.message
          });
          
          console.log(`[wiki-role-sync] ✗ ${role.role_name} 同步失败: ${syncRes.result.message}`);
        }
        
      } catch (err) {
        console.error('[wiki-role-sync] 同步角色失败:', err);
        results.failed.push({
          role_id,
          role_name: '未知',
          reason: err.message
        });
      }
    }
    
    const end_time = Date.now();
    const duration = Math.round((end_time - start_time) / 1000);
    
    // 写入同步日志
    try {
      const logCollection = db.collection('wiki_sync_logs');
      await logCollection.add({
        sync_type: 'roles',
        start_time: start_time,
        end_time: end_time,
        duration: duration,
        total_count: role_ids.length,
        success_count: results.success.length,
        failed_count: results.failed.length,
        status: results.failed.length === 0 ? 'success' : (results.success.length > 0 ? 'partial_success' : 'failed'),
        created_at: Date.now()
      });
      console.log('[wiki-role-sync] 同步日志已写入');
    } catch (logError) {
      console.error('[wiki-role-sync] 写入日志失败:', logError);
      // 日志写入失败不影响同步结果
    }
    
    const message = `同步完成：成功 ${results.success.length} 个，失败 ${results.failed.length} 个，耗时 ${duration} 秒`;
    
    return {
      code: 0,
      message: message,
      data: {
        total_count: role_ids.length,
        success_count: results.success.length,
        failed_count: results.failed.length,
        duration: duration,
        success: results.success,
        failed: results.failed
      }
    };
    
  } catch (error) {
    console.error('[wiki-role-sync] 错误:', error);
    
    // 记录失败日志
    try {
      const logCollection = db.collection('wiki_sync_logs');
      await logCollection.add({
        sync_type: 'roles',
        start_time: start_time,
        end_time: Date.now(),
        duration: Math.round((Date.now() - start_time) / 1000),
        total_count: role_ids.length,
        success_count: 0,
        failed_count: role_ids.length,
        status: 'failed',
        error_message: error.message,
        created_at: Date.now()
      });
    } catch (logError) {
      console.error('[wiki-role-sync] 写入失败日志失败:', logError);
    }
    
    return {
      code: 500,
      message: '同步失败: ' + error.message
    };
  }
};
