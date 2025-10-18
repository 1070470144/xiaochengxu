'use strict';

exports.main = async (event, context) => {
  const { entry_id, userId = null } = event;
  
  console.log('[wiki-detail] 查询词条:', entry_id);
  
  if (!entry_id) {
    return {
      code: 400,
      message: '缺少词条ID'
    };
  }
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  try {
    // 查询词条
    const result = await db.collection('wiki_entries')
      .doc(entry_id)
      .get();
    
    if (!result.data || result.data.length === 0) {
      return {
        code: 404,
        message: '词条不存在'
      };
    }
    
    const entry = result.data[0];
    
    // 增加浏览计数
    try {
      await db.collection('wiki_entries')
        .doc(entry_id)
        .update({
          'stats.view_count': dbCmd.inc(1)
        });
      
      // 更新返回数据中的浏览计数
      if (entry.stats) {
        entry.stats.view_count = (entry.stats.view_count || 0) + 1;
      }
    } catch (err) {
      console.error('[wiki-detail] 更新浏览计数失败:', err);
    }
    
    // 查询相关词条
    try {
      const relatedResult = await db.collection('wiki_entries')
        .where({
          _id: dbCmd.neq(entry_id),
          entry_type: entry.entry_type
        })
        .field({
          _id: true,
          title: true,
          'content.summary': true,
          'media.icon_url': true,
          'role_info.team': true,
          'role_info.team_name': true
        })
        .orderBy('stats.view_count', 'desc')
        .limit(5)
        .get();
      
      entry.related_entries = relatedResult.data || [];
    } catch (err) {
      console.error('[wiki-detail] 查询相关词条失败:', err);
      entry.related_entries = [];
    }
    
    console.log('[wiki-detail] 查询成功');
    
    return {
      code: 0,
      message: '获取成功',
      data: entry
    };
  } catch (error) {
    console.error('[wiki-detail] 查询失败:', error);
    return {
      code: 500,
      message: '查询失败: ' + (error.message || '数据库错误')
    };
  }
};

