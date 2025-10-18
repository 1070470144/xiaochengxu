/**
 * 钟楼百科内容解析工具库
 * 将HTML内容解析为结构化数据
 */

/**
 * 提取章节内容
 * @param {string} html - HTML内容
 * @param {string} sectionTitle - 章节标题
 * @param {string} nextSection - 下一个章节标题（用于确定边界）
 * @returns {string} 章节内容
 */
function extractSection(html, sectionTitle, nextSection) {
  try {
    // 构建正则：从章节标题到下一个章节之间的内容
    const pattern = new RegExp(
      sectionTitle + '[\\s\\S]*?<\\/h[23]>[\\s\\S]*?(?=<h[23][^>]*>' + (nextSection || '$') + ')',
      'i'
    );
    
    const match = html.match(pattern);
    if (match) {
      // 移除HTML标签，保留文本
      return match[0]
        .replace(/<h[23][^>]*>.*?<\/h[23]>/gi, '') // 移除标题
        .replace(/<[^>]+>/g, ' ') // 移除HTML标签
        .replace(/\s+/g, ' ') // 合并空格
        .trim();
    }
    return '';
  } catch (error) {
    console.error('[extractSection] 提取失败:', sectionTitle, error);
    return '';
  }
}

/**
 * 1. 提取背景故事
 * 背景故事通常在引号内，精确提取引号之间的内容
 */
