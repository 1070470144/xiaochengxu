@echo off
chcp 65001 >nul
echo ========================================
echo 删除已被 user 云对象替换的旧云函数
echo ========================================
echo.

set BASE_DIR=uniCloud-aliyun\cloudfunctions

echo 准备删除以下云函数文件夹：
echo.
echo 1.  user-add-exp
echo 2.  user-follow
echo 3.  user-follow-sync
echo 4.  user-followers-list
echo 5.  user-following-list
echo 6.  user-info
echo 7.  user-level-info
echo 8.  user-login
echo 9.  user-logout
echo 10. user-profile
echo 11. user-send-sms
echo 12. user-stats
echo 13. user-update
echo.

set /p CONFIRM="确认删除？(Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 操作已取消
    pause
    exit /b
)

echo.
echo 开始删除...
echo.

rd /s /q "%BASE_DIR%\user-add-exp" 2>nul && echo ✓ 已删除 user-add-exp || echo ✗ user-add-exp 不存在或已删除
rd /s /q "%BASE_DIR%\user-follow" 2>nul && echo ✓ 已删除 user-follow || echo ✗ user-follow 不存在或已删除
rd /s /q "%BASE_DIR%\user-follow-sync" 2>nul && echo ✓ 已删除 user-follow-sync || echo ✗ user-follow-sync 不存在或已删除
rd /s /q "%BASE_DIR%\user-followers-list" 2>nul && echo ✓ 已删除 user-followers-list || echo ✗ user-followers-list 不存在或已删除
rd /s /q "%BASE_DIR%\user-following-list" 2>nul && echo ✓ 已删除 user-following-list || echo ✗ user-following-list 不存在或已删除
rd /s /q "%BASE_DIR%\user-info" 2>nul && echo ✓ 已删除 user-info || echo ✗ user-info 不存在或已删除
rd /s /q "%BASE_DIR%\user-level-info" 2>nul && echo ✓ 已删除 user-level-info || echo ✗ user-level-info 不存在或已删除
rd /s /q "%BASE_DIR%\user-login" 2>nul && echo ✓ 已删除 user-login || echo ✗ user-login 不存在或已删除
rd /s /q "%BASE_DIR%\user-logout" 2>nul && echo ✓ 已删除 user-logout || echo ✗ user-logout 不存在或已删除
rd /s /q "%BASE_DIR%\user-profile" 2>nul && echo ✓ 已删除 user-profile || echo ✗ user-profile 不存在或已删除
rd /s /q "%BASE_DIR%\user-send-sms" 2>nul && echo ✓ 已删除 user-send-sms || echo ✗ user-send-sms 不存在或已删除
rd /s /q "%BASE_DIR%\user-stats" 2>nul && echo ✓ 已删除 user-stats || echo ✗ user-stats 不存在或已删除
rd /s /q "%BASE_DIR%\user-update" 2>nul && echo ✓ 已删除 user-update || echo ✗ user-update 不存在或已删除

echo.
echo ========================================
echo 删除完成！
echo ========================================
echo.
echo 提示：
echo 1. 本地文件已删除
echo 2. 还需要在 HBuilderX 中右键云函数列表
echo 3. 选择"删除云端云函数或云对象"
echo 4. 逐个删除云端的旧云函数
echo.

pause

