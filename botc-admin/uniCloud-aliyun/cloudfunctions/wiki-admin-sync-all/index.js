'use strict';

const urlsConfig = require('./urls-config.js');
const parserUtils = require('./parser-utils.js');

exports.main = async (event, context) => {
  const { sync_type = 'all', batch_size = 5 } = event;
  
  console.log('[wiki-admin-sync-all] 开始批量同步，类型:', sync_type);
  
  const adminId = context.ADMIN_UID || 'system';
  const db = uniCloud.database();
  const startTime = new Date();
  
  const urlsToSync = urlsConfig.getUrlsByType(sync_type);
  console.log('[wiki-admin-sync-all] 需要同步', urlsToSync.length, '个页面');
  
  const syncResult = {
    sync_type,
    start_time: startTime,
    total_count: urlsToSync.length,
    success_count: 0,
    failed_count: 0,
    error_list: [],
    status: 'running',
    triggered_by: event.triggered_by || 'admin_manual',
    admin_id: adminId
  };
  
  let logId;
  try {
    const logRes = await db.collection('wiki_sync_logs').add(syncResult);
    logId = logRes.id;
  } catch (err) {
    console.error('[wiki-admin-sync-all] 创建日志失败:', err);
  }
  
  for (let i = 0; i < urlsToSync.length; i += batch_size) {
    const batch = urlsToSync.slice(i, i + batch_size);
    console.log(`[wiki-admin-sync-all] 处理批次 ${Math.floor(i/batch_size) + 1}/${Math.ceil(urlsToSync.length/batch_size)}`);
    
    await Promise.all(batch.map(async (url) => {
      try {
        const result = await syncSinglePage(url, db);
        if (result.success) {
          syncResult.success_count++;
          console.log('[wiki-admin-sync-all] 成功:', url);
        } else {
          syncResult.failed_count++;
          syncResult.error_list.push({ url, error: result.error });
          console.error('[wiki-admin-sync-all] 失败:', url, result.error);
        }
      } catch (error) {
        syncResult.failed_count++;
        syncResult.error_list.push({ url, error: error.message });
        console.error('[wiki-admin-sync-all] 异常:', url, error);
      }
    }));
    
    if (i + batch_size < urlsToSync.length) {
      await sleep(1000);
    }
  }
  
  const endTime = new Date();
  syncResult.end_time = endTime;
  syncResult.duration = Math.round((endTime - startTime) / 1000);
  syncResult.status = syncResult.failed_count === 0 ? 'success' : 'partial_success';
  
  if (logId) {
    try {
      await db.collection('wiki_sync_logs').doc(logId).update(syncResult);
    } catch (err) {
      console.error('[wiki-admin-sync-all] 更新日志失败:', err);
    }
  }
  
  console.log('[wiki-admin-sync-all] 同步完成:', syncResult);
  
  return {
    code: 0,
    message: `同步完成！成功: ${syncResult.success_count}, 失败: ${syncResult.failed_count}`,
    data: syncResult
  };
};

