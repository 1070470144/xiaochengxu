'use strict';

exports.main = async (event, context) => {
  const { 
    keyword, 
    entry_type = null,
    page = 1, 
    pageSize = 20,
    userId = null 
  } = event;
  
  console.log('[wiki-search] 搜索关键词:', keyword);
  
  if (!keyword || keyword.trim().length === 0) {
    return {
      code: 400,
      message: '搜索关键词不能为空'
    };
  }
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  const $ = db.command.aggregate;
  
  // 构建查询条件
  const whereCondition = {
    $or: [
      { title: new RegExp(keyword, 'i') },
      { 'content.text': new RegExp(keyword, 'i') },
      { tags: dbCmd.in([keyword]) }
    ]
  };
  
  // 如果指定了类型，添加类型筛选
  if (entry_type) {
    whereCondition.entry_type = entry_type;
  }
  
  try {
    // 执行搜索
    const result = await db.collection('wiki_entries')
      .where(whereCondition)
      .field({
        _id: true,
        entry_type: true,
        title: true,
        'content.summary': true,
        'role_info.team': true,
        'role_info.team_name': true,
        'role_info.ability': true,
        'media.icon_url': true,
        tags: true,
        'stats.view_count': true,
        source_url: true
      })
      .orderBy('stats.view_count', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 记录搜索历史
    if (userId) {
      try {
        await db.collection('wiki_search_history').add({
          user_id: userId,
          keyword: keyword.trim(),
          result_count: result.data.length,
          created_at: new Date()
        });
      } catch (err) {
        console.error('[wiki-search] 记录搜索历史失败:', err);
      }
    }
    
    // 增加搜索计数
    if (result.data && result.data.length > 0) {
      const entryIds = result.data.map(item => item._id);
      try {
        await db.collection('wiki_entries')
          .where({
            _id: dbCmd.in(entryIds)
          })
          .update({
            'stats.search_count': dbCmd.inc(1)
          });
      } catch (err) {
        console.error('[wiki-search] 更新搜索计数失败:', err);
      }
    }
    
    console.log('[wiki-search] 搜索完成，找到', result.data.length, '条结果');
    
    return {
      code: 0,
      message: '搜索成功',
      data: {
        list: result.data,
        total: result.data.length,
        page,
        pageSize,
        keyword
      }
    };
  } catch (error) {
    console.error('[wiki-search] 搜索失败:', error);
    return {
      code: 500,
      message: '搜索失败: ' + (error.message || '数据库错误')
    };
  }
};

