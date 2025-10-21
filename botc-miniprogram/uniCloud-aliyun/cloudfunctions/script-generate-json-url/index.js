'use strict';

/**
 * 剧本JSON获取云函数（支持CORS）
 * 功能：
 * 1. HTTP访问：直接返回JSON内容 + CORS响应头（用于第三方工具）
 * 2. 云函数调用：生成临时访问链接（用于小程序内部）
 */

exports.main = async (event, context) => {
  console.log('[script-generate-json-url] 收到请求，event:', JSON.stringify(event))
  console.log('[script-generate-json-url] context.SOURCE:', context.SOURCE)
  
  // 判断是否为HTTP请求
  const isHttpRequest = context.SOURCE === 'http' || event.httpMethod
  
  // 获取scriptId（支持多种传参方式）
  const scriptId = event.scriptId || 
                   (event.queryStringParameters && event.queryStringParameters.scriptId) ||
                   (event.query && event.query.scriptId)
  
  console.log('[script-generate-json-url] 请求类型:', isHttpRequest ? 'HTTP' : '云函数')
  console.log('[script-generate-json-url] 剧本ID:', scriptId)
  
  // 参数验证
  if (!scriptId) {
    if (isHttpRequest) {
      return {
        mpserverlessComposedResponse: true,
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '缺少scriptId参数' })
      }
    }
    return {
      code: 400,
      message: '剧本ID不能为空',
      data: null
    }
  }
  
  const db = uniCloud.database()
  
  try {
    // 查询剧本数据
    const scriptRes = await db.collection('botc-scripts')
      .doc(scriptId)
      .field({
        title: true,
        json_data: true,
        json_url: true,
        status: true
      })
      .get()
    
    if (!scriptRes.data || scriptRes.data.length === 0) {
      if (isHttpRequest) {
        return {
          mpserverlessComposedResponse: true,
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: '剧本不存在' })
        }
      }
      return {
        code: 404,
        message: '剧本不存在',
        data: null
      }
    }
    
    const script = scriptRes.data[0]
    
    // 检查剧本状态（只允许访问已发布的剧本）
    if (script.status !== 1 && isHttpRequest) {
      return {
        mpserverlessComposedResponse: true,
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '该剧本暂未发布' })
      }
    }
    
    // 检查JSON数据
    if (!script.json_data) {
      if (isHttpRequest) {
        return {
          mpserverlessComposedResponse: true,
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: '该剧本暂无JSON数据' })
        }
      }
      return {
        code: 400,
        message: '该剧本暂无JSON数据',
        data: null
      }
    }
    
    // 如果是HTTP请求，直接返回JSON内容（支持CORS）
    if (isHttpRequest) {
      console.log('[script-generate-json-url] HTTP请求，处理JSON格式')
      
      // 转换JSON格式为血染工具需要的格式
      let outputJson = script.json_data
      
      // 检查是否需要转换格式
      if (script.json_data && !Array.isArray(script.json_data)) {
        console.log('[script-generate-json-url] 检测到对象格式，转换为数组格式')
        
        // 如果json_data包含meta和_roles字段，转换为数组格式
        if (script.json_data.meta || script.json_data._roles) {
          const roles = []
          
          // 添加meta信息（如果有）
          if (script.json_data.meta && Array.isArray(script.json_data.meta)) {
            roles.push(...script.json_data.meta)
          } else if (script.json_data.meta) {
            roles.push(script.json_data.meta)
          }
          
          // 添加角色信息（如果有）
          if (script.json_data._roles && Array.isArray(script.json_data._roles)) {
            roles.push(...script.json_data._roles)
          }
          
          outputJson = roles
          console.log('[script-generate-json-url] 转换完成，角色数量:', roles.length)
        }
      }
      
      return {
        mpserverlessComposedResponse: true,
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600'
        },
        body: JSON.stringify(outputJson, null, 2)
      }
    }
    
    // 如果是云函数调用，返回云函数自己的URL（支持HTTP访问）
    // 需要在云函数开启URL化后才有效
    const cloudFunctionUrl = `https://fc-mp-1e0f6630-18c8-400c-99ff-761aea3a4e83.next.bspapp.com/script-generate-json-url?scriptId=${scriptId}`
    
    console.log('[script-generate-json-url] 返回云函数URL:', cloudFunctionUrl)
    
    return {
      code: 0,
      message: 'success',
      data: {
        url: cloudFunctionUrl,
        type: 'cloud_function',
        cors: true // 支持CORS
      }
    }
    
  } catch (error) {
    console.error('[script-generate-json-url] 处理失败:', error)
    
    if (isHttpRequest) {
      return {
        mpserverlessComposedResponse: true,
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '服务器错误: ' + error.message })
      }
    }
    
    return {
      code: 500,
      message: '生成链接失败: ' + error.message,
      data: null
    }
  }
}
