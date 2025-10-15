'use strict';

/**
 * 剧本上传云函数
 * 功能：接收剧本JSON，自动生成预览图，保存到数据库
 */

// 导入预览图生成器
const { generateScriptPreviewSVG, extractScriptInfo } = require('./preview-generator')

exports.main = async (event, context) => {
  const { title, author, description, json, token } = event
  
  // 参数验证
  if (!title || !author || !json) {
    return {
      code: 400,
      message: '缺少必要参数'
    }
  }
  
  // 解析JSON
  let parsedJson
  try {
    parsedJson = typeof json === 'string' ? JSON.parse(json) : json
  } catch (error) {
    return {
      code: 400,
      message: 'JSON格式错误'
    }
  }
  
  // 验证token并获取用户ID（参考项目现有方式）
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const userId = token.split('_')[0]
  
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  try {
    // 生成剧本预览图SVG
    const scriptData = {
      id: generateScriptId(),
      title,
      author,
      json: parsedJson
    }
    
    console.log('[SCRIPT-UPLOAD] Generating preview for:', title)
    const svgContent = generateScriptPreviewSVG(scriptData)
    
    // 将SVG转为base64（用于存储）
    const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64')
    const previewDataUrl = `data:image/svg+xml;base64,${svgBase64}`
    
    // 提取剧本信息用于展示
    const scriptInfo = extractScriptInfo(scriptData)
    
    // 保存到数据库
    const db = uniCloud.database()
    const scriptsCollection = db.collection('botc-scripts')
    
    const scriptDoc = {
      title,
      author,
      description: description || scriptInfo.description || '',
      json_data: parsedJson, // 保存原始JSON
      preview_image: previewDataUrl, // 保存SVG预览图（base64）
      player_count: scriptInfo.playerCount,
      total_characters: scriptInfo.totalCharacters,
      difficulty: scriptInfo.difficulty,
      script_type: scriptInfo.scriptType,
      tags: scriptInfo.tags || [],
      creator_id: userId,
      status: 0, // 0-待审核
      view_count: 0,
      download_count: 0,
      favorite_count: 0,
      comment_count: 0,
      rating: 0,
      rating_count: 0,
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const insertRes = await scriptsCollection.add(scriptDoc)
    
    console.log('[SCRIPT-UPLOAD] Script saved:', insertRes.id)
    
    return {
      code: 0,
      message: '上传成功',
      data: {
        scriptId: insertRes.id,
        previewGenerated: true,
        previewImage: previewDataUrl  // 返回预览图URL
      }
    }
  } catch (error) {
    console.error('[SCRIPT-UPLOAD] Error:', error)
    return {
      code: 500,
      message: '上传失败：' + error.message
    }
  }
}

// 生成唯一的剧本ID
function generateScriptId() {
  return 'script_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
}
