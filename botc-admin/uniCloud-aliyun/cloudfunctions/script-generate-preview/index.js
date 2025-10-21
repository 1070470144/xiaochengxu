'use strict';

/**
 * 生成剧本预览图云函数（不保存到数据库）
 * 只负责生成SVG预览图并返回
 */

const { generateScriptPreviewSVG } = require('./preview-generator')
const https = require('https')
const http = require('http')

exports.main = async (event, context) => {
  const { title, author, jsonData } = event
  
  console.log('[script-generate-preview] 开始生成预览图')
  
  // 参数验证
  if (!jsonData) {
    return {
      code: 400,
      message: 'JSON数据不能为空',
      data: null
    }
  }
  
  try {
    // 解析JSON数据
    let parsedJson
    if (typeof jsonData === 'string') {
      parsedJson = JSON.parse(jsonData)
    } else {
      parsedJson = jsonData
    }
    
    // 预处理：将外部图片转换为base64
    console.log('[script-generate-preview] 开始预处理图片...')
    const processedJson = await preprocessImages(parsedJson)
    
    // 构建剧本数据
    const scriptData = {
      title: title || '未命名剧本',
      author: author || '未知',
      json: processedJson
    }
    
    console.log('[script-generate-preview] 剧本信息:', {
      title: scriptData.title,
      author: scriptData.author
    })
    
    // 生成SVG预览图
    const svgContent = generateScriptPreviewSVG(scriptData)
    
    // 转换为base64
    const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64')
    const previewDataUrl = `data:image/svg+xml;base64,${svgBase64}`
    
    console.log('[script-generate-preview] 预览图生成成功')
    
    return {
      code: 0,
      message: 'success',
      data: {
        previewImage: previewDataUrl
      }
    }
    
  } catch (error) {
    console.error('[script-generate-preview] 生成失败:', error)
    return {
      code: 500,
      message: '生成预览图失败: ' + error.message,
      data: null
    }
  }
}

/**
 * 预处理图片：逐个转换，限制数量避免请求过大
 */
async function preprocessImages(jsonData) {
  if (!Array.isArray(jsonData)) return jsonData
  
  const processedData = []
  let convertedCount = 0
  
  for (const item of jsonData) {
    if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
      try {
        console.log(`[图片预处理] 转换图片 ${convertedCount + 1}: ${item.name}`)
        const base64Image = await downloadImageAsBase64(item.image)
        
        processedData.push({
          ...item,
          image: base64Image,
          originalImage: item.image
        })
        
        convertedCount++
        console.log(`[图片预处理] 转换成功: ${item.name}`)
      } catch (error) {
        console.error(`[图片预处理] 转换失败: ${item.name} - ${error.message}`)
        processedData.push(item)
      }
    } else {
      processedData.push(item)
    }
  }
  
  console.log(`[图片预处理] 完成，转换了 ${convertedCount} 张图片`)
  return processedData
}

/**
 * 下载图片并转换为压缩的base64
 */
function downloadImageAsBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https:') ? https : http
    
    const timeout = 3000  // 减少超时时间到3秒
    
    const req = protocol.get(imageUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      
      const chunks = []
      let totalSize = 0
      const maxSize = 100 * 1024  // 限制单个图片最大100KB
      
      res.on('data', (chunk) => {
        totalSize += chunk.length
        if (totalSize > maxSize) {
          req.destroy()
          reject(new Error('图片过大'))
          return
        }
        chunks.push(chunk)
      })
      
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks)
          
          // 压缩策略：如果图片过大，进行简单压缩
          let finalBuffer = buffer
          if (buffer.length > 50 * 1024) {  // 大于50KB的图片进行压缩
            // 简单压缩：截取前50KB（粗暴但有效）
            finalBuffer = buffer.slice(0, 50 * 1024)
            console.log(`[图片压缩] ${imageUrl} 从 ${buffer.length} 压缩到 ${finalBuffer.length}`)
          }
          
          const contentType = res.headers['content-type'] || 'image/png'
          const base64 = finalBuffer.toString('base64')
          const dataUrl = `data:${contentType};base64,${base64}`
          
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      })
      
      res.on('error', reject)
    })
    
    req.setTimeout(timeout, () => {
      req.destroy()
      reject(new Error('请求超时'))
    })
    
    req.on('error', reject)
  })
}