function parseBackgroundStory(html) {
  try {
    // 简单粗暴：查找包含"背景故事"的<h2>标签
    // 格式：<h2...>...背景故事...</h2>
    const storyH2Pattern = /<h2[\s\S]{0,300}?背景故事[\s\S]{0,100}?<\/h2>/i;
    const storyH2Match = html.match(storyH2Pattern);
    
    if (!storyH2Match) {
      console.log('[parseBackgroundStory] 未找到背景故事的<h2>标签');
      return '';
    }
    
    console.log('[parseBackgroundStory] 找到H2标签:', storyH2Match[0].substring(0, 100));
    
    const storyIndex = html.indexOf(storyH2Match[0]);
    
    // 从<h2>标签结束到下一个<h2>开始之间的内容
    const searchStart = storyIndex + storyH2Match[0].length;
    const nextH2Index = html.indexOf('<h2', searchStart);
    const searchRange = html.substring(
      searchStart, 
      nextH2Index > 0 ? nextH2Index : searchStart + 1000
    );
    
    console.log('[parseBackgroundStory] 背景故事内容范围（前400字符）:', searchRange.substring(0, 400));
    
    // 提取所有 <i> 标签内的内容
    const italicPattern = /<i>([^<]+)<\/i>/g;
    let match;
    const storyParts = [];
    
    while ((match = italicPattern.exec(searchRange)) !== null) {
      console.log('[parseBackgroundStory] 匹配到 <i> 内容:', match[1].substring(0, 50));
      
      let text = match[1]
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '')  // HTML实体引号
        .replace(/[""""''\u201C\u201D]/g, '')  // 移除所有引号（包括Unicode 8220和8221）
        .trim();
      
      // 清理空格
      text = text.replace(/\s+/g, ' ').trim();
      
      if (text.length > 5) {
        storyParts.push(text);
      }
    }
    
    console.log('[parseBackgroundStory] 提取到段落数:', storyParts.length);
    
    // 合并所有部分，用两个换行分隔
    const story = storyParts.join('\n\n');
    
    if (story.length > 10) {
      console.log('[parseBackgroundStory] 最终结果:', story.substring(0, 100) + '...');
      return story;
    }
    
    console.log('[parseBackgroundStory] 未找到内容');
    return '';
  } catch (error) {
    console.error('[parseBackgroundStory] 失败:', error);
    return '';
  }
}

/**
 * 2. 提取角色能力
 * 角色能力在"角色能力"章节的第一段
 */
function parseAbility(html) {
  try {
    // 直接匹配"角色能力"后面的内容，到下一个章节标题
    const pattern = /角色能力[\s\S]{0,50}?<\/h[23]>([\s\S]{50,500}?)(?=<h[23]|角色简介)/i;
    const match = html.match(pattern);
    
    if (match) {
      const abilityText = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // 提取第一句（以句号结束）
      const firstSentence = abilityText.split('。')[0];
      return firstSentence ? firstSentence.trim() + '。' : abilityText;
    }
    
    return '';
  } catch (error) {
    console.error('[parseAbility] 失败:', error);
    return '';
  }
}

/**
 * 3. 提取角色简介（多段）
 * 将简介章节按句子分割
 */
function parseIntroduction(html) {
  try {
    // 匹配"角色简介"章节
    const pattern = /角色简介[\s\S]{0,50}?<\/h[23]>([\s\S]{50,2000}?)(?=<h[23]|范例)/i;
    const match = html.match(pattern);
    
    if (match) {
      const introText = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // 按句号分割
      const paragraphs = introText
        .split('。')
        .map(p => p.trim())
        .filter(p => p.length > 15) // 过滤太短的
        .map(p => p + '。');
      
      return paragraphs;
    }
    
    return [];
  } catch (error) {
    console.error('[parseIntroduction] 失败:', error);
    return [];
  }
}

/**
 * 4. 提取范例（场景+结果）
 * 识别"XX是YY"模式和"洗衣妇得知"模式
 */
function parseExamples(html) {
  try {
    // 匹配"范例"章节
    const pattern = /范例[\s\S]{0,50}?<\/h[23]>([\s\S]{50,3000}?)(?=<h[23]|运作方式)/i;
    const match = html.match(pattern);
    
    if (!match) return [];
    
    const exampleText = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const examples = [];
    const sentences = exampleText.split('。').map(s => s.trim()).filter(s => s);
    
    let currentScenario = '';
    
    for (const sentence of sentences) {
      // 识别场景（包含"是"的句子）
      if (sentence.includes('是') && !sentence.includes('得知')) {
        currentScenario = sentence + '。';
      }
      // 识别结果（包含"得知"的句子）
      else if (sentence.includes('得知')) {
        if (currentScenario) {
          examples.push({
            scenario: currentScenario,
            result: sentence + '。'
          });
          currentScenario = '';
        }
      }
    }
    
    return examples;
  } catch (error) {
    console.error('[parseExamples] 失败:', error);
    return [];
  }
}

/**
 * 5. 提取运作方式（多步骤）
 * 按句子分割运作步骤
 */
function parseMechanics(html) {
  try {
    // 匹配"运作方式"章节
    const pattern = /运作方式[\s\S]{0,50}?<\/h[23]>([\s\S]{50,2000}?)(?=<h[23]|提示标记)/i;
    const match = html.match(pattern);
    
    if (!match) return [];
    
    const mechanicsText = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 按句号分割
    const steps = mechanicsText
      .split('。')
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .map(s => s + '。');
    
    return steps;
  } catch (error) {
    console.error('[parseMechanics] 失败:', error);
    return [];
  }
}

/**
 * 6. 提取提示标记（标记名+详情）
 * 识别每个标记的名称和相关说明
 */
function parseReminderTokens(html) {
  try {
    const tokenSection = extractSection(html, '提示标记', '规则细节');
    if (!tokenSection) return [];
    
    const tokens = [];
    
    // 常见的提示标记名称
    const tokenNames = ['镇民', '外来者', '爪牙', '恶魔', '错误', '是', '否', '投票', '使用过'];
    
    for (const tokenName of tokenNames) {
      // 查找该标记相关的内容
      const pattern = new RegExp(tokenName + '[\\s\\S]{0,500}?(?=(' + tokenNames.join('|') + ')|规则细节|$)', 'i');
      const match = tokenSection.match(pattern);
      
      if (match) {
        const tokenContent = match[0];
        
        // 提取详情（放置时机、放置条件、移除时机等）
        const details = [];
        const detailPatterns = ['放置时机：', '放置条件：', '移除时机：'];
        
        for (const pattern of detailPatterns) {
          const detailMatch = tokenContent.match(new RegExp(pattern + '([^。]{10,200})。'));
          if (detailMatch) {
            details.push(pattern + detailMatch[1] + '。');
          }
        }
        
        if (details.length > 0) {
          tokens.push({
            name: tokenName,
            icon: getTokenIcon(tokenName),
            details: details
          });
        }
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('[parseReminderTokens] 失败:', error);
    return [];
  }
}

/**
 * 7. 提取规则细节（多条）
 */
function parseRuleDetails(html) {
  try {
    // 匹配"规则细节"章节
    const pattern = /规则细节[\s\S]{0,50}?<\/h[23]>([\s\S]{50,3000}?)(?=<h[23]|提示与技巧)/i;
    const match = html.match(pattern);
    
    if (!match) return [];
    
    const ruleText = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 按句号分割
    const rules = ruleText
      .split('。')
      .map(r => r.trim())
      .filter(r => r.length > 20)
      .map(r => r + '。');
    
    return rules;
  } catch (error) {
    console.error('[parseRuleDetails] 失败:', error);
    return [];
  }
}

/**
 * 8. 提取提示与技巧（多条）
 */
function parseTipsAndTricks(html) {
  try {
    // 匹配"提示与技巧"章节
    const pattern = /提示与技巧[\s\S]{0,50}?<\/h[23]>([\s\S]{50,5000}?)(?=<h[23]|伪装成)/i;
    const match = html.match(pattern);
    
    if (!match) return [];
    
    const tipsText = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 按句号分割
    const tips = tipsText
      .split('。')
      .map(t => t.trim())
      .filter(t => t.length > 20)
      .map(t => t + '。');
    
    return tips;
  } catch (error) {
    console.error('[parseTipsAndTricks] 失败:', error);
    return [];
  }
}

/**
 * 9. 提取伪装方法（多条）
 */
function parseBluffTips(html) {
  try {
    // 匹配"伪装成XX"章节（洗衣妇的情况是"伪装成洗衣妇"）
    const pattern = /伪装成[\s\S]{0,50}?<\/h[23]>([\s\S]{50,5000}?)(?=<h[23]|角色信息)/i;
    const match = html.match(pattern);
    
    if (!match) return [];
    
    const bluffText = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 按句号分割
    const bluffs = bluffText
      .split('。')
      .map(b => b.trim())
      .filter(b => b.length > 20)
      .map(b => b + '。');
    
    return bluffs;
  } catch (error) {
    console.error('[parseBluffTips] 失败:', error);
    return [];
  }
}

/**
 * 10. 提取角色信息（属性）
 * 提取英文名、所属剧本、角色类型等
 */
function parseCharacterInfo(html) {
  try {
    console.log('[parseCharacterInfo] 开始解析角色信息');
    console.log('[parseCharacterInfo] HTML长度:', html.length);
    
    // 方法：搜索 <h2>角色信息</h2> 然后提取后面的 <ul><li> 列表
    // 注意：必须确保是内容区域的h2，不是目录的链接
    
    // 搜索所有包含"角色信息"的 <h2> 标签位置
    const h2Regex = /<h2[^>]*>[\s\S]*?角色信息[\s\S]*?<\/h2>/gi;
    const h2Matches = [];
    let match;
    while ((match = h2Regex.exec(html)) !== null) {
      h2Matches.push({
        index: match.index,
        text: match[0]
      });
    }
    
    console.log('[parseCharacterInfo] 找到', h2Matches.length, '个"角色信息"标题');
    
    // 取最后一个（真正的章节标题，不是目录）
    if (h2Matches.length === 0) {
      console.log('[parseCharacterInfo] ❌ 未找到"角色信息"章节');
      return {};
    }
    
    const lastH2 = h2Matches[h2Matches.length - 1];
    console.log('[parseCharacterInfo] 使用第', h2Matches.length, '个"角色信息"，位置:', lastH2.index);
    
    // 从这个h2标签的结束位置开始，提取后面的内容
    const startPos = lastH2.index + lastH2.text.length;
    const restHtml = html.substring(startPos, startPos + 1500);
    
    // 提取到下一个h2或注释为止
    const contentMatch = restHtml.match(/^([\s\S]{50,1500}?)(?=<h[12]|<!--)/i);
    
    if (!contentMatch) {
      console.log('[parseCharacterInfo] ❌ 未提取到角色信息内容');
      return {};
    }
    
    console.log('[parseCharacterInfo] 提取到HTML片段，长度:', contentMatch[1].length);
    console.log('[parseCharacterInfo] HTML片段（前300字符）:', contentMatch[1].substring(0, 300));
    
    // 清理HTML
    const infoText = contentMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('[parseCharacterInfo] 清理后的文本:', infoText);
    
    const info = {
      english_name: '',
      belongs_to_scripts: [],
      character_type: '',
      ability_categories: []
    };
    
    // 提取英文名（支持多种格式）
    const englishMatch = infoText.match(/英文名[：:\s]*([A-Za-z\s]+?)(?=\s|角色|所属|能力|$)/i);
    if (englishMatch) {
      info.english_name = englishMatch[1].trim();
      console.log('[parseCharacterInfo] ✓ 英文名:', info.english_name);
    } else {
      console.log('[parseCharacterInfo] ✗ 未匹配到英文名');
    }
    
    // 提取角色类型（支持多种格式）
    const typeMatch = infoText.match(/角色类型[：:\s]*(镇民|外来者|爪牙|恶魔|旅行者)/i);
    if (typeMatch) {
      info.character_type = typeMatch[1];
      console.log('[parseCharacterInfo] ✓ 角色类型:', info.character_type);
    } else {
      console.log('[parseCharacterInfo] ✗ 未匹配到角色类型');
    }
    
    // 提取所属剧本
    const scriptMatch = infoText.match(/所属剧本[：:\s]*([^角色能力]+?)(?=角色|能力|$)/i);
    if (scriptMatch) {
      info.belongs_to_scripts = scriptMatch[1]
        .split(/[、，,]+/)
        .map(s => s.trim())
        .filter(s => s && s.length > 0 && s.length < 20);
      console.log('[parseCharacterInfo] ✓ 所属剧本:', info.belongs_to_scripts);
    } else {
      console.log('[parseCharacterInfo] ✗ 未匹配到所属剧本');
    }
    
    // 提取能力类别（多种可能的名称）
    const categoryMatch = infoText.match(/(?:角色能力类型|能力类型|能力类别)[：:\s]*(.+?)(?=英文|角色|所属|导航|$)/i);
    if (categoryMatch) {
      info.ability_categories = categoryMatch[1]
        .split(/[、，,\s]+/)
        .map(s => s.trim())
        .filter(s => s && s.length > 0 && s.length < 10);
      console.log('[parseCharacterInfo] ✓ 能力类别:', info.ability_categories);
    } else {
      console.log('[parseCharacterInfo] ✗ 未匹配到能力类别');
    }
    
    console.log('[parseCharacterInfo] ========== 最终提取结果 ==========');
    console.log('[parseCharacterInfo] 英文名:', info.english_name || '(空)');
    console.log('[parseCharacterInfo] 角色类型:', info.character_type || '(空)');
    console.log('[parseCharacterInfo] 所属剧本:', info.belongs_to_scripts.length ? info.belongs_to_scripts.join('、') : '(空)');
    console.log('[parseCharacterInfo] 能力类别:', info.ability_categories.length ? info.ability_categories.join('、') : '(空)');
    
    return info;
  } catch (error) {
    console.error('[parseCharacterInfo] 失败:', error);
    console.error('[parseCharacterInfo] 错误堆栈:', error.stack);
    return {};
  }
}

/**
 * 获取标记图标
 */
function getTokenIcon(tokenName) {
  const iconMap = {
    '镇民': '🎯',
    '外来者': '⚠️',
    '爪牙': '😈',
    '恶魔': '👹',
    '错误': '❌',
    '是': '✅',
    '否': '⛔',
    '投票': '🗳️',
    '使用过': '✓'
  };
  
  return iconMap[tokenName] || '🏷️';
}

/**
 * 提取角色图标
 * 提取页面中的角色图片URL
 */
function parseRoleIcon(html) {
  try {
    // 在 mw-parser-output 区域内查找图片
    const contentMatch = html.match(/<div[^>]*class="mw-parser-output"[^>]*>([\s\S]*?)<\/div>/i);
    const searchArea = contentMatch ? contentMatch[1] : html;
    
    // 优先从srcset提取高清图片
    const srcsetPattern = /srcset="([^"]+)"/i;
    const srcsetMatch = searchArea.match(srcsetPattern);
    
    if (srcsetMatch) {
      // srcset="/images/thumb/5/55/Librarian.png/300px-Librarian.png 1.5x, /images/thumb/5/55/Librarian.png/400px-Librarian.png 2x"
      const urls = srcsetMatch[1].split(',');
      
      // 取最后一个（通常是2x，最高清）
      let iconUrl = urls[urls.length - 1].trim().split(' ')[0];
      
      if (iconUrl.startsWith('/')) {
        iconUrl = 'https://clocktower-wiki.gstonegames.com' + iconUrl;
      }
      
      console.log('[parseRoleIcon] 从srcset提取高清图:', iconUrl);
      return iconUrl;
    }
    
    // 备用：查找包含角色信息的img标签
    const imgPattern = /<img[^>]+alt="[^"]*"[^>]+src="([^"]+)"[^>]*>/i;
    const match = searchArea.match(imgPattern);
    
    if (match) {
      let iconUrl = match[1];
      
      // 跳过装饰图片（top_lace, flower等）
      if (iconUrl.includes('lace') || iconUrl.includes('flower')) {
        console.log('[parseRoleIcon] 跳过装饰图片');
        return null;
      }
      
      // 处理相对路径
      if (iconUrl.startsWith('./')) {
        const fileMatch = iconUrl.match(/\/([\w-]+\.png)$/i);
        if (fileMatch) {
          iconUrl = 'https://clocktower-wiki.gstonegames.com/images/' + fileMatch[1];
        }
      } else if (iconUrl.startsWith('/')) {
        iconUrl = 'https://clocktower-wiki.gstonegames.com' + iconUrl;
      }
      
      console.log('[parseRoleIcon] 提取图标URL:', iconUrl);
      return iconUrl;
    }
    
    console.log('[parseRoleIcon] 未找到图标');
    return null;
  } catch (error) {
    console.error('[parseRoleIcon] 失败:', error);
    return null;
  }
}

/**
 * 主解析函数：整合所有解析
 */
function parseRoleDetail(html) {
  console.log('[parseRoleDetail] 开始详细解析');
  
  const detail = {
    background_story: parseBackgroundStory(html),
    ability: parseAbility(html),
    introduction: parseIntroduction(html),
    examples: parseExamples(html),
    mechanics: parseMechanics(html),
    reminder_tokens: parseReminderTokens(html),
    rule_details: parseRuleDetails(html),
    tips_and_tricks: parseTipsAndTricks(html),
    bluff_tips: parseBluffTips(html),
    character_info: parseCharacterInfo(html),
    icon_url: parseRoleIcon(html)  // 🆕 角色图标
  };
  
  console.log('[parseRoleDetail] 解析完成');
  console.log('- 背景故事:', detail.background_story ? '✓' : '✗');
  console.log('- 角色能力:', detail.ability ? '✓' : '✗');
  console.log('- 角色简介:', detail.introduction.length, '段');
  console.log('- 范例:', detail.examples.length, '条');
  console.log('- 运作方式:', detail.mechanics.length, '步');
  console.log('- 提示标记:', detail.reminder_tokens.length, '个');
  console.log('- 规则细节:', detail.rule_details.length, '条');
  console.log('- 提示技巧:', detail.tips_and_tricks.length, '条');
  console.log('- 伪装方法:', detail.bluff_tips.length, '条');
  console.log('- 角色图标:', detail.icon_url ? '✓' : '✗');
  
  return detail;
}

// 导出所有函数
module.exports = {
  extractSection,
  parseBackgroundStory,
  parseAbility,
  parseIntroduction,
  parseExamples,
  parseMechanics,
  parseReminderTokens,
  parseRuleDetails,
  parseTipsAndTricks,
  parseBluffTips,
  parseCharacterInfo,
  parseRoleIcon,
  parseRoleDetail
};

