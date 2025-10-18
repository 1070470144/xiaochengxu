'use strict';

exports.main = async (event, context) => {
  const { entry_type = null, keyword = null, page = 1, pageSize = 20, orderBy = 'created_at', order = 'desc' } = event;
  
  console.log('[wiki-list] 查询列表，类型:', entry_type, '关键词:', keyword);
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  try {
    const whereCondition = { status: 1 };
    
    if (entry_type) {
      whereCondition.entry_type = entry_type;
    }
    
    if (keyword && keyword.trim()) {
      whereCondition.$or = [
        { title: new RegExp(keyword, 'i') },
        { 'content.text': new RegExp(keyword, 'i') },
        { tags: dbCmd.in([keyword]) }
      ];
    }
    
    const countRes = await db.collection('wiki_entries').where(whereCondition).count();
    
    const listRes = await db.collection('wiki_entries')
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
        'stats.favorite_count': true,
        is_featured: true
      })
      .orderBy(orderBy, order)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    console.log('[wiki-list] 查询成功，找到', listRes.data.length, '条记录');
    
    return {
      code: 0,
      message: '查询成功',
      data: {
        list: listRes.data || [],
        total: countRes.total,
        page,
        pageSize,
        hasNext: countRes.total > page * pageSize
      }
    };
  } catch (error) {
    console.error('[wiki-list] 查询失败:', error);
    return {
      code: 500,
      message: '查询失败: ' + (error.message || '数据库错误'),
      data: { list: [], total: 0, page, pageSize, hasNext: false }
    };
  }
};

