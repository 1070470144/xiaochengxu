/**
 * 钟楼百科URL配置
 * 定义所有需要同步的百科页面
 */

module.exports = {
  // 角色URL列表
  roles: [
    // 暗流涌动 - 镇民
    'https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇',
    'https://clocktower-wiki.gstonegames.com/index.php?title=图书管理员',
    'https://clocktower-wiki.gstonegames.com/index.php?title=调查员',
    'https://clocktower-wiki.gstonegames.com/index.php?title=厨师',
    'https://clocktower-wiki.gstonegames.com/index.php?title=共情者',
    'https://clocktower-wiki.gstonegames.com/index.php?title=占卜师',
    'https://clocktower-wiki.gstonegames.com/index.php?title=送葬者',
    'https://clocktower-wiki.gstonegames.com/index.php?title=僧侣',
    'https://clocktower-wiki.gstonegames.com/index.php?title=渡鸦守卫',
    'https://clocktower-wiki.gstonegames.com/index.php?title=守鸦人',
    'https://clocktower-wiki.gstonegames.com/index.php?title=处女',
    'https://clocktower-wiki.gstonegames.com/index.php?title=杀手',
    'https://clocktower-wiki.gstonegames.com/index.php?title=市长',
    
    // 暗流涌动 - 外来者
    'https://clocktower-wiki.gstonegames.com/index.php?title=管家',
    'https://clocktower-wiki.gstonegames.com/index.php?title=酒鬼',
    'https://clocktower-wiki.gstonegames.com/index.php?title=隐士',
    'https://clocktower-wiki.gstonegames.com/index.php?title=圣徒',
    
    // 暗流涌动 - 爪牙
    'https://clocktower-wiki.gstonegames.com/index.php?title=投毒者',
    'https://clocktower-wiki.gstonegames.com/index.php?title=间谍',
    'https://clocktower-wiki.gstonegames.com/index.php?title=猩红女郎',
    'https://clocktower-wiki.gstonegames.com/index.php?title=男爵',
    
    // 暗流涌动 - 恶魔
    'https://clocktower-wiki.gstonegames.com/index.php?title=小恶魔',
    'https://clocktower-wiki.gstonegames.com/index.php?title=中毒恶魔',
    'https://clocktower-wiki.gstonegames.com/index.php?title=芬里尔',
    'https://clocktower-wiki.gstonegames.com/index.php?title=维戈莫塔斯'
  ],
  
  // 剧本URL列表
  scripts: [
    'https://clocktower-wiki.gstonegames.com/index.php?title=暗流涌动',
    'https://clocktower-wiki.gstonegames.com/index.php?title=黯月初升',
    'https://clocktower-wiki.gstonegames.com/index.php?title=梦殒春宵'
  ],
  
  // 规则URL列表
  rules: [
    'https://clocktower-wiki.gstonegames.com/index.php?title=规则概要',
    'https://clocktower-wiki.gstonegames.com/index.php?title=术语汇总',
    'https://clocktower-wiki.gstonegames.com/index.php?title=重要细节',
    'https://clocktower-wiki.gstonegames.com/index.php?title=给说书人的建议',
    'https://clocktower-wiki.gstonegames.com/index.php?title=相克规则'
  ],
  
  // 获取所有URL
  getAllUrls() {
    return [...this.roles, ...this.scripts, ...this.rules];
  },
  
  // 根据类型获取URL
  getUrlsByType(type) {
    switch(type) {
      case 'roles':
        return this.roles;
      case 'scripts':
        return this.scripts;
      case 'rules':
        return this.rules;
      case 'all':
      default:
        return this.getAllUrls();
    }
  },
  
  // 获取URL数量统计
  getStats() {
    return {
      roles: this.roles.length,
      scripts: this.scripts.length,
      rules: this.rules.length,
      total: this.getAllUrls().length
    };
  }
};

