/**
 * wiki-parse-url 云函数测试脚本
 * 
 * 使用方法：
 * 在 HBuilderX 中右键云函数 → 运行-云端
 * 或在 uniCloud Web控制台中测试
 */

// 测试用例1：解析角色页面 - 洗衣妇
const test1 = {
  url: 'https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇',
  force_refresh: false
};

// 测试用例2：解析规则页面 - 规则概要
const test2 = {
  url: 'https://clocktower-wiki.gstonegames.com/index.php?title=规则概要',
  force_refresh: false
};

// 测试用例3：解析剧本页面 - 暗流涌动
const test3 = {
  url: 'https://clocktower-wiki.gstonegames.com/index.php?title=暗流涌动',
  force_refresh: false
};

// 测试用例4：强制刷新缓存
const test4 = {
  url: 'https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇',
  force_refresh: true
};

// 测试用例5：无效URL
const test5 = {
  url: 'https://baidu.com'
};

// 测试用例6：空URL
const test6 = {
  url: ''
};

// 导出测试用例（在云函数测试界面使用）
module.exports = {
  test1,  // 推荐：首先运行此测试
  test2,
  test3,
  test4,
  test5,
  test6
};

/**
 * 测试执行说明：
 * 
 * 1. 在 HBuilderX 中：
 *    右键 wiki-parse-url → 运行-云端
 *    复制上面的测试用例到参数输入框
 * 
 * 2. 预期结果：
 *    test1-test4: code 为 0，解析成功
 *    test5-test6: code 为 400，返回错误信息
 * 
 * 3. 验证要点：
 *    - entry_type 是否正确（role/rule/script）
 *    - title 是否正确提取
 *    - content 是否有内容
 *    - role_info 是否正确（针对角色）
 *    - 缓存机制是否工作
 */

