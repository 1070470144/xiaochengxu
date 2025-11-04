'use strict';

/**
 * 剧本预览图自动生成器
 * 基于剧本JSON数据生成漂亮的SVG预览图片
 * 适配uniCloud云函数环境
 */

// 预览图配置
const PREVIEW_CONFIG = {
  width: 520,
  background: {
    gradient: ['#0f172a', '#1e293b', '#334155'],
    bloodTheme: ['#7c2d12', '#991b1b', '#dc2626']
  },
  fonts: {
    title: 'bold 28px serif',
    subtitle: '18px serif',
    info: '14px sans-serif',
    watermark: '12px sans-serif'
  },
  colors: {
    title: '#ffffff',
    subtitle: '#e2e8f0',
    info: '#94a3b8',
    accent: '#f59e0b',
    danger: '#ef4444',
    night: '#8b5cf6'
  },
  layout: {
    nightOrderWidth: 55,
    centerPadding: 4
  }
}

// 角色类型映射
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

/**
 * 提取夜晚行动顺序（过滤旅行者和传奇角色）
 */
function extractNightOrders(characters) {
  const isRegularCharacter = (char) => {
    const team = char.team?.toLowerCase()
    return team !== 'traveler' && team !== 'fabled'
  }
  
  // 首夜行动
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
      reminder: char.firstNightReminder || '',
      image: char.image || '',
      team: char.team
    }))
  
  // 其他夜晚行动
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
      reminder: char.otherNightReminder || '',
      image: char.image || '',
      team: char.team
    }))
  
  return { firstNight, otherNight }
}

/**
 * 从剧本JSON中提取关键信息
 */
function extractScriptInfo(scriptData) {
  const { title, author, json } = scriptData
  
  let characters = []
  const scriptName = title
  const scriptAuthor = author || '未知作者'
  
  if (Array.isArray(json)) {
    // 数组格式
    characters = json.filter((item) => {
      if (item.id === '_meta' || item.id?.includes('_meta')) return false
      if (item.team === 'jinxed' || item.team === 'a jinxed') return false
      return true
    })
  } else if (json && typeof json === 'object') {
    // 对象格式
    characters = json.characters || []
  }
  
  // 提取并分类角色
  const rolesByTeam = {
    townsfolk: [],
    outsider: [],
    minion: [],
    demon: [],
    traveler: [],
    fabled: []
  }
  
  let totalCharacters = 0
  
  if (characters && Array.isArray(characters)) {
    for (const char of characters) {
      totalCharacters++
      const team = char.team
      if (team && rolesByTeam[team]) {
        rolesByTeam[team].push(char)
      } else {
        // 默认归为镇民
        rolesByTeam.townsfolk.push(char)
      }
    }
  }
  
  // 计算玩家数量
  let playerCount = '未知'
  if (!Array.isArray(json) && json?.players) {
    if (typeof json.players === 'number') {
      playerCount = `${json.players}人`
    } else if (json.players.min && json.players.max) {
      playerCount = `${json.players.min}-${json.players.max}人`
    }
  } else if (totalCharacters > 0) {
    const estimatedPlayers = Math.ceil(totalCharacters * 0.8)
    playerCount = `${estimatedPlayers}人左右`
  }
  
  // 计算角色统计
  const roleCounts = Object.entries(rolesByTeam).map(([team, chars]) => ({
    team: team,
    count: chars.length,
    characters: chars
  })).filter(item => item.count > 0)
  
  // 提取难度
  let difficulty = '普通'
  if (!Array.isArray(json) && json?.difficulty) {
    if (typeof json.difficulty === 'string') {
      difficulty = json.difficulty
    } else if (typeof json.difficulty === 'number') {
      const levels = ['简单', '普通', '困难', '专家', '地狱']
      difficulty = levels[Math.min(json.difficulty - 1, levels.length - 1)] || '普通'
    }
  }
  
  // 提取标签和类型
  const tags = (!Array.isArray(json) && json?.tags) ? json.tags.slice(0, 3) : []
  const scriptType = (!Array.isArray(json) && json?.type) ? json.type : (totalCharacters > 15 ? '扩展剧本' : '标准剧本')
  const description = Array.isArray(json) ? '' : (json?.description || '')
  
  // 提取夜晚行动顺序
  const nightOrders = extractNightOrders(characters)
  
  return {
    title: scriptName || '未命名剧本',
    author: scriptAuthor || '未知作者',
    playerCount,
    totalCharacters,
    roleCounts,
    rolesByTeam,
    difficulty,
    scriptType,
    tags,
    description,
    nightOrders
  }
}

