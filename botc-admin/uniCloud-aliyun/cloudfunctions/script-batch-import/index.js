'use strict';

const { generateScriptPreviewSVG, extractScriptInfo } = require('./preview-generator')

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { scripts } = event
  
  if (!scripts || !Array.isArray(scripts)) {
    return {
      code: 400,
      message: '参数错误：需要提供 scripts 数组'
    }
  }
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  }
  
  for (const script of scripts) {
    try {
      // 生成预览图
      let previewImage = ''
      
      if (script.json_data) {
        try {
          console.log(`[批量导入] 为剧本 ${script.title} 生成预览图...`)
          
          // 解析JSON数据
          let parsedJson = script.json_data
          if (typeof script.json_data === 'string') {
            parsedJson = JSON.parse(script.json_data)
          }
          
          // 构建预览图生成所需的数据
          const scriptData = {
            title: script.title,
            author: script.author || '未知',
            json: parsedJson
          }
          
          // 生成SVG预览图
          const svgContent = generateScriptPreviewSVG(scriptData)
          
          // 转换为base64
          const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64')
          previewImage = `data:image/svg+xml;base64,${svgBase64}`
          
          console.log(`[批量导入] 预览图生成成功`)
        } catch (error) {
          console.error(`[批量导入] 生成预览图失败:`, error)
          // 预览图生成失败不影响导入，继续执行
        }
      }
      
      // 添加预览图到剧本数据
      if (previewImage) {
        script.preview_image = previewImage
      }
      
      // 直接插入数据库
      const res = await db.collection('botc-scripts').add(script)
      
      results.success++
      results.details.push({
        success: true,
        title: script.title,
        id: res.id,
        hasPreview: !!previewImage
      })
      
      console.log(`✅ 导入成功：${script.title}${previewImage ? '（已生成预览图）' : ''}`)
    } catch (error) {
      results.failed++
      results.details.push({
        success: false,
        title: script.title,
        error: error.message
      })
      
      console.error(`❌ 导入失败：${script.title}`, error)
    }
  }
  
  return {
    code: 0,
    message: '批量导入完成',
    data: results
  }
}

