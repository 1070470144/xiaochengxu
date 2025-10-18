'use strict';

exports.main = async (event, context) => {
  console.log('[wiki-categories] 查询分类统计');
  
  const db = uniCloud.database();
  
  try {
    const stats = { role: 0, script: 0, rule: 0, guide: 0, term: 0, total: 0 };
    const types = ['role', 'script', 'rule', 'guide', 'term'];
    
    for (const type of types) {
      const res = await db.collection('wiki_entries')
        .where({ entry_type: type, status: 1 })
        .count();
      
      stats[type] = res.total;
      stats.total += res.total;
    }
    
    console.log('[wiki-categories] 统计完成:', stats);
    
    return {
      code: 0,
      message: '查询成功',
      data: stats
    };
  } catch (error) {
    console.error('[wiki-categories] 查询失败:', error);
    return {
      code: 500,
      message: '查询失败',
      data: { role: 0, script: 0, rule: 0, guide: 0, term: 0, total: 0 }
    };
  }
};