/**
 * 将长文本智能分成多行
 */
function splitTextToLines(text, maxLength, maxLines = 5) {
  if (text.length <= maxLength) return [text]
  
  const lines = []
  let remaining = text
  const punctuation = ['。', '，', '；', '：', '！', '？', '.', ',', ';', ':', '!', '?', ' ']
  
  while (remaining.length > 0 && lines.length < maxLines) {
    if (remaining.length <= maxLength) {
      lines.push(remaining)
      break
    }
    
    let cutPoint = maxLength
    for (let i = maxLength; i > maxLength - 5 && i > 0; i--) {
      if (punctuation.includes(remaining[i])) {
        cutPoint = i + 1
        break
      }
    }
    
    const currentLine = remaining.substring(0, cutPoint).trim()
    lines.push(currentLine)
    remaining = remaining.substring(cutPoint).trim()
  }
  
  if (remaining.length > 0 && lines.length === maxLines) {
    const lastLine = lines[lines.length - 1]
    if (lastLine.length > 2) {
      lines[lines.length - 1] = lastLine.substring(0, lastLine.length - 2) + '..'
    }
  }
  
  return lines
}

/**
 * 生成剧本预览SVG图片
 */
function generateScriptPreviewSVG(scriptData) {
  const { width, layout } = PREVIEW_CONFIG
  const info = extractScriptInfo(scriptData)
  
  // 处理标题
  const maxTitleLength = 22
  const displayTitle = info.title.length > maxTitleLength 
    ? info.title.substring(0, maxTitleLength - 2) + '...'
    : info.title
  
  // 按顺序获取有角色的类型
  const teamOrder = ['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled']
  const teamsWithRoles = teamOrder.filter(team => info.rolesByTeam[team].length > 0)
  
  // 计算布局
  const leftNightX = 15
  const centerStartX = leftNightX + layout.nightOrderWidth + layout.centerPadding
  const centerWidth = width - 2 * (layout.nightOrderWidth + layout.centerPadding + 15)
  const rightNightX = width - layout.nightOrderWidth - 15
  
  // 生成角色列表HTML - 两列布局
  const generateRolesList = () => {
    let y = 70
    const roleElements = []
    const columnWidth = (centerWidth - 20) / 2
    const leftColumnX = centerStartX + 10
    const rightColumnX = leftColumnX + columnWidth + 10
    
    for (const team of teamsWithRoles) {
      const roles = info.rolesByTeam[team]
      const teamName = TEAM_NAMES[team]
      const teamEmoji = TEAM_EMOJIS[team]
      const teamColor = team === 'demon' ? '#ef4444' : 
                       team === 'minion' ? '#f97316' : 
                       team === 'outsider' ? '#eab308' : 
                       team === 'townsfolk' ? '#10b981' : 
                       team === 'traveler' ? '#8b5cf6' : '#ec4899'
      
      // 类型标题
      roleElements.push(`
        <rect x="${leftColumnX}" y="${y - 5}" width="${centerWidth - 20}" height="18" fill="${teamColor}" opacity="0.2" rx="4"/>
        <text x="${leftColumnX + 5}" y="${y + 8}" font-size="10" font-weight="bold" fill="${teamColor}">
          ${teamEmoji} ${teamName} (${roles.length}个)
        </text>
      `)
      
      y += 32
      
      let leftColumnHeight = 0
      
      roles.forEach((char, index) => {
        const isLeftColumn = index % 2 === 0
        const currentX = isLeftColumn ? leftColumnX : rightColumnX
        const logoSize = 20
        const logoX = currentX + 12
        const textX = logoX + logoSize + 4
        
        const name = char.name || char.id || '未知'
        const ability = char.ability || char.description || ''
        const initial = name.charAt(0) || '?'
        const imageUrl = char.image || ''  // 获取图片URL
        
        const abilityLines = ability ? splitTextToLines(ability, 19, 5) : []
        const currentHeight = abilityLines.length > 0 ? 20 + (abilityLines.length - 1) * 8 : 14
        
        // Logo - 优先使用图片，图片不可用时使用首字母
        if (imageUrl) {
          // 使用真实图片（SVG image标签 + clipPath裁剪成圆形）
          const clipId = `clip-${char.id || index}-${team}`
          roleElements.push(`
            <defs>
              <clipPath id="${clipId}">
                <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2}"/>
              </clipPath>
            </defs>
            <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2 + 1}" fill="${teamColor}" opacity="0.2"/>
            <image 
              href="${imageUrl}" 
              x="${logoX - logoSize / 2}" 
              y="${y - 3 - logoSize / 2}" 
              width="${logoSize}" 
              height="${logoSize}" 
              clip-path="url(#${clipId})" 
              preserveAspectRatio="xMidYMid slice"
            />
          `)
        } else {
          // 备用：使用首字母
          roleElements.push(`
            <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2 + 1}" fill="${teamColor}" opacity="0.15"/>
            <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2}" fill="${teamColor}" opacity="0.25"/>
            <text x="${logoX}" y="${y + 2}" font-size="11" font-weight="bold" fill="${teamColor}" text-anchor="middle">${initial}</text>
          `)
        }
        
        // 角色名字
        roleElements.push(`
          <text x="${textX}" y="${y}" font-size="8" font-weight="bold" fill="#ffffff">${escapeXml(name)}</text>
        `)
        
        // 角色技能
        abilityLines.forEach((line, lineIndex) => {
          roleElements.push(`
            <text x="${textX}" y="${y + 8 + lineIndex * 8}" font-size="6.5" fill="#94a3b8">${escapeXml(line)}</text>
          `)
        })
        
        if (isLeftColumn) {
          leftColumnHeight = currentHeight
        } else {
          const rowHeight = Math.max(leftColumnHeight, currentHeight)
          y += rowHeight
        }
      })
      
      // 奇数角色处理
      if (roles.length % 2 === 1) {
        const lastChar = roles[roles.length - 1]
        const ability = lastChar.ability || lastChar.description || ''
        const abilityLines = ability ? splitTextToLines(ability, 22, 5) : []
        const rowHeight = abilityLines.length > 0 ? 20 + (abilityLines.length - 1) * 8 : 14
        y += rowHeight
      }
      
      y += 12
    }
    
    return { elements: roleElements.join(''), finalY: y }
  }
  
  const { elements: rolesContent, finalY } = generateRolesList()
  const dynamicHeight = finalY + 40
  
  // 生成夜晚行动顺序
  const generateNightOrders = (totalHeight) => {
    const nightElements = []
    const topMargin = 70
    const bottomMargin = 40
    const availableHeight = totalHeight - topMargin - bottomMargin
    
    const leftCharCount = info.nightOrders.firstNight.length + 2
    const rightCharCount = info.nightOrders.otherNight.length
    const maxCharCount = Math.max(leftCharCount, rightCharCount)
    
    if (maxCharCount === 0) return ''
    
    const minLogoSize = 18
    const maxLogoSize = 26
    const minSpacing = 22
    const maxSpacing = 34
    
    let logoSpacing = availableHeight / maxCharCount
    let logoSize = logoSpacing * 0.7
    
    if (logoSize > maxLogoSize) {
      logoSize = maxLogoSize
      logoSpacing = maxSpacing
    } else if (logoSize < minLogoSize) {
      logoSize = minLogoSize
      logoSpacing = minSpacing
    } else {
      logoSpacing = Math.max(logoSpacing, minSpacing)
    }
    
    const actualContentHeight = maxCharCount * logoSpacing
    const startY = topMargin + (availableHeight - actualContentHeight) / 2
    
    // 左侧：首夜行动
    if (info.nightOrders.firstNight.length > 0) {
      const centerX = leftNightX + layout.nightOrderWidth / 2
      const borderWidth = Math.max(1.5, logoSize / 14)
      const fontSize = Math.max(10, logoSize * 0.5)
      
      // 爪牙互认
      const minionY = startY + logoSize / 2
      nightElements.push(`
        <circle cx="${centerX}" cy="${minionY}" r="${logoSize / 2 + borderWidth}" fill="#f97316" opacity="0.2"/>
        <circle cx="${centerX}" cy="${minionY}" r="${logoSize / 2}" fill="#f97316" opacity="0.15"/>
        <text x="${centerX}" y="${minionY + fontSize * 0.35}" font-size="${fontSize}" font-weight="bold" 
              fill="#f97316" text-anchor="middle">爪</text>
      `)
      
      // 恶魔认识爪牙
      const demonY = minionY + logoSpacing
      nightElements.push(`
        <circle cx="${centerX}" cy="${demonY}" r="${logoSize / 2 + borderWidth}" fill="#ef4444" opacity="0.2"/>
        <circle cx="${centerX}" cy="${demonY}" r="${logoSize / 2}" fill="#ef4444" opacity="0.15"/>
        <text x="${centerX}" y="${demonY + fontSize * 0.35}" font-size="${fontSize}" font-weight="bold" 
              fill="#ef4444" text-anchor="middle">魔</text>
      `)
      
      // 角色logo列表
      info.nightOrders.firstNight.forEach((action, index) => {
        const y = startY + (index + 2) * logoSpacing + logoSize / 2
        const initial = action.name.charAt(0) || '?'
        const charFontSize = Math.max(10, logoSize * 0.4)
        const imageUrl = action.image || ''
        
        if (imageUrl) {
          // 使用角色图片
          const clipId = `clip-first-${index}`
          nightElements.push(`
            <defs>
              <clipPath id="${clipId}">
                <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}"/>
              </clipPath>
            </defs>
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2 + 1}" fill="#8b5cf6" opacity="0.2"/>
            <image 
              href="${imageUrl}" 
              x="${centerX - logoSize / 2}" 
              y="${y - logoSize / 2}" 
              width="${logoSize}" 
              height="${logoSize}" 
              clip-path="url(#${clipId})" 
              preserveAspectRatio="xMidYMid slice"
            />
          `)
        } else {
          // 备用：使用首字母
          nightElements.push(`
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}" fill="#8b5cf6" opacity="0.15"/>
            <text x="${centerX}" y="${y + charFontSize * 0.35}" font-size="${charFontSize}" font-weight="bold" 
                  fill="#8b5cf6" text-anchor="middle">${initial}</text>
          `)
        }
      })
    }
    
    // 右侧：其他夜晚行动
    if (info.nightOrders.otherNight.length > 0) {
      const centerX = rightNightX + layout.nightOrderWidth / 2
      
      info.nightOrders.otherNight.forEach((action, index) => {
        const y = startY + index * logoSpacing + logoSize / 2
        const initial = action.name.charAt(0) || '?'
        const fontSize = Math.max(10, logoSize * 0.4)
        const imageUrl = action.image || ''
        
        if (imageUrl) {
          // 使用角色图片
          const clipId = `clip-other-${index}`
          nightElements.push(`
            <defs>
              <clipPath id="${clipId}">
                <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}"/>
              </clipPath>
            </defs>
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2 + 1}" fill="#8b5cf6" opacity="0.2"/>
            <image 
              href="${imageUrl}" 
              x="${centerX - logoSize / 2}" 
              y="${y - logoSize / 2}" 
              width="${logoSize}" 
              height="${logoSize}" 
              clip-path="url(#${clipId})" 
              preserveAspectRatio="xMidYMid slice"
            />
          `)
        } else {
          // 备用：使用首字母
          nightElements.push(`
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}" fill="#8b5cf6" opacity="0.15"/>
            <text x="${centerX}" y="${y + fontSize * 0.35}" font-size="${fontSize}" font-weight="bold" 
                  fill="#8b5cf6" text-anchor="middle">${initial}</text>
          `)
        }
      })
    }
    
    return nightElements.join('')
  }
  
  const nightOrdersContent = generateNightOrders(dynamicHeight)
  
  // 生成SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${dynamicHeight}" viewBox="0 0 ${width} ${dynamicHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#334155"/>
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1" fill="white" opacity="0.08"/>
    </pattern>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${dynamicHeight}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${dynamicHeight}" fill="url(#dots)"/>
  
  <!-- 边框 -->
  <rect x="10" y="10" width="${width - 20}" height="${dynamicHeight - 20}" 
        fill="none" stroke="#f59e0b" stroke-width="3" rx="8"/>
  
  <!-- 左上角制作者水印 -->
  <text x="20" y="28" font-size="9" fill="#94a3b8" opacity="0.25">
    制作者：萌萌
  </text>
  
  <!-- 标题 -->
  <text x="${width/2}" y="42" font-size="20" font-weight="bold" 
        fill="white" text-anchor="middle">${escapeXml(displayTitle)}</text>
  
  <!-- 作者信息 -->
  <text x="${width/2}" y="60" font-size="11" fill="#94a3b8" text-anchor="middle">
    作者: ${escapeXml(info.author)}
  </text>
  
  <!-- 角色分类列表 -->
  ${rolesContent}
  
  <!-- 夜晚行动顺序 -->
  ${nightOrdersContent}
</svg>`

  return svg
}

/**
 * 转义XML特殊字符
 */
function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 导出函数
module.exports = {
  generateScriptPreviewSVG,
  extractScriptInfo
}

