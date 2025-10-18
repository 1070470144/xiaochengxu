'use strict';

const cheerio = require('cheerio');

exports.main = async (event, context) => {
  const { url, force_refresh = false } = event;
  
  console.log('[wiki-parse] 开始解析:', url);
  
  // 1. 验证URL
  if (!url) {
    return {
      code: 400,
      message: '缺少URL参数'
    };
  }
  
  if (!url.includes('clocktower-wiki.gstonegames.com')) {
    return {
      code: 400,
      message: '请输入钟楼百科的页面链接'
    };
  }
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  // 2. 检查缓存（除非强制刷新）
  if (!force_refresh) {
    try {
      const cached = await db.collection('wiki_entries')
        .where({
          source_url: url,
          cache_expires_at: dbCmd.gte(new Date())
        })
        .limit(1)
        .get();
      
      if (cached.data && cached.data.length > 0) {
        console.log('[wiki-parse] 返回缓存数据');
        return {
          code: 0,
          message: '加载成功（缓存）',
          data: cached.data[0],
          from_cache: true
        };
      }
    } catch (err) {
      console.error('[wiki-parse] 缓存查询失败:', err);
    }
  }
  
  // 3. 抓取网页内容
  let html;
  try {
    console.log('[wiki-parse] 开始抓取网页...');
    const response = await uniCloud.httpclient.request(url, {
      method: 'GET',
      timeout: 15000,
      dataType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BOTCMiniProgram/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    });
    
    if (response.status !== 200) {
      throw new Error('网页加载失败，状态码: ' + response.status);
    }
    
    html = response.data;
    console.log('[wiki-parse] 网页抓取成功');
  } catch (error) {
    console.error('[wiki-parse] 抓取失败:', error);
    return {
      code: 500,
      message: '网页加载失败: ' + (error.message || '网络错误')
    };
  }
  
  // 4. 解析HTML内容
  let parsedData;
  try {
    console.log('[wiki-parse] 开始解析HTML...');
    parsedData = parseMediaWikiPage(html, url);
    console.log('[wiki-parse] HTML解析成功');
  } catch (error) {
    console.error('[wiki-parse] 解析失败:', error);
    return {
      code: 500,
      message: '内容解析失败: ' + (error.message || '解析错误')
    };
  }
  
  // 5. 保存到数据库
  try {
    // 设置缓存过期时间：7天后
    parsedData.cache_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    parsedData.created_at = new Date();
    parsedData.updated_at = new Date();
    
    // 初始化统计数据
    if (!parsedData.stats) {
      parsedData.stats = {
        view_count: 0,
        search_count: 0,
        favorite_count: 0
      };
    }
    
    // 检查是否已存在
    const existing = await db.collection('wiki_entries')
      .where({ source_url: url })
      .limit(1)
      .get();
    
    if (existing.data && existing.data.length > 0) {
      // 更新现有记录
      const existingStats = existing.data[0].stats || {};
      parsedData.stats = existingStats; // 保留原有统计数据
      
      await db.collection('wiki_entries')
        .doc(existing.data[0]._id)
        .update(parsedData);
      
      parsedData._id = existing.data[0]._id;
      console.log('[wiki-parse] 更新现有词条');
    } else {
      // 插入新记录
      const result = await db.collection('wiki_entries').add(parsedData);
      parsedData._id = result.id;
      console.log('[wiki-parse] 插入新词条');
    }
  } catch (error) {
    console.error('[wiki-parse] 数据库操作失败:', error);
    // 即使保存失败，也返回解析的数据
    parsedData._id = 'temp_' + Date.now();
  }
  
  // 6. 增加用户经验值（如果用户已登录）
  if (event.userId) {
    try {
      await uniCloud.callFunction({
        name: 'user-add-exp',
        data: {
          userId: event.userId,
          expType: 'VIEW_WIKI',
          amount: 2
        }
      });
    } catch (err) {
      console.error('[wiki-parse] 增加经验值失败:', err);
    }
  }
  
  console.log('[wiki-parse] 解析完成');
  return {
    code: 0,
    message: '解析成功',
    data: parsedData,
    from_cache: false
  };
};

/**
 * 解析 MediaWiki 页面（钟楼百科）
 */