async function syncSinglePage(url, db) {
  try {
    console.log('[syncSinglePage] 开始抓取:', url);
    
    const response = await uniCloud.httpclient.request(url, {
      method: 'GET',
      timeout: 30000,  // 增加到30秒
      dataType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    });
    
    console.log('[syncSinglePage] HTTP状态:', response.status);
    
    if (response.status !== 200) {
      throw new Error('HTTP状态码: ' + response.status);
    }
    
    const html = response.data;
    
    if (!html || typeof html !== 'string') {
      throw new Error('获取的HTML内容无效');
    }
    
    console.log('[syncSinglePage] HTML长度:', html.length);
    const parsedData = parseMediaWikiPage(html, url);
    
    parsedData.sync_info = {
      last_synced_at: new Date(),
      sync_source: 'auto',
      sync_status: 'success',
      sync_error: null,
      sync_count: 1
    };
    
    parsedData.status = 1;
    parsedData.updated_at = new Date();
    
    const existing = await db.collection('wiki_entries')
      .where({ source_url: url })
      .limit(1)
      .get();
    
    if (existing.data && existing.data.length > 0) {
      const existingData = existing.data[0];
      parsedData.sync_info.sync_count = (existingData.sync_info?.sync_count || 0) + 1;
      parsedData.stats = existingData.stats || { view_count: 0, search_count: 0, favorite_count: 0 };
      
      await db.collection('wiki_entries')
        .doc(existingData._id)
        .update(parsedData);
    } else {
      parsedData.created_at = new Date();
      parsedData.stats = {
        view_count: 0,
        search_count: 0,
        favorite_count: 0
      };
      parsedData.is_featured = false;
      parsedData.quality_score = calculateQualityScore(parsedData);
      
      await db.collection('wiki_entries').add(parsedData);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function parseMediaWikiPage(html, url) {
  try {
    console.log('[parseMediaWikiPage] 开始解析 HTML，长度:', html.length);
    
    // 使用正则表达式简单解析（不依赖cheerio）
    // 提取标题（多种方式）
    let title = '';
    let titleMatch = html.match(/<h1[^>]*id="firstHeading"[^>]*>(.*?)<\/h1>/is);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    // 如果第一种方式失败，尝试其他方式
    if (!title) {
      titleMatch = html.match(/<h1[^>]*class="firstHeading"[^>]*>(.*?)<\/h1>/is);
      if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    }
    
    // 再失败，尝试匹配任意h1
    if (!title) {
      titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
      if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    }
    
    // 最后尝试从URL提取
    if (!title) {
      const urlTitleMatch = url.match(/title=([^&]+)/);
      if (urlTitleMatch) {
        title = decodeURIComponent(urlTitleMatch[1]);
      }
    }
    
    console.log('[parseMediaWikiPage] 提取标题:', title);
    
    if (!title) {
      throw new Error('无法提取页面标题，HTML长度: ' + html.length);
    }
    
    // 提取主要内容区域
    const contentMatch = html.match(/<div[^>]*class="mw-parser-output"[^>]*>([\s\S]*?)<\/div>/i);
    let contentHtml = contentMatch ? contentMatch[1] : html;
    
    // 移除不需要的标签
    contentHtml = contentHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<div[^>]*class="[^"]*toc[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    
    // 提取纯文本
    const contentText = contentHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\[编辑\]/g, '')
      .trim();
  
  const sections = [];
  $content.children('h2, h3, h4').each((i, elem) => {
    const $heading = $(elem);
    const headingText = $heading.find('.mw-headline').text().trim() || $heading.text().trim();
    const level = parseInt(elem.name.substring(1));
    
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
  
  const images = [];
  $content.find('img').each((i, elem) => {
    let src = $(elem).attr('src') || $(elem).attr('data-src');
    if (src && !src.includes('icon') && !src.includes('logo')) {
      if (!src.startsWith('http')) {
        src = 'https://clocktower-wiki.gstonegames.com' + src;
      }
      images.push(src);
    }
  });
  
  const roleInfo = extractRoleInfobox($, $content);
  const entryType = detectEntryType(title, contentText, roleInfo);
  
  const tags = [];
  $('#mw-normal-catlinks ul li').each((i, elem) => {
    const tag = $(elem).text().trim();
    if (tag) tags.push(tag);
  });
  
  const pageIdMatch = url.match(/title=([^&]+)/);
  const pageId = pageIdMatch ? decodeURIComponent(pageIdMatch[1]) : '';
  
  // 🆕 v2.1: 详细内容解析（仅角色类型）
  let role_detail = null;
  if (entryType === 'role') {
    console.log('[parseMediaWikiPage] 开始详细解析角色内容');
    role_detail = parserUtils.parseRoleDetail(html);
  }
  
  return {
    entry_type: entryType,
    title: title,
    slug: pageId,
    source_url: url,
    source_page_id: pageId,
    source_type: 'official_wiki_cn',
    source_name: '钟楼百科',
    content: {
      text: contentText.substring(0, 20000),
      sections: sections.slice(0, 30),
      summary: contentText.substring(0, 300)
    },
    role_info: roleInfo,
    role_detail: role_detail,  // 🆕 v2.1: 详细内容
    media: {
      icon_url: extractRoleIcon(html),
      images: images.slice(0, 15)
    },
    category: getCategoryByType(entryType),
    tags: tags,
    keywords: extractKeywords(title, contentText)
  };
  } catch (error) {
    console.error('[parseMediaWikiPage] 解析失败:', error);
    throw error;
  }
}

function extractRoleInfobox(html) {
  const roleInfo = {
    team: null,
    team_name: null,
    ability: null,
    setup_info: null,
    script_belongs: []
  };
  
  // 使用正则提取信息框内容
  const infoboxMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (infoboxMatch) {
    const infoboxHtml = infoboxMatch[1];
    
    // 提取阵营
    const teamMatch = infoboxHtml.match(/阵营.*?<td[^>]*>(.*?)<\/td>/is);
    if (teamMatch) {
      const teamText = teamMatch[1].replace(/<[^>]+>/g, '').trim();
      roleInfo.team_name = teamText;
      roleInfo.team = detectTeam(teamText);
    }
    
    // 提取能力
    const abilityMatch = infoboxHtml.match(/能力.*?<td[^>]*>(.*?)<\/td>/is);
    if (abilityMatch) {
      roleInfo.ability = abilityMatch[1].replace(/<[^>]+>/g, '').trim();
    }
  }
  
  return roleInfo;
}

function extractRoleIcon(html) {
  // 提取信息框中的图片
  const infoboxMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (infoboxMatch) {
    const imgMatch = infoboxMatch[1].match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
      let src = imgMatch[1];
      return src.startsWith('http') 
        ? src 
        : 'https://clocktower-wiki.gstonegames.com' + src;
    }
  }
  return null;
}

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

function detectEntryType(title, content, roleInfo) {
  if (roleInfo && roleInfo.team) return 'role';
  
  const combined = (title + ' ' + content).toLowerCase();
  if (combined.includes('剧本') && !combined.includes('角色')) return 'script';
  if (combined.includes('规则') || combined.includes('术语')) return 'rule';
  if (title.includes('游戏') || title.includes('介绍')) return 'guide';
  return 'term';
}

function getCategoryByType(type) {
  const categoryMap = {
    role: '角色',
    script: '剧本',
    rule: '规则',
    guide: '指南',
    term: '术语'
  };
  return categoryMap[type] || '其他';
}

function extractKeywords(title, content) {
  const keywords = [title];
  const words = content.substring(0, 500).split(/\s+/);
  const wordFreq = {};
  
  words.forEach(word => {
    const cleaned = word.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '');
    if (cleaned.length > 1) {
      wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
    }
  });
  
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  return [...keywords, ...topWords];
}

function calculateQualityScore(data) {
  let score = 50;
  if (data.title && data.title.length > 0) score += 10;
  if (data.content.text && data.content.text.length > 100) score += 20;
  if (data.content.sections && data.content.sections.length > 0) score += 10;
  if (data.media.images && data.media.images.length > 0) score += 5;
  if (data.role_info && data.role_info.team) score += 5;
  return Math.min(score, 100);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

