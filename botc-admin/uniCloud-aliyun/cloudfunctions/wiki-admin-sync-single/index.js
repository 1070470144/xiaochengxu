'use strict';

const parserUtils = require('../wiki-admin-sync-all/parser-utils.js');

exports.main = async (event, context) => {
  const { url } = event;
  
  console.log('[wiki-admin-sync-single] 同步:', url);
  
  if (!url) {
    return { code: 400, message: '缺少URL参数' };
  }
  
  if (!url.includes('clocktower-wiki.gstonegames.com')) {
    return { code: 400, message: '请输入钟楼百科的页面链接' };
  }
  
  const db = uniCloud.database();
  
  try {
    // 1. 抓取网页
    console.log('[sync] 开始抓取网页');
    const response = await uniCloud.httpclient.request(url, {
      method: 'GET',
      timeout: 30000,
      dataType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error('网页加载失败，状态码: ' + response.status);
    }
    
    const html = response.data;
    console.log('[sync] HTML长度:', html.length);
    
    // 2. 提取标题
    let title = '';
    let titleMatch = html.match(/<h1[^>]*id="firstHeading"[^>]*>(.*?)<\/h1>/is);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    if (!title) {
      const urlTitleMatch = url.match(/title=([^&]+)/);
      if (urlTitleMatch) {
        title = decodeURIComponent(urlTitleMatch[1]);
      }
    }
    
    if (!title) {
      throw new Error('无法提取标题');
    }
    
    console.log('[sync] 标题:', title);
    
    // 3. 提取内容（清理HTML）
    const contentMatch = html.match(/<div[^>]*class="mw-parser-output"[^>]*>([\s\S]*?)<div[^>]*class="printfooter"/i);
    let content = contentMatch ? contentMatch[1] : '';
    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('[sync] 内容长度:', content.length);
    
    // 4. 🆕 v2.1: 详细内容解析（使用原始HTML）
    console.log('[sync] ========== 开始详细解析 ==========');
    console.log('[sync] parserUtils存在:', !!parserUtils);
    console.log('[sync] parseRoleDetail函数:', typeof parserUtils.parseRoleDetail);
    
    let role_detail = null;
    try {
      if (parserUtils && typeof parserUtils.parseRoleDetail === 'function') {
        role_detail = parserUtils.parseRoleDetail(html);  // 使用原始HTML！
        console.log('[sync] ========== 详细解析完成 ==========');
        console.log('[sync] role_detail:', role_detail);
        console.log('[sync] background_story有值:', !!role_detail.background_story);
        console.log('[sync] ability有值:', !!role_detail.ability);
        console.log('[sync] introduction数量:', role_detail.introduction?.length || 0);
        console.log('[sync] examples数量:', role_detail.examples?.length || 0);
        console.log('[sync] mechanics数量:', role_detail.mechanics?.length || 0);
        console.log('[sync] reminder_tokens数量:', role_detail.reminder_tokens?.length || 0);
      } else {
        console.error('[sync] ❌ parserUtils 或 parseRoleDetail 不可用！');
        console.error('[sync] parserUtils类型:', typeof parserUtils);
        console.error('[sync] parserUtils内容:', Object.keys(parserUtils || {}));
      }
    } catch (parseError) {
      console.error('[sync] ❌ 详细解析失败:', parseError.message);
      console.error('[sync] 错误堆栈:', parseError.stack);
    }
    
    // 5. 构建数据
    const pageId = url.match(/title=([^&]+)/)?.[1] || '';
    
    const parsedData = {
      entry_type: 'role',
      title,
      slug: decodeURIComponent(pageId),
      source_url: url,
      source_page_id: pageId,
      source_type: 'official_wiki_cn',
      source_name: '钟楼百科',
      content: {
        text: content.substring(0, 10000),
        sections: [],
        summary: content.substring(0, 200)
      },
      role_info: { team: null, team_name: null, ability: null },
      role_detail: role_detail,  // 🆕 v2.1: 详细内容
      media: { 
        icon_url: role_detail ? role_detail.icon_url : null,  // 🆕 使用解析的图标
        images: [] 
      },
      category: '角色',
      tags: [],
      keywords: [title],
      sync_info: {
        last_synced_at: new Date(),
        sync_source: 'manual',
        sync_status: 'success',
        sync_error: null,
        sync_count: 1
      },
      status: 1,
      updated_at: new Date()
    };
    
    console.log('[sync] ========== 最终数据 ==========');
    console.log('[sync] 包含role_detail:', !!parsedData.role_detail);
    console.log('[sync] role_detail不为null:', parsedData.role_detail !== null);
    
    // 6. 保存到数据库
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
      
      console.log('[sync] 更新成功');
      return { code: 0, message: '同步成功（更新）', data: { _id: existingData._id } };
    } else {
      parsedData.created_at = new Date();
      parsedData.stats = { view_count: 0, search_count: 0, favorite_count: 0 };
      parsedData.is_featured = false;
      parsedData.quality_score = 80;
      
      const result = await db.collection('wiki_entries').add(parsedData);
      
      console.log('[sync] 新增成功');
      return { code: 0, message: '同步成功（新增）', data: { _id: result.id } };
    }
  } catch (error) {
    console.error('[sync] 失败:', error);
    console.error('[sync] 错误堆栈:', error.stack);
    return { code: 500, message: '同步失败: ' + error.message };
  }
};

