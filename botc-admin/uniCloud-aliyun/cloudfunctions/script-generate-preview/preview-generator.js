'use strict';

/**
 * 剧本预览图生成器（修复版）
 */

const TEAM_NAMES = {
  townsfolk: '镇民',
  outsider: '外来者',
  minion: '爪牙',
  demon: '恶魔',
  traveler: '旅行者',
  fabled: '传奇角色'
}

const TEAM_EMOJIS = {
  townsfolk: '👥',
  outsider: '🏃',
  minion: '🗡️',
  demon: '😈',
  traveler: '🧳',
  fabled: '⭐'
}

function extractNightOrders(characters) {
  const isRegularCharacter = (char) => {
    const team = char.team?.toLowerCase()
    return team !== 'traveler' && team !== 'fabled'
  }
  
  const firstNight = characters
    .filter(char => 
      typeof char.firstNight === 'number' && 
      char.firstNight > 0 && 
      isRegularCharacter(char)
    )
    .sort((a, b) => (a.firstNight || 0) - (b.firstNight || 0))
    .map(char => ({
      name: char.name || char.id || '未知',
      order: char.firstNight,
      image: char.image || '',
      team: char.team
    }))
  
  const otherNight = characters
    .filter(char => 
      typeof char.otherNight === 'number' && 
      char.otherNight > 0 && 
      isRegularCharacter(char)
    )
    .sort((a, b) => (a.otherNight || 0) - (b.otherNight || 0))
    .map(char => ({
      name: char.name || char.id || '未知',
      order: char.otherNight,
      image: char.image || '',
      team: char.team
    }))
  
  return { firstNight, otherNight }
}

function extractScriptInfo(scriptData) {
  const { title, author, json } = scriptData
  
  let characters = []
  
  if (Array.isArray(json)) {
    characters = json.filter((item) => {
      if (item.id === '_meta' || item.id?.includes('_meta')) return false
      if (item.team === 'jinxed' || item.team === 'a jinxed') return false
      return true
    })
  } else if (json && typeof json === 'object') {
    characters = json.characters || []
  }
  
  const rolesByTeam = {
    townsfolk: [],
    outsider: [],
    minion: [],
    demon: [],
    traveler: [],
    fabled: []
  }
  
  for (const char of characters) {
    const team = char.team
    if (team && rolesByTeam[team]) {
      rolesByTeam[team].push(char)
    }
  }
  
  const nightOrders = extractNightOrders(characters)
  
  return {
    title: title || '未命名剧本',
    author: author || '未知作者',
    rolesByTeam,
    nightOrders
  }
}

