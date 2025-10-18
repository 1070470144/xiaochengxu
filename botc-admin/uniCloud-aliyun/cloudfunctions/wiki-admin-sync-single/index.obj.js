// 云对象方式，完全不依赖cheerio
module.exports = {
  async syncPage(url) {
    console.log('[wiki-admin-sync-single] 同步:', url);
    
    if (!url || !url.includes('clocktower-wiki.gstonegames.com')) {
      return { code: 400, message: '请输入有效的钟楼百科链接' };
    }
    
    const db = uniCloud.database();
    
    try {
      // 1. 抓取网页（增加超时时间）
      const response = await uniCloud.httpclient.request(url, {
        method: 'GET',
        timeout: 30000,  // 增加到30秒
        dataType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.status !== 200) {
        throw new Error('网页加载失败');
      }
      
      const html = response.data;
      console.log('[sync] HTML长度:', html.length);
      
      // 2. 提取标题（多种方式尝试）
      let title = '';
      
      // 方式1：匹配 id="firstHeading"
      let titleMatch = html.match(/<h1[^>]*id="firstHeading"[^>]*>(.*?)<\/h1>/is);
      if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      
      // 方式2：匹配 class="firstHeading"
      if (!title) {
        titleMatch = html.match(/<h1[^>]*class="firstHeading"[^>]*>(.*?)<\/h1>/is);
        if (titleMatch) {
          title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        }
      }
      
      // 方式3：匹配任意 h1 标签
      if (!title) {
        titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
        if (titleMatch) {
          title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        }
      }
      
      // 方式4：从URL提取标题
      if (!title) {
        const urlTitleMatch = url.match(/title=([^&]+)/);
        if (urlTitleMatch) {
          title = decodeURIComponent(urlTitleMatch[1]);
        }
      }
      
      if (!title) {
        throw new Error('无法提取标题，HTML长度: ' + html.length);
      }
      
      console.log('[sync] 提取到标题:', title);
      
      // 3. 提取内容
      const contentMatch = html.match(/<div[^>]*class="mw-parser-output"[^>]*>([\s\S]*?)<div[^>]*class="printfooter"/i);
      let content = contentMatch ? contentMatch[1] : '';
      
      // 清理HTML标签
      content = content
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log('[sync] 内容长度:', content.length);
      
      // 4. 构建数据
      const pageId = url.match(/title=([^&]+)/)?.[1] || '';
      
      const data = {
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
        media: { icon_url: null, images: [] },
        category: '角色',
        tags: [],
        keywords: [title],
        sync_info: {
          last_synced_at: new Date(),
          sync_source: 'manual',
          sync_status: 'success'
        },
        status: 1,
        updated_at: new Date()
      };
      
      // 5. 保存到数据库
      const existing = await db.collection('wiki_entries')
        .where({ source_url: url })
        .limit(1)
        .get();
      
      if (existing.data && existing.data.length > 0) {
        await db.collection('wiki_entries')
          .doc(existing.data[0]._id)
          .update(data);
        
        console.log('[sync] 更新成功');
        return { code: 0, message: '同步成功（更新）' };
      } else {
        data.created_at = new Date();
        data.stats = { view_count: 0, search_count: 0, favorite_count: 0 };
        
        await db.collection('wiki_entries').add(data);
        
        console.log('[sync] 新增成功');
        return { code: 0, message: '同步成功（新增）' };
      }
    } catch (error) {
      console.error('[sync] 失败:', error);
      return { code: 500, message: '同步失败: ' + error.message };
    }
  }
};

