# 🔐 管理后台密码重置指南

## 🎯 忘记管理员账号密码？

有3种方法可以重置！

---

## 方法1：通过云数据库重置（最简单）✅

### 步骤：

#### 1. 打开 uniCloud Web控制台
```
访问：https://unicloud.dcloud.net.cn
登录您的账号
选择云服务空间
```

#### 2. 进入云数据库
```
左侧菜单 → 云数据库
找到集合：uni-id-users
点击进入
```

#### 3. 查找管理员账号
```
在数据列表中找到您的管理员账号
（通常第一个创建的用户就是管理员）
或者根据用户名查找
```

#### 4. 重置密码
```
方式A：直接修改密码字段
1. 点击该用户记录的"编辑"按钮
2. 找到 password 字段
3. 删除原密码（密文）
4. 输入新密码的MD5值

方式B：使用临时密码
1. 点击"编辑"
2. password 字段输入：
   e10adc3949ba59abbe56e057f20f883e
   （这是"123456"的MD5值）
3. 保存
4. 用账号 + 密码"123456"登录
5. 登录后立即修改密码
```

---

## 方法2：创建新的管理员账号

### 步骤：

#### 1. 在云数据库中
```
云数据库 → uni-id-users 集合
点击"添加数据"
```

#### 2. 插入新管理员数据
```json
{
  "username": "admin2",
  "password": "e10adc3949ba59abbe56e057f20f883e",
  "role": ["admin"],
  "mobile": "",
  "email": "",
  "nickname": "新管理员",
  "status": 0,
  "register_date": 1729152000000,
  "register_ip": "127.0.0.1"
}
```

#### 3. 保存后登录
```
账号：admin2
密码：123456
```

---

## 方法3：通过HBuilderX重置

### 步骤：

#### 1. 运行注册管理员云函数
```
HBuilderX → botc-admin 项目
找到云函数：uni-id-co（如果有）
或创建一个临时云函数来注册管理员
```

#### 2. 创建临时重置云函数

创建文件：`botc-admin/uniCloud-aliyun/cloudfunctions/reset-admin/index.js`

```javascript
'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  
  try {
    // 查找第一个管理员
    const res = await db.collection('uni-id-users')
      .where({
        role: db.command.in(['admin'])
      })
      .limit(1)
      .get();
    
    if (res.data && res.data.length > 0) {
      const userId = res.data[0]._id;
      
      // 重置密码为 123456
      await db.collection('uni-id-users')
        .doc(userId)
        .update({
          password: 'e10adc3949ba59abbe56e057f20f883e'
        });
      
      return {
        code: 0,
        message: '密码已重置为: 123456',
        data: {
          username: res.data[0].username
        }
      };
    } else {
      return {
        code: 404,
        message: '未找到管理员账号'
      };
    }
  } catch (error) {
    return {
      code: 500,
      message: '重置失败: ' + error.message
    };
  }
};
```

#### 3. 运行云函数
```
右键 reset-admin → 上传部署
右键 reset-admin → 运行-云端
查看返回的用户名
使用 用户名 + 密码"123456" 登录
```

---

## 💡 常用密码的MD5值

如果需要设置其他密码，使用对应的MD5值：

| 密码 | MD5值 |
|------|-------|
| 123456 | e10adc3949ba59abbe56e057f20f883e |
| admin | 21232f297a57a5a743894a0e4a801fc3 |
| 123456789 | 25f9e794323b453885f5181f1b624d0b |
| admin123 | 0192023a7bbd73250516f069df18b500 |

---

## 🎯 推荐方案

### ⭐ 推荐：方法1（云数据库直接修改）

**最快最简单！**

```bash
1. uniCloud控制台
2. 云数据库 → uni-id-users
3. 找到管理员记录
4. 编辑 password 字段
5. 输入：e10adc3949ba59abbe56e057f20f883e
6. 保存
7. 用密码"123456"登录 ✅
```

---

## ✅ 登录后立即修改密码

### 修改密码步骤：

```bash
1. 登录成功后
2. 右上角头像 → 个人资料
3. 或者：系统管理 → 用户管理 → 编辑自己
4. 修改密码
5. 保存 ✅
```

---

## 🔒 安全建议

1. ✅ 重置密码后立即修改
2. ✅ 使用强密码
3. ✅ 定期更换密码
4. ✅ 不要使用"123456"作为正式密码

---

## 🆘 如果还是无法登录

### 检查项：

- [ ] 确认输入的是正确的用户名
- [ ] 确认密码已在数据库中更新
- [ ] 清除浏览器缓存
- [ ] 尝试无痕模式登录
- [ ] 检查用户的 status 字段是否为 0（正常）

---

## 📞 需要帮助？

如果上述方法都不行，请告诉我：
1. 使用了哪种方法
2. 遇到什么错误
3. 云数据库中能否找到 uni-id-users 集合

我会继续帮您！🔧

---

**文档创建**: 2025年10月17日  
**推荐方案**: 方法1（云数据库直接修改）