function generateNightOrders(info, totalHeight) {
  const nightElements = []
  const leftNightX = 15
  const rightNightX = 460  // 左移到边框内（从480改为460）
  const logoSize = 18  // 缩小夜晚行动的logo
  
  console.log(`[夜晚行动] 首夜角色数: ${info.nightOrders.firstNight.length}, 其他夜晚: ${info.nightOrders.otherNight.length}`)
  
  // 左侧：首夜行动
  if (info.nightOrders.firstNight.length > 0) {
    const centerX = leftNightX + 20  // 稍微右移
    let startY = 100
    
    // 爪牙互认
    nightElements.push(`
      <circle cx="${centerX}" cy="${startY}" r="${logoSize / 2}" fill="#f97316" opacity="0.8"/>
      <text x="${centerX}" y="${startY + 4}" font-size="12" font-weight="bold" fill="white" text-anchor="middle">爪</text>
    `)
    startY += 35
    
    // 恶魔认识爪牙
    nightElements.push(`
      <circle cx="${centerX}" cy="${startY}" r="${logoSize / 2}" fill="#ef4444" opacity="0.8"/>
      <text x="${centerX}" y="${startY + 4}" font-size="12" font-weight="bold" fill="white" text-anchor="middle">魔</text>
    `)
    startY += 35
    
    // 首夜角色（显示首字母logo）
    info.nightOrders.firstNight.forEach((action, index) => {
      const y = startY + index * 30
      const initial = action.name.charAt(0) || '?'
      
      nightElements.push(`
        <circle cx="${centerX}" cy="${y}" r="${logoSize / 2 + 1}" fill="white" opacity="0.9"/>
        <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}" fill="#8b5cf6" opacity="0.8"/>
        <text x="${centerX}" y="${y + 4}" font-size="12" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
      `)
    })
  }
  
  // 右侧：其他夜晚行动
  if (info.nightOrders.otherNight.length > 0) {
    const centerX = rightNightX + 15  // 进一步左移（从20改为15）
    let startY = 100
    
    // 其他夜晚角色（显示首字母logo）
    info.nightOrders.otherNight.forEach((action, index) => {
      const y = startY + index * 35  // 增加间距，避免重叠
      const initial = action.name.charAt(0) || '?'
      
      nightElements.push(`
        <circle cx="${centerX}" cy="${y}" r="${logoSize / 2 + 1}" fill="white" opacity="0.9"/>
        <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}" fill="#8b5cf6" opacity="0.8"/>
        <text x="${centerX}" y="${y + 3}" font-size="10" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
      `)
    })
  }
  
  return nightElements
}

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function splitTextToLines(text, maxLength) {
  if (!text || text.length <= maxLength) return [text]
  
  const lines = []
  let remaining = text
  const punctuation = ['。', '，', '；', '：', '！', '？', '.', ',', ';', ':', '!', '?', ' ']
  
  while (remaining.length > 0 && lines.length < 5) {
    if (remaining.length <= maxLength) {
      lines.push(remaining)
      break
    }
    
    // 智能断句：优先在标点符号处断开
    let cutPoint = maxLength
    for (let i = maxLength; i > maxLength - 8 && i > 0; i--) {
      if (punctuation.includes(remaining[i])) {
        cutPoint = i + 1
        break
      }
    }
    
    const currentLine = remaining.substring(0, cutPoint).trim()
    lines.push(currentLine)
    remaining = remaining.substring(cutPoint).trim()
  }
  
  return lines
}

