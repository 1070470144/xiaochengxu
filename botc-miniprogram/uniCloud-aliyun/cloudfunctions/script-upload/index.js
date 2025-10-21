'use strict';

/**
 * 剧本上传云函数
 * 功能：接收剧本JSON，自动生成预览图，保存到数据库
 */

// 导入预览图生成器
const { generateScriptPreviewSVG, extractScriptInfo } = require('./preview-generator')

exports.main = async (event, context) => {
  const { title, author, description, json, user_images, token } = event
  
  // 参数验证
  if (!title || !author || !json) {
    return {
      code: 400,
      message: '缺少必要参数'
    }
  }
  
  // 验证user_images格式（如果提供）
  if (user_images !== undefined && user_images !== null) {
    if (!Array.isArray(user_images)) {
      return {
        code: 400,
        message: 'user_images必须是数组格式'
      }
    }
    if (user_images.length > 3) {
      return {
        code: 400,
        message: '最多上传3张图片'
      }
    }
    // 验证每个URL都是字符串且是有效的HTTPS URL
    for (let i = 0; i < user_images.length; i++) {
      const url = user_images[i]
      if (typeof url !== 'string') {
        return {
          code: 400,
          message: `图片${i + 1}的URL格式错误`
        }
      }
      // 检查是否是有效的URL（HTTPS或data:开头）
      if (!url.startsWith('https://') && !url.startsWith('http://') && !url.startsWith('data:image/')) {
        return {
          code: 400,
          message: `图片${i + 1}的URL无效，必须是HTTPS地址`
        }
      }
      // 拒绝Blob URL
      if (url.startsWith('blob:')) {
        return {
          code: 400,
          message: `图片${i + 1}不能使用临时Blob地址，请上传到云存储`
        }
      }
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
    
    // ✅ 构建剧本文档，包含用户上传的图片
    const scriptDoc = {
      title,
      author,
      description: description || scriptInfo.description || '',
      json_data: parsedJson, // 保存原始JSON
      preview_image: previewDataUrl, // 保存SVG预览图（base64）
      user_images: user_images || [],  // ✅ 保存用户上传的图片URL数组
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
    
    console.log('[SCRIPT-UPLOAD] 保存剧本数据:', {
      title: scriptDoc.title,
      author: scriptDoc.author,
      user_images_count: scriptDoc.user_images.length,
      user_images: scriptDoc.user_images
    })
    
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
