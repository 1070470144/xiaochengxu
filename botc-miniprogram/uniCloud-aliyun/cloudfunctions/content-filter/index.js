'use strict';

/**
 * 内容过滤云函数
 * 用于检查文本内容是否包含敏感词
 */
exports.main = async (event, context) => {
  const { content } = event
  
  if (!content) {
    return {
      code: 400,
      message: '内容不能为空'
    }
  }
  
  const db = uniCloud.database()
  const dbCmd = db.command
  
  try {
    // 获取所有启用的敏感词
    const wordsRes = await db.collection('botc-sensitive-words')
      .where({
        enabled: true
      })
      .get()
    
    const sensitiveWords = wordsRes.data
    
    if (sensitiveWords.length === 0) {
      return {
        code: 0,
        message: '检查通过',
        data: {
          pass: true,
          filteredContent: content
        }
      }
    }
    
    // 检查敏感词
    let filteredContent = content
    let foundWords = []
    
    for (let wordItem of sensitiveWords) {
      const word = wordItem.word
      
      // 检查是否包含敏感词（不区分大小写）
      const regex = new RegExp(word, 'gi')
      
      if (regex.test(filteredContent)) {
        foundWords.push({
          word: word,
          type: wordItem.type
        })
        
        // 如果有替换词，则替换
        if (wordItem.replacement) {
          filteredContent = filteredContent.replace(regex, wordItem.replacement)
        } else {
          // 默认替换为 ***
          filteredContent = filteredContent.replace(regex, '***')
        }
      }
    }
    
    // 如果发现敏感词
    if (foundWords.length > 0) {
      return {
        code: 40001,
        message: '内容包含敏感词，请修改后重试',
        data: {
          pass: false,
          foundWords: foundWords,
          filteredContent: filteredContent
        }
      }
    }
    
    // 额外的规则检查
    // 1. 检查手机号
    const phoneRegex = /1[3-9]\d{9}/g
    if (phoneRegex.test(content)) {
      return {
        code: 40002,
        message: '请勿发布手机号等联系方式',
        data: {
          pass: false,
          reason: 'phone_number'
        }
      }
    }
    
    // 2. 检查QQ号
    const qqRegex = /[1-9]\d{4,10}/g
    const qqKeywords = ['qq', 'QQ', 'q q', 'Q Q', '扣扣', 'ＱＱ']
    for (let keyword of qqKeywords) {
      if (content.includes(keyword) && qqRegex.test(content)) {
        return {
          code: 40002,
          message: '请勿发布QQ等联系方式',
          data: {
            pass: false,
            reason: 'qq_number'
          }
        }
      }
    }
    
    // 3. 检查微信
    const wechatKeywords = ['微信', 'vx', 'VX', 'Vx', 'v信', 'V信', 'wx', 'WX', 'Wx', 'weixin', 'wechat']
    for (let keyword of wechatKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        return {
          code: 40002,
          message: '请勿发布微信等联系方式',
          data: {
            pass: false,
            reason: 'wechat'
          }
        }
      }
    }
    
    // 4. 检查重复字符（刷屏）
    const repeatRegex = /(.)\1{9,}/g
    if (repeatRegex.test(content)) {
      return {
        code: 40003,
        message: '请勿发布重复内容',
        data: {
          pass: false,
          reason: 'repeat_content'
        }
      }
    }
    
    // 通过检查
    return {
      code: 0,
      message: '检查通过',
      data: {
        pass: true,
        filteredContent: content
      }
    }
    
  } catch (error) {
    console.error('内容过滤失败:', error)
    return {
      code: 500,
      message: '内容检查失败'
    }
  }
}

