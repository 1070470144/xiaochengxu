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
    
    // 简化方案：不处理图片，直接使用首字母logo
    console.log('[script-generate-preview] 使用首字母logo，无需处理图片')
    const processedJson = parsedJson
    
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
    
    // 简化方案：SVG转base64（但内容很小，因为不包含图片）
    const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64')
    const previewDataUrl = `data:image/svg+xml;base64,${svgBase64}`
    
    console.log(`[预览图生成] SVG大小: ${svgContent.length} 字符，base64大小: ${svgBase64.length} 字符`)
    
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
 * 上传图片到云存储：下载外部图片并上传到云存储，返回云存储URL
 */
async function uploadImagesToCloud(jsonData) {
  if (!Array.isArray(jsonData)) return jsonData
  
  const processedData = []
  let uploadedCount = 0
  const maxUpload = 15  // 限制上传数量
  
  // 优先上传重要角色
  const priorityTeams = ['demon', 'minion', 'townsfolk', 'outsider', 'traveler', 'fabled']
  const sortedData = [...jsonData].sort((a, b) => {
    const aIndex = priorityTeams.indexOf(a.team) 
    const bIndex = priorityTeams.indexOf(b.team)
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })
  
  for (const item of sortedData) {
    if (item.image && typeof item.image === 'string' && item.image.startsWith('http') && uploadedCount < maxUpload) {
      try {
        console.log(`[云存储上传] 上传图片 ${uploadedCount + 1}/${maxUpload}: ${item.name}`)
        
        // 下载图片
        const imageBuffer = await downloadImageAsBuffer(item.image)
        
        // 生成云存储路径
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const ext = item.image.split('.').pop() || 'png'
        const cloudPath = `role-images/${timestamp}-${random}.${ext}`
        
        // 上传到云存储
        const uploadResult = await uniCloud.uploadFile({
          cloudPath: cloudPath,
          fileContent: imageBuffer
        })
        
        if (uploadResult.fileID) {
          // 获取云存储的HTTP访问URL
          const tempUrlRes = await uniCloud.getTempFileURL({
            fileList: [uploadResult.fileID],
            maxAge: 365 * 24 * 60 * 60  // 1年有效期
          })
          
          if (tempUrlRes.fileList && tempUrlRes.fileList.length > 0) {
            const cloudUrl = tempUrlRes.fileList[0].tempFileURL
            
            processedData.push({
              ...item,
              image: cloudUrl,
              originalImage: item.image,
              cloudFileID: uploadResult.fileID
            })
            
            uploadedCount++
            console.log(`[云存储上传] 上传成功: ${item.name} → ${cloudUrl}`)
          } else {
            throw new Error('获取云存储URL失败')
          }
        } else {
          throw new Error('上传到云存储失败')
        }
        
      } catch (error) {
        console.error(`[云存储上传] 上传失败: ${item.name} - ${error.message}`)
        processedData.push(item)  // 保留原始数据
      }
    } else {
      processedData.push(item)
    }
  }
  
  console.log(`[云存储上传] 完成，上传了 ${uploadedCount} 张图片到云存储`)
  return processedData
}

/**
 * 下载图片为Buffer（用于上传到云存储）
 */
function downloadImageAsBuffer(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https:') ? https : http
    
    const timeout = 5000  // 5秒超时
    
    const req = protocol.get(imageUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      
      const chunks = []
      let totalSize = 0
      const maxSize = 500 * 1024  // 限制单个图片最大500KB
      
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
          console.log(`[图片下载] ${imageUrl} 大小: ${buffer.length} bytes`)
          resolve(buffer)
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

