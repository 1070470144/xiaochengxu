# ⚡ 热度定时任务 - 快速配置（5分钟）

## 🎯 目标

让热度榜每天凌晨3点自动更新

---

## 📋 操作步骤

### 1️⃣ 上传云函数（1分钟）

在 HBuilderX 中：

```
右键点击：
botc-miniprogram/uniCloud-aliyun/cloudfunctions/storyteller-calculate-heat

选择：上传部署

等待：看到"上传成功"提示
```

---

### 2️⃣ 测试云函数（1分钟）

确认功能正常：

```
右键点击：
storyteller-calculate-heat

选择：云端运行

参数留空或输入：{}

点击：运行

期望结果：
{
  "code": 0,
  "message": "成功计算 X 个说书人的热度",
  "data": { ... }
}
```

✅ 看到成功信息即可继续

---

### 3️⃣ 配置定时器（3分钟）

#### 📱 方法A：HBuilderX（最简单）

```
1. 右键点击：storyteller-calculate-heat
2. 选择：管理定时触发器
3. 点击：新增触发器
4. 填写：
   触发器名称：每日计算热度
   Cron 表达式：0 3 * * *
   时区：Asia/Shanghai
   启用：打勾 ✅
5. 点击：确定
```

#### 🌐 方法B：Web 控制台

```
1. 浏览器打开：https://unicloud.dcloud.net.cn/
2. 选择您的服务空间
3. 进入：云函数 → storyteller-calculate-heat
4. 切换：定时触发 标签
5. 点击：新增触发器
6. 填写：
   Cron 表达式：0 3 * * *
   时区：Asia/Shanghai
   启用：✅
7. 保存
```

---

## ✅ 完成检查

配置完成后，检查以下几点：

- [ ] ✅ 云函数已上传
- [ ] ✅ 手动运行成功
- [ ] ✅ 定时器已配置
- [ ] ✅ 定时器已启用

全部打勾后，配置完成！

---

## 🎉 配置成功

现在：

✅ **每天凌晨3点**，系统会自动：
1. 计算所有说书人的热度
2. 更新热度分数
3. 热度榜自动刷新

✅ **无需人工干预**，完全自动化

✅ **成本几乎为0**，每月不到1分钱

---

## 💡 常见问题

### Q: 可以立即看到热度吗？

A: 定时任务要到凌晨3点才执行。

如果想立即看到效果：
```
右键 storyteller-calculate-heat → 云端运行
```

### Q: 可以改变执行时间吗？

A: 可以！修改 Cron 表达式：

| 时间 | Cron 表达式 |
|------|------------|
| 凌晨3点 | `0 3 * * *` |
| 中午12点 | `0 12 * * *` |
| 每6小时 | `0 */6 * * *` |
| 每天2次 | `0 3,15 * * *` |

### Q: 如何查看执行日志？

A: 
```
uniCloud Web 控制台 
→ 云函数 
→ storyteller-calculate-heat 
→ 日志
```

---

## 🔗 相关文档

- 详细配置指南：`HEAT_SCORE_AUTO_CALCULATE_SETUP.md`
- 完整系统文档：`STORYTELLER_STATS_SYSTEM.md`
- 部署指南：`../botc-admin/STORYTELLER_RANKING_FIX_GUIDE.md`

---

**配置时间**：5 分钟  
**难度**：⭐ 非常简单  
**效果**：热度榜自动更新 🎉