function parseMediaWikiPage(html, url) {
  const $ = cheerio.load(html);
  
  // 提取页面标题
  const title = $('#firstHeading').text().trim() || $('h1').first().text().trim();
  
  if (!title) {
    throw new Error('无法提取页面标题');
  }
  
  // 提取主要内容
  const $content = $('#mw-content-text .mw-parser-output');
  
  if ($content.length === 0) {
    throw new Error('无法找到页面内容');
  }
  
  // 移除不需要的元素
  $content.find('.toc, .navbox, .navigation, #toc, script, style, .printfooter').remove();
  
  // 提取纯文本
  const contentText = $content.text()
    .replace(/\s+/g, ' ')
    .replace(/\[编辑\]/g, '')
    .trim();
  
  // 提取结构化段落
  const sections = [];
  $content.children('h2, h3, h4').each((i, elem) => {
    const $heading = $(elem);
    const headingText = $heading.find('.mw-headline').text().trim() || $heading.text().trim();
    const level = parseInt(elem.name.substring(1));
    
    // 获取该标题下的内容
    let sectionContent = '';
    $heading.nextUntil('h2, h3, h4').each((j, contentElem) => {
      const text = $(contentElem).text().trim();
      if (text) {
        sectionContent += text + '\n';
      }
    });
    
    if (headingText && sectionContent) {
      sections.push({
        heading: headingText,
        content: sectionContent.trim(),
        level
      });
    }
  });
  
  // 提取图片
  const images = [];
  $content.find('img').each((i, elem) => {
    let src = $(elem).attr('src') || $(elem).attr('data-src');
    if (src && !src.includes('icon') && !src.includes('logo')) {
      // MediaWiki 图片通常是相对路径
      if (!src.startsWith('http')) {
        src = 'https://clocktower-wiki.gstonegames.com' + src;
      }
      images.push(src);
    }
  });
  
  // 提取信息框（角色专用）
  const roleInfo = extractRoleInfobox($, $content);
  
  // 判断词条类型
  const entryType = detectEntryType(title, contentText, roleInfo);
  
  // 提取分类标签
  const tags = [];
  $('#mw-normal-catlinks ul li').each((i, elem) => {
    const tag = $(elem).text().trim();
    if (tag) tags.push(tag);
  });
  
  // 提取相关链接
  const relatedLinks = [];
  $content.find('a[href^="/index.php"]').each((i, elem) => {
    const linkText = $(elem).text().trim();
    const linkHref = $(elem).attr('href');
    if (linkText && linkHref && !linkHref.includes('action=')) {
      relatedLinks.push({
        text: linkText,
        url: 'https://clocktower-wiki.gstonegames.com' + linkHref
      });
    }
  });
  
  return {
    entry_type: entryType,
    title: title,
    source_url: url,
    source_type: 'official_wiki_cn',
    source_name: '钟楼百科',
    content: {
      text: contentText.substring(0, 20000),
      sections: sections.slice(0, 30),
      summary: contentText.substring(0, 300)
    },
    role_info: roleInfo,
    media: {
      icon_url: extractRoleIcon($, $content),
      images: images.slice(0, 15)
    },
    tags: tags,
    related_links: relatedLinks.slice(0, 10)
  };
}

/**
 * 提取角色信息框
 */
function extractRoleInfobox($, $content) {
  const roleInfo = {
    team: null,
    team_name: null,
    ability: null,
    setup_info: null,
    script_belongs: []
  };
  
  // MediaWiki 信息框通常在 .infobox 中
  const $infobox = $content.find('.infobox, .character-info');
  
  $infobox.find('tr').each((i, tr) => {
    const $tr = $(tr);
    const label = $tr.find('th').text().trim();
    const value = $tr.find('td').text().trim();
    
    if (label.includes('阵营') || label.includes('类型')) {
      roleInfo.team_name = value;
      roleInfo.team = detectTeam(value);
    }
    
    if (label.includes('能力')) {
      roleInfo.ability = value;
    }
    
    if (label.includes('设置')) {
      roleInfo.setup_info = value;
    }
    
    if (label.includes('剧本')) {
      roleInfo.script_belongs = value.split(/[、，,]/).map(s => s.trim()).filter(s => s);
    }
  });
  
  // 如果没有信息框，尝试从内容中提取
  if (!roleInfo.ability) {
    const text = $content.text();
    
    // 匹配角色能力描述（通常在引号中）
    const abilityMatch = text.match(/["""]([^"""]{10,200})["""]/);
    if (abilityMatch) {
      roleInfo.ability = abilityMatch[1];
    }
  }
  
  return roleInfo;
}

/**
 * 提取角色图标
 */
function extractRoleIcon($, $content) {
  // 钟楼百科的角色图标通常在页面右侧或信息框中
  const iconSrc = $content.find('.infobox img, .character-icon img').first().attr('src');
  if (iconSrc) {
    return iconSrc.startsWith('http') 
      ? iconSrc 
      : 'https://clocktower-wiki.gstonegames.com' + iconSrc;
  }
  return null;
}

/**
 * 检测阵营
 */
function detectTeam(teamText) {
  if (!teamText) return null;
  
  const text = teamText.toLowerCase();
  if (text.includes('镇民') || text.includes('townsfolk')) return 'townsfolk';
  if (text.includes('外来者') || text.includes('outsider')) return 'outsider';
  if (text.includes('爪牙') || text.includes('minion')) return 'minion';
  if (text.includes('恶魔') || text.includes('demon')) return 'demon';
  if (text.includes('旅行者') || text.includes('traveler')) return 'traveler';
  return null;
}

/**
 * 判断词条类型
 */
function detectEntryType(title, content, roleInfo) {
  // 如果有角色信息，则为角色
  if (roleInfo && roleInfo.team) {
    return 'role';
  }
  
  // 根据标题和内容判断
  const combined = (title + ' ' + content).toLowerCase();
  
  if (combined.includes('剧本') && !combined.includes('角色')) {
    return 'script';
  } else if (combined.includes('规则') || combined.includes('术语')) {
    return 'rule';
  } else if (title.includes('游戏') || title.includes('介绍')) {
    return 'guide';
  } else {
    return 'term';
  }
}