function generateScriptPreviewSVG(scriptData) {
  const width = 520
  const info = extractScriptInfo(scriptData)
  
  console.log('[预览图生成] 开始生成SVG，角色分类:', Object.keys(info.rolesByTeam).map(team => `${team}:${info.rolesByTeam[team].length}`))
  
  const displayTitle = info.title.length > 22 
    ? info.title.substring(0, 20) + '...'
    : info.title
  
  const teamOrder = ['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled']
  const teamsWithRoles = teamOrder.filter(team => info.rolesByTeam[team].length > 0)
  
  let y = 80  // 起始Y位置
  const svgElements = []
  
  // 生成每个队伍的角色
  for (const team of teamsWithRoles) {
    const roles = info.rolesByTeam[team]
    const teamName = TEAM_NAMES[team]
    const teamEmoji = TEAM_EMOJIS[team]
    const teamColor = team === 'demon' ? '#ef4444' : 
                     team === 'minion' ? '#f97316' : 
                     team === 'outsider' ? '#eab308' : 
                     team === 'townsfolk' ? '#10b981' : 
                     team === 'traveler' ? '#8b5cf6' : '#ec4899'
    
    console.log(`[预览图生成] 处理队伍 ${team}，角色数量: ${roles.length}`)
    
    // 队伍标题
    const titleWidth = 360  // 标题宽度
    svgElements.push(`
      <rect x="80" y="${y - 5}" width="${titleWidth}" height="18" fill="${teamColor}" opacity="0.2" rx="4"/>
      <text x="85" y="${y + 8}" font-size="10" font-weight="bold" fill="${teamColor}">
        ${teamEmoji} ${teamName} (${roles.length}个)
      </text>
    `)
    
    y += 40  // 增加队伍标题与角色的间距
    
    // 生成角色（两列布局）
    roles.forEach((char, index) => {
      const isLeftColumn = index % 2 === 0
      const logoX = isLeftColumn ? 90 : 280  // 收缩列间距：右列从340移到280
      const textX = logoX + 30  // 文字距离
      const currentY = y + Math.floor(index / 2) * 50  // 行高50px
      
      const name = char.name || char.id || '未知'
      const ability = char.ability || char.description || ''
      const initial = name.charAt(0) || '?'
      const imageUrl = char.image || ''
      
      console.log(`[预览图生成] 角色 ${name} 坐标: (${logoX}, ${currentY})`)
      
      // 缩小角色logo，避免与夜晚行动顺序重叠
      const logoSize = 22  // 从28缩小到22
      console.log(`[预览图生成] 角色 ${name} 使用首字母logo: ${initial}`)
      
      svgElements.push(`
        <!-- ${name} 的精美首字母logo -->
        <circle cx="${logoX}" cy="${currentY}" r="${logoSize / 2 + 2}" fill="white" opacity="0.95"/>
        <circle cx="${logoX}" cy="${currentY}" r="${logoSize / 2}" fill="${teamColor}" opacity="0.9"/>
        <circle cx="${logoX}" cy="${currentY}" r="${logoSize / 2 - 2}" fill="${teamColor}" opacity="0.6"/>
        <text x="${logoX}" y="${currentY + 4}" font-size="14" font-weight="bold" fill="white" text-anchor="middle" 
              style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8)">${initial}</text>
      `)
      
      // 角色名称（增大字体）
      svgElements.push(`
        <text x="${textX}" y="${currentY - 8}" font-size="11" font-weight="bold" fill="#ffffff">${escapeXml(name)}</text>
      `)
      
      // 角色能力（统一左右列宽度，尽量长但不超出标题）
      // 标题宽度360px，左右各180px可用，去掉logo(30px)和间距(10px)，剩余140px
      const maxLineWidth = 135  // 统一宽度：135px（左右列一致）
      const abilityLines = splitTextToLines(ability, 17)  // 统一字符数：17字符/行
      const maxLines = 3  // 3行显示
      
      abilityLines.slice(0, maxLines).forEach((line, lineIndex) => {
        svgElements.push(`
          <text x="${textX}" y="${currentY + 2 + lineIndex * 10}" font-size="8" fill="#94a3b8">${escapeXml(line)}</text>
        `)
      })
      
      // 如果超过3行，显示省略号
      if (abilityLines.length > maxLines) {
        svgElements.push(`
          <text x="${textX}" y="${currentY + 2 + maxLines * 10}" font-size="8" fill="#94a3b8">...</text>
        `)
      }
    })
    
    // 更新Y坐标到下一个队伍（增加间距，为更多文字行留空间）
    y += Math.ceil(roles.length / 2) * 50 + 25  // 增加行高和队伍间距
  }
  
  const dynamicHeight = y + 100  // 为夜晚行动顺序留出空间
  
  // 添加夜晚行动顺序
  const nightOrderElements = generateNightOrders(info, dynamicHeight)
  svgElements.push(...nightOrderElements)
  
  console.log(`[预览图生成] SVG尺寸: ${width}x${dynamicHeight}，元素数量: ${svgElements.length}`)
  
  // 生成最终SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${dynamicHeight}" viewBox="0 0 ${width} ${dynamicHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#334155"/>
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${dynamicHeight}" fill="url(#bgGrad)"/>
  
  <!-- 边框 -->
  <rect x="10" y="10" width="${width - 20}" height="${dynamicHeight - 20}" 
        fill="none" stroke="#f59e0b" stroke-width="3" rx="8"/>
  
  <!-- 标题 -->
  <text x="${width/2}" y="35" font-size="20" font-weight="bold" 
        fill="white" text-anchor="middle">${escapeXml(displayTitle)}</text>
  
  <!-- 作者信息 -->
  <text x="${width/2}" y="55" font-size="11" fill="#94a3b8" text-anchor="middle">
    作者: ${escapeXml(info.author)}
  </text>
  
  <!-- 角色内容 -->
  ${svgElements.join('')}
</svg>`

  console.log('[预览图生成] SVG生成完成')
  return svg
}

module.exports = {
  generateScriptPreviewSVG,
  extractScriptInfo
}