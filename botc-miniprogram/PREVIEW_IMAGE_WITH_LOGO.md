# 预览图显示角色图片功能

## ✅ 已实现

预览图生成器现在支持显示JSON中的角色图片logo！

---

## 🎨 实现方式

### 优先级逻辑
```
有图片 → 显示图片（圆形裁剪）
无图片 → 显示首字母（备用方案）
```

### 三个位置都支持图片

1. **角色列表中的logo** ✅
2. **首夜行动顺序的logo** ✅
3. **其他夜晚行动的logo** ✅

---

## 💡 技术实现

### SVG图片嵌入
```xml
<!-- 使用clipPath裁剪成圆形 -->
<defs>
  <clipPath id="clip-washerwoman">
    <circle cx="100" cy="100" r="10"/>
  </clipPath>
</defs>

<!-- 背景圆圈（边框效果） -->
<circle cx="100" cy="100" r="11" fill="#10b981" opacity="0.2"/>

<!-- 嵌入图片并裁剪 -->
<image 
  href="https://example.com/washerwoman.png" 
  x="90" 
  y="90" 
  width="20" 
  height="20" 
  clip-path="url(#clip-washerwoman)" 
  preserveAspectRatio="xMidYMid slice"
/>
```

### JSON格式要求

**角色数据需要包含image字段**:
```json
{
  "id": "washerwoman",
  "name": "洗衣妇",
  "team": "townsfolk",
  "ability": "开局得知某位玩家的角色",
  "image": "https://example.com/icons/washerwoman.png",  ← 图片URL
  "firstNight": 15
}
```

---

## 🧪 测试

### 测试JSON（带图片）

```json
[
  {
    "id": "_meta",
    "name": "测试剧本",
    "author": "测试作者"
  },
  {
    "id": "washerwoman",
    "name": "洗衣妇",
    "team": "townsfolk",
    "ability": "开局得知某位玩家的角色",
    "image": "https://github.com/bra1n/townsquare/raw/main/src/assets/icons/washerwoman.png",
    "firstNight": 15
  },
  {
    "id": "imp",
    "name": "小恶魔",
    "team": "demon",
    "ability": "每夜选择一名玩家杀死",
    "image": "https://github.com/bra1n/townsquare/raw/main/src/assets/icons/imp.png",
    "otherNight": 21
  }
]
```

### 预期效果

**有图片的角色**:
```
[洗衣妇图片] 洗衣妇
             开局得知某位玩家的角色

[小恶魔图片] 小恶魔
             每夜选择一名玩家杀死
```

**无图片的角色**:
```
[洗] 洗衣妇        ← 显示首字母
     开局得知某位玩家的角色
```

---

## 📊 完整功能对比

| 位置 | 有image字段 | 无image字段 |
|-----|-----------|-----------|
| 角色列表 | 显示图片 | 显示首字母 |
| 首夜行动 | 显示图片 | 显示首字母 |
| 其他夜晚 | 显示图片 | 显示首字母 |

---

## 🎯 优势

### 1. 视觉效果更好
- ✅ 真实角色图片更直观
- ✅ 更专业的预览效果
- ✅ 更容易识别角色

### 2. 兼容性好
- ✅ 有图片就显示图片
- ✅ 无图片就显示首字母
- ✅ 不会因为缺图而报错

### 3. 符合原设计
- ✅ 参考用户提供的TypeScript代码
- ✅ SVG image标签嵌入
- ✅ clipPath圆形裁剪

---

## 🚀 使用方法

### 步骤 1: 准备带图片的JSON
```
确保JSON中每个角色都有image字段：
{
  "id": "washerwoman",
  "image": "https://角色图片URL.png"
}
```

### 步骤 2: 上传云函数
```
HBuilderX中：
右键 script-upload → 上传并运行
```

### 步骤 3: 上传剧本测试
```
1. 工具 → 剧本上传
2. 粘贴带图片URL的JSON
3. 提交上传
4. 查看生成的预览图
→ 应该能看到角色的真实图片！
```

---

## 📝 图片来源

### 官方图标库
```
Blood on the Clocktower 官方图标：
https://github.com/bra1n/townsquare/tree/main/src/assets/icons

例如：
washerwoman.png
librarian.png
imp.png
poisoner.png
等等...
```

### 使用示例
```
"image": "https://github.com/bra1n/townsquare/raw/main/src/assets/icons/washerwoman.png"
```

---

## ⚠️ 注意事项

### 图片URL要求
- ✅ 必须是公网可访问的URL
- ✅ 推荐使用HTTPS
- ✅ 图片格式：PNG, JPG, SVG都支持
- ✅ 推荐尺寸：64x64 到 512x512

### 备用方案
- ✅ 如果图片加载失败，会自动降级到首字母
- ✅ 不影响整体预览图生成

---

## 🎉 完成状态

- [x] 角色列表支持图片logo
- [x] 首夜行动支持图片logo
- [x] 其他夜晚支持图片logo
- [x] 圆形裁剪效果
- [x] 自动降级到首字母
- [x] 修改云函数代码

---

**完成日期**: 2025年10月15日  
**功能**: 预览图显示角色图片  
**状态**: ✅ 完成  
**版本**: v3.0.0 with Images


