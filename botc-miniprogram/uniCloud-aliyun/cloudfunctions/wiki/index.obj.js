'use strict';

// Compatibility patch: some cloud runtimes (and undici) expect ReadableStream to exist.
// In environments where it's missing, provide a minimal shim to avoid ReferenceError.
if (typeof ReadableStream === 'undefined') {
  // minimal no-op shim sufficient for libraries that only check for existence
  global.ReadableStream = class ReadableStream {};
}

// Some environments also lack Blob which undici's webidl expects.
// Provide a minimal Blob shim to avoid ReferenceError during module load.
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this._parts = parts;
      this.type = options.type || '';
      // rough size estimate
      try {
        this.size = parts.reduce((acc, p) => acc + (typeof p === 'string' ? Buffer.byteLength(p) : (p && p.length) || 0), 0);
      } catch (e) {
        this.size = 0;
      }
    }
    async arrayBuffer() {
      // best-effort: concat strings only
      const buffers = this._parts.map(p => (typeof p === 'string' ? Buffer.from(p) : (Buffer.isBuffer(p) ? p : Buffer.from(String(p)))));
      return Buffer.concat(buffers).buffer;
    }
    text() {
      return Promise.resolve(this._parts.map(p => (typeof p === 'string' ? p : String(p))).join(''));
    }
  };
}

// ==================== 工具函数（外部） ====================

/**
 * 解析用户ID
 */
function parseUserId(clientInfo) {
  try {
    if (!clientInfo || !clientInfo.uniIdToken) {
      return null;
    }
    
    const tokenParts = clientInfo.uniIdToken.split('_');
    return tokenParts[0] || null;
  } catch (error) {
    console.error('[wiki] 解析用户ID失败:', error);
    return null;
  }
}

/**
 * 成功返回
 */
function returnSuccess(data = {}, message = 'success') {
  return {
    code: 0,
    message,
    data
  };
}

/**
 * 错误返回
 */
function returnError(code = -1, message = '操作失败', data = null) {
  return {
    code,
    message,
    data
  };
}

