'use strict';

/**
 * 云函数：获取剧本JSON内容（URL化访问）
 * 支持通过HTTP直接访问，在浏览器中显示JSON而不是下载
 */
exports.main = async (event, context) => {
  console.log('[script-json-get] 收到请求，event:', event);
  console.log('[script-json-get] context:', context);
  
  // 兼容不同的参数传递方式
  const script_id = event.script_id || event.scriptId || event.id;
  
  if (!script_id) {
    return {
      mpserverlessComposedResponse: true,
      statusCode: 400,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Missing script_id parameter',
        received: event 
      }, null, 2)
    };
  }
  
  const db = uniCloud.database();
  
  try {
    console.log('[script-json-get] 查询剧本ID:', script_id);
    
    // 查询剧本数据
    const res = await db.collection('opendb-botc-scripts')
      .doc(script_id)
      .field({
        json_data: true,
        title: true
      })
      .get();
    
    console.log('[script-json-get] 查询结果:', res);
    
    if (!res.data || res.data.length === 0) {
      return {
        mpserverlessComposedResponse: true,
        statusCode: 404,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*'
        },
        body: JSON.stringify({ error: 'Script not found', id: script_id }, null, 2)
      };
    }
    
    const script = res.data[0];
    
    if (!script.json_data) {
      return {
        mpserverlessComposedResponse: true,
        statusCode: 404,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*'
        },
        body: JSON.stringify({ error: 'JSON data not found' }, null, 2)
      };
    }
    
    console.log('[script-json-get] ✓ 成功获取JSON数据');
    
    // 返回JSON内容
    // 关键：Content-Disposition设为inline让浏览器直接显示
    return {
      mpserverlessComposedResponse: true,
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'inline',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=3600'
      },
      body: JSON.stringify(script.json_data, null, 2)
    };
  } catch (error) {
    console.error('[script-json-get] 错误:', error);
    return {
      mpserverlessComposedResponse: true,
      statusCode: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*'
      },
      body: JSON.stringify({ error: error.message, stack: error.stack }, null, 2)
    };
  }
};