// ==================== HTML 解析函数（正则实现，替代 cheerio） ====================

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseMediaWikiPage(html, url) {
  // 标题：优先匹配 id="firstHeading"，否则取第一个 h1
  let m = html.match(/<h1[^>]*id=["']firstHeading["'][^>]*>([\s\S]*?)<\/h1>/i)
        || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = m ? stripTags(m[1]) : '';
  if (!title) {
    throw new Error('无法提取页面标题');
  }

  // 提取主要内容容器：id="mw-content-text" 或 class="mw-parser-output"
  m = html.match(/<div[^>]*id=["']mw-content-text['"][^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<div[^>]*class=["']mw-parser-output['"][^>]*>([\s\S]*?)<\/div>/i);
  let contentHtml = m ? m[1] : '';
  if (!contentHtml) {
    throw new Error('无法找到页面内容');
  }

  // 移除脚本样式和目录等不需展示的内容
  contentHtml = contentHtml.replace(/<script[\s\S]*?<\/script>/gi, '')
                           .replace(/<style[\s\S]*?<\/style>/gi, '')
                           .replace(/<div[^>]*class=["']?toc["']?[^>]*>[\s\S]*?<\/div>/gi, '')
                           .replace(/<table[^>]*class=["']?navbox["']?[^>]*>[\s\S]*?<\/table>/gi, '');

  const contentText = stripTags(contentHtml).replace(/\[编辑\]/g, '').trim();

  // 提取结构化段落（h2/h3/h4）和对应内容
  const sections = [];
  const headingRegex = /<(h[2-4])[^>]*>([\s\S]*?)<\/\1>/gi;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(contentHtml)) !== null) {
    headings.push({ tag: match[1], text: stripTags(match[2]), index: match.index });
  }
  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = (i + 1) < headings.length ? headings[i + 1].index : contentHtml.length;
    const sectionHtml = contentHtml.slice(start, end);
    const sectionText = stripTags(sectionHtml);
    if (headings[i].text && sectionText) {
      sections.push({
        heading: headings[i].text,
        content: sectionText.trim(),
        level: parseInt(headings[i].tag.substring(1))
      });
    }
  }

  // 提取图片（过滤 icon/logo）
  const images = [];
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(contentHtml)) !== null) {
    let src = match[1];
    if (!src) continue;
    if (src.includes('icon') || src.includes('logo')) continue;
    if (!/^https?:\/\//i.test(src)) {
      src = 'https://clocktower-wiki.gstonegames.com' + src;
    }
    images.push(src);
  }

  // 信息框（角色）
  const roleInfo = extractRoleInfobox(contentHtml);

  // 判断词条类型
  const entryType = detectEntryType(title, contentText, roleInfo);

  // 分类标签
  const tags = [];
  const catMatch = html.match(/<div[^>]*id=["']?mw-normal-catlinks['"]?[^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (catMatch) {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    while ((match = liRegex.exec(catMatch[1])) !== null) {
      const tag = stripTags(match[1]);
      if (tag) tags.push(tag);
    }
  }

  // 相关链接：以 /index.php 开头的链接
  const relatedLinks = [];
  const aRegex = /<a[^>]*href=["'](\/index\.php[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = aRegex.exec(contentHtml)) !== null) {
    const linkHref = match[1];
    const linkText = stripTags(match[2]);
    if (linkHref && !linkHref.includes('action=') && linkText) {
      relatedLinks.push({
        text: linkText,
        url: 'https://clocktower-wiki.gstonegames.com' + linkHref
      });
    }
  }

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
      icon_url: extractRoleIcon(contentHtml),
      images: images.slice(0, 15)
    },
    tags: tags,
    related_links: relatedLinks.slice(0, 10),
    status: 1
  };
}

/**
 * 提取角色信息框（基于正则）
 */
function extractRoleInfobox(contentHtml) {
  const roleInfo = {
    team: null,
    team_name: null,
    ability: null,
    setup_info: null,
    script_belongs: []
  };

  const infoboxMatch = contentHtml.match(/<table[^>]*class=["']?([^"']*infobox[^"']*)["']?[^>]*>([\s\S]*?)<\/table>/i)
                    || contentHtml.match(/<table[^>]*class=["']?([^"']*character-info[^"']*)["']?[^>]*>([\s\S]*?)<\/table>/i);
  const infoboxHtml = infoboxMatch ? infoboxMatch[2] : '';
  if (!infoboxHtml) {
    // fallback: try to extract quoted ability from content
    const abilityMatch = contentHtml.match(/["“]([^"”]{10,200})["”]/);
    if (abilityMatch) {
      roleInfo.ability = abilityMatch[1];
    }
    return roleInfo;
  }

  // extract rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(infoboxHtml)) !== null) {
    const rowHtml = match[1];
    const thMatch = rowHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
    const tdMatch = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
    const label = thMatch ? stripTags(thMatch[1]) : '';
    const value = tdMatch ? stripTags(tdMatch[1]) : '';
    if (!label) continue;
    if (label.includes('阵营') || label.includes('类型')) {
      roleInfo.team_name = value;
      roleInfo.team = detectTeam(value);
    } else if (label.includes('能力')) {
      roleInfo.ability = value;
    } else if (label.includes('设置')) {
      roleInfo.setup_info = value;
    } else if (label.includes('剧本')) {
      roleInfo.script_belongs = value.split(/[、，,]/).map(s => s.trim()).filter(s => s);
    }
  }

  return roleInfo;
}

/**
 * 提取角色图标（基于正则）
 */
function extractRoleIcon(contentHtml) {
  const iconMatch = contentHtml.match(/<img[^>]*class=["']?[^"']*(infobox|character-icon|thumb|image)[^"']*["']?[^>]*src=["']([^"']+)["'][^>]*>/i)
                 || contentHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (iconMatch) {
    let src = iconMatch[2] || iconMatch[1];
    if (src && !/^https?:\/\//i.test(src)) {
      src = 'https://clocktower-wiki.gstonegames.com' + src;
    }
    return src;
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
  if (roleInfo && roleInfo.team) {
    return 'role';
  }
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

// ==================== 云对象主体 ====================

module.exports = {
  
  /**
   * 前置钩子
   */
  _before() {
    this.db = uniCloud.database();
    this.dbCmd = this.db.command;
    this.clientInfo = this.getClientInfo();
    
    // 需要认证的方法
    const authMethods = [
      'addComment',
      'toggleLike'
    ];
    
    const methodName = this.getMethodName();
    
    if (authMethods.includes(methodName)) {
      this.currentUserId = parseUserId(this.clientInfo);
      if (!this.currentUserId) {
        throw new Error('请先登录');
      }
    }
    
    console.log(`[wiki] 调用方法: ${methodName}, 用户ID: ${this.currentUserId || '未登录'}`);
  },
  
  /**
   * 1. 获取词条列表
   * @param {Object} options - 查询选项
   */
  async getList(options = {}) {
    const {
      entry_type = null,
      keyword = null,
      page = 1,
      pageSize = 20,
      orderBy = 'created_at',
      order = 'desc'
    } = options;
    
    try {
      console.log(`[wiki] getList: type=${entry_type}, keyword=${keyword}, page=${page}`);
      
      const whereCondition = { status: 1 };
      
      if (entry_type) {
        whereCondition.entry_type = entry_type;
      }
      
      if (keyword && keyword.trim()) {
        whereCondition.$or = [
          { title: new RegExp(keyword, 'i') },
          { 'content.text': new RegExp(keyword, 'i') },
          { tags: this.dbCmd.in([keyword]) }
        ];
      }
      
      const countRes = await this.db.collection('wiki_entries')
        .where(whereCondition)
        .count();
      
      const listRes = await this.db.collection('wiki_entries')
        .where(whereCondition)
        .field({
          _id: true,
          entry_type: true,
          title: true,
          'content.summary': true,
          'role_info.team': true,
          'role_info.team_name': true,
          'role_info.ability': true,
          'media.icon_url': true,
          tags: true,
          'stats.view_count': true,
          'stats.favorite_count': true,
          is_featured: true
        })
        .orderBy(orderBy, order)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      console.log(`[wiki] getList成功: ${listRes.data.length}条`);
      
      return returnSuccess({
        list: listRes.data || [],
        total: countRes.total,
        page,
        pageSize,
        hasNext: countRes.total > page * pageSize
      }, '查询成功');
      
    } catch (error) {
      console.error('[wiki] getList失败:', error);
      return returnError(500, '查询失败: ' + error.message, {
        list: [],
        total: 0,
        page,
        pageSize,
        hasNext: false
      });
    }
  },
  
  /**
   * 2. 获取词条详情
   * @param {String} entryId - 词条ID
   */
  async getDetail(entryId) {
    if (!entryId) {
      return returnError(400, '缺少词条ID');
    }
    
    try {
      console.log('[wiki] getDetail:', entryId);
      
      // 查询词条
      const result = await this.db.collection('wiki_entries')
        .doc(entryId)
        .get();
      
      if (!result.data || result.data.length === 0) {
        return returnError(404, '词条不存在');
      }
      
      const entry = result.data[0];
      
      // 增加浏览计数
      try {
        await this.db.collection('wiki_entries')
          .doc(entryId)
          .update({
            'stats.view_count': this.dbCmd.inc(1)
          });
        
        // 更新返回数据中的浏览计数
        if (entry.stats) {
          entry.stats.view_count = (entry.stats.view_count || 0) + 1;
        }
      } catch (err) {
        console.error('[wiki] 更新浏览计数失败:', err);
      }
      
      // 查询相关词条
      try {
        const relatedResult = await this.db.collection('wiki_entries')
          .where({
            _id: this.dbCmd.neq(entryId),
            entry_type: entry.entry_type
          })
          .field({
            _id: true,
            title: true,
            'content.summary': true,
            'media.icon_url': true,
            'role_info.team': true,
            'role_info.team_name': true
          })
          .orderBy('stats.view_count', 'desc')
          .limit(5)
          .get();
        
        entry.related_entries = relatedResult.data || [];
      } catch (err) {
        console.error('[wiki] 查询相关词条失败:', err);
        entry.related_entries = [];
      }
      
      console.log('[wiki] getDetail成功');
      
      return returnSuccess(entry, '获取成功');
      
    } catch (error) {
      console.error('[wiki] getDetail失败:', error);
      return returnError(500, '查询失败: ' + error.message);
    }
  },
  
  /**
   * 3. 获取分类统计
   */
  async getCategories() {
    try {
      console.log('[wiki] getCategories');
      
      const stats = { role: 0, script: 0, rule: 0, guide: 0, term: 0, total: 0 };
      const types = ['role', 'script', 'rule', 'guide', 'term'];
      
      for (const type of types) {
        const res = await this.db.collection('wiki_entries')
          .where({ entry_type: type, status: 1 })
          .count();
        
        stats[type] = res.total;
        stats.total += res.total;
      }
      
      console.log('[wiki] getCategories成功:', stats);
      
      return returnSuccess(stats, '查询成功');
      
    } catch (error) {
      console.error('[wiki] getCategories失败:', error);
      return returnError(500, '查询失败', {
        role: 0,
        script: 0,
        rule: 0,
        guide: 0,
        term: 0,
        total: 0
      });
    }
  },
  
  /**
   * 4. 搜索词条
   * @param {Object} options - 搜索选项
   */
  async search(options = {}) {
    const {
      keyword,
      entry_type = null,
      page = 1,
      pageSize = 20
    } = options;
    
    if (!keyword || keyword.trim().length === 0) {
      return returnError(400, '搜索关键词不能为空');
    }
    
    try {
      console.log('[wiki] search:', keyword);
      
      // 构建查询条件
      const whereCondition = {
        $or: [
          { title: new RegExp(keyword, 'i') },
          { 'content.text': new RegExp(keyword, 'i') },
          { tags: this.dbCmd.in([keyword]) }
        ]
      };
      
      // 如果指定了类型，添加类型筛选
      if (entry_type) {
        whereCondition.entry_type = entry_type;
      }
      
      // 执行搜索
      const result = await this.db.collection('wiki_entries')
        .where(whereCondition)
        .field({
          _id: true,
          entry_type: true,
          title: true,
          'content.summary': true,
          'role_info.team': true,
          'role_info.team_name': true,
          'role_info.ability': true,
          'media.icon_url': true,
          tags: true,
          'stats.view_count': true,
          source_url: true
        })
        .orderBy('stats.view_count', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      // 记录搜索历史（如果用户已登录）
      if (this.currentUserId) {
        try {
          await this.db.collection('wiki_search_history').add({
            user_id: this.currentUserId,
            keyword: keyword.trim(),
            result_count: result.data.length,
            created_at: new Date()
          });
        } catch (err) {
          console.error('[wiki] 记录搜索历史失败:', err);
        }
      }
      
      // 增加搜索计数
      if (result.data && result.data.length > 0) {
        const entryIds = result.data.map(item => item._id);
        try {
          await this.db.collection('wiki_entries')
            .where({
              _id: this.dbCmd.in(entryIds)
            })
            .update({
              'stats.search_count': this.dbCmd.inc(1)
            });
        } catch (err) {
          console.error('[wiki] 更新搜索计数失败:', err);
        }
      }
      
      console.log(`[wiki] search成功: ${result.data.length}条`);
      
      return returnSuccess({
        list: result.data,
        total: result.data.length,
        page,
        pageSize,
        keyword
      }, '搜索成功');
      
    } catch (error) {
      console.error('[wiki] search失败:', error);
      return returnError(500, '搜索失败: ' + error.message);
    }
  },
  
  /**
   * 5. 添加评论
   * @param {String} roleId - 角色ID
   * @param {String} content - 评论内容
   */
  async addComment(roleId, content) {
    if (!roleId || !content) {
      return returnError(400, '缺少必要参数');
    }
    
    if (content.trim().length === 0) {
      return returnError(400, '评论内容不能为空');
    }
    
    if (content.length > 500) {
      return returnError(400, '评论内容不能超过500字');
    }
    
    const userId = this.currentUserId;
    
    try {
      // 获取用户信息
      const userRes = await this.db.collection('uni-id-users')
        .doc(userId)
        .field({
          nickname: true,
          avatar_file: true
        })
        .get();
      
      const userData = userRes.data && userRes.data[0];
      const nickname = userData?.nickname || '匿名用户';
      const avatar = userData?.avatar_file?.url || '';
      
      // 插入评论
      const commentRes = await this.db.collection('wiki_role_comments').add({
        user_id: userId,
        user_nickname: nickname,
        user_avatar: avatar,
        role_id: roleId,
        content: content.trim(),
        like_count: 0,
        status: 1,
        created_at: Date.now(),
        updated_at: Date.now()
      });
      
      // 增加角色评论数
      await this.db.collection('wiki_entries')
        .doc(roleId)
        .update({
          'stats.comment_count': this.dbCmd.inc(1)
        });
      
      console.log('[wiki] addComment成功');
      
      return returnSuccess({
        comment_id: commentRes.id
      }, '评论成功');
      
    } catch (error) {
      console.error('[wiki] addComment失败:', error);
      return returnError(500, '评论失败: ' + error.message);
    }
  },
  
  /**
   * 6. 获取评论列表
   * @param {String} roleId - 角色ID
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   */
  async getComments(roleId, page = 1, pageSize = 20) {
    if (!roleId) {
      return returnError(400, '缺少角色ID');
    }
    
    try {
      console.log(`[wiki] getComments: roleId=${roleId}, page=${page}`);
      
      // 查询评论列表
      const res = await this.db.collection('wiki_role_comments')
        .where({
          role_id: roleId,
          status: 1
        })
        .orderBy('created_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      // 查询总数
      const countRes = await this.db.collection('wiki_role_comments')
        .where({
          role_id: roleId,
          status: 1
        })
        .count();
      
      const list = res.data || [];
      const total = countRes.total || 0;
      
      console.log(`[wiki] getComments成功: ${list.length}条`);
      
      return returnSuccess({
        list: list,
        total: total,
        page: page,
        page_size: pageSize,
        has_more: total > page * pageSize
      }, '获取成功');
      
    } catch (error) {
      console.error('[wiki] getComments失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  },
  
  /**
   * 7. 点赞/取消点赞
   * @param {String} roleId - 角色ID
   */
  async toggleLike(roleId) {
    if (!roleId) {
      return returnError(400, '缺少角色ID');
    }
    
    const userId = this.currentUserId;
    
    try {
      console.log(`[wiki] toggleLike: roleId=${roleId}, userId=${userId}`);
      
      // 检查是否已点赞
      const likeRes = await this.db.collection('wiki_role_likes')
        .where({
          user_id: userId,
          role_id: roleId
        })
        .count();
      
      const hasLiked = (likeRes.total || 0) > 0;
      
      if (hasLiked) {
        // 取消点赞
        await this.db.collection('wiki_role_likes')
          .where({
            user_id: userId,
            role_id: roleId
          })
          .remove();
        
        // 减少点赞数
        await this.db.collection('wiki_entries')
          .doc(roleId)
          .update({
            'stats.like_count': this.dbCmd.inc(-1)
          });
        
        console.log('[wiki] 取消点赞成功');
        
        return returnSuccess({
          is_liked: false
        }, '已取消点赞');
      } else {
        // 添加点赞
        await this.db.collection('wiki_role_likes').add({
          user_id: userId,
          role_id: roleId,
          created_at: Date.now()
        });
        
        // 增加点赞数
        await this.db.collection('wiki_entries')
          .doc(roleId)
          .update({
            'stats.like_count': this.dbCmd.inc(1)
          });
        
        console.log('[wiki] 点赞成功');
        
        return returnSuccess({
          is_liked: true
        }, '点赞成功');
      }
      
    } catch (error) {
      console.error('[wiki] toggleLike失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  /**
   * 8. 获取说书人榜单
   * @param {String} type - 榜单类型（fans_count | heat_score）
   * @param {Number} limit - 数量限制
   */
  async getRankingStorytellers(type = 'fans_count', limit = 50) {
    try {
      console.log(`[wiki] getRankingStorytellers: type=${type}, limit=${limit}`);
      
      // Debug info to help trace runtime errors
      try {
        console.log('[wiki] debug this.dbCmd type:', typeof this.dbCmd);
        console.log('[wiki] debug this.dbCmd has gt:', !!(this.dbCmd && this.dbCmd.gt));
        console.log('[wiki] debug this.dbCmd has in:', !!(this.dbCmd && this.dbCmd.in));
      } catch (dbgErr) {
        console.warn('[wiki] dbCmd debug failed:', dbgErr);
      }

      let orderField = 'storyteller_stats.fans_count';
      
      if (type === 'heat_score') {
        orderField = 'storyteller_stats.heat_score';
      }

      // Normalize db command helper (some runtimes expose it as function, some as object)
      const dbCmd = (typeof this.dbCmd === 'function') ? this.dbCmd() : this.dbCmd;

      // Build where condition first to make it easier to inspect in logs
      const whereCondition = {
        storyteller_certified: true
      };
      try {
        if (!dbCmd || typeof dbCmd.gt !== 'function') {
          console.warn('[wiki] dbCmd missing or does not expose gt():', typeof dbCmd);
        }
        whereCondition[`storyteller_stats.${type}`] = dbCmd && typeof dbCmd.gt === 'function' ? dbCmd.gt(0) : 0;
      } catch (condErr) {
        console.error('[wiki] 构建 whereCondition 失败:', condErr);
        throw condErr;
      }

      const query = this.db.collection('uni-id-users')
        .where(whereCondition)
        .field({
          _id: true,
          nickname: true,
          avatar_file: true,
          storyteller_stats: true,
          storyteller_level: true,
          storyteller_certified: true
        })
        .orderBy(orderField, 'desc')
        .limit(limit);
      // debug the built query condition
      console.log('[wiki] getRankingStorytellers whereCondition:', JSON.stringify(whereCondition));
      const res = await query.get();
      
      const list = res.data || [];
      
      console.log(`[wiki] getRankingStorytellers成功: ${list.length}条`);
      
      return returnSuccess({
        list: list,
        total: list.length
      }, '获取成功');
      
    } catch (error) {
      // Log detailed error information
      console.error('[wiki] getRankingStorytellers失败:', {
        message: error && error.message,
        stack: error && error.stack,
        name: error && error.name
      });
      return returnError(500, '获取失败: ' + (error && error.message ? error.message : '未知错误'));
    }
  },
  
  /**
   * 9. 解析网页URL
   * @param {String} url - 网页URL
   * @param {Boolean} forceRefresh - 强制刷新
   */
  async parseUrl(url, forceRefresh = false) {
    console.log('[wiki] parseUrl:', url);
    
    // 1. 验证URL
    if (!url) {
      return returnError(400, '缺少URL参数');
    }
    
    if (!url.includes('clocktower-wiki.gstonegames.com')) {
      return returnError(400, '请输入钟楼百科的页面链接');
    }
    
    // 2. 检查缓存（除非强制刷新）
    if (!forceRefresh) {
      try {
        const cached = await this.db.collection('wiki_entries')
          .where({
            source_url: url,
            cache_expires_at: this.dbCmd.gte(new Date())
          })
          .limit(1)
          .get();
        
        if (cached.data && cached.data.length > 0) {
          console.log('[wiki] 返回缓存数据');
          return returnSuccess(cached.data[0], '加载成功（缓存）');
        }
      } catch (err) {
        console.error('[wiki] 缓存查询失败:', err);
      }
    }
    
    // 3. 抓取网页内容
    let html;
    try {
      console.log('[wiki] 开始抓取网页...');
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
      console.log('[wiki] 网页抓取成功');
    } catch (error) {
      console.error('[wiki] 抓取失败:', error);
      return returnError(500, '网页加载失败: ' + error.message);
    }
    
    // 4. 解析HTML内容（使用 cheerio）
    let parsedData;
    try {
      console.log('[wiki] 开始解析HTML...');
      parsedData = parseMediaWikiPage(html, url);
      console.log('[wiki] HTML解析成功');
    } catch (error) {
      console.error('[wiki] 解析失败:', error);
      return returnError(500, '内容解析失败: ' + error.message);
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
          favorite_count: 0,
          comment_count: 0,
          like_count: 0
        };
      }
      
      // 检查是否已存在
      const existing = await this.db.collection('wiki_entries')
        .where({ source_url: url })
        .limit(1)
        .get();
      
      if (existing.data && existing.data.length > 0) {
        // 更新现有记录
        const existingStats = existing.data[0].stats || {};
        parsedData.stats = existingStats; // 保留原有统计数据
        
        await this.db.collection('wiki_entries')
          .doc(existing.data[0]._id)
          .update(parsedData);
        
        parsedData._id = existing.data[0]._id;
        console.log('[wiki] 更新现有词条');
      } else {
        // 插入新记录
        const result = await this.db.collection('wiki_entries').add(parsedData);
        parsedData._id = result.id;
        console.log('[wiki] 插入新词条');
      }
    } catch (error) {
      console.error('[wiki] 数据库操作失败:', error);
      // 即使保存失败，也返回解析的数据
      parsedData._id = 'temp_' + Date.now();
    }
    
    console.log('[wiki] parseUrl完成');
    
    return returnSuccess(parsedData, '解析成功');
  }
};

