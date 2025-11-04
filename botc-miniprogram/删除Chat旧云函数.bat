@echo off
chcp 65001 >nul
echo ========================================
echo  删除 Chat 模块旧云函数
echo ========================================
echo.

cd /d "%~dp0"

echo 准备删除以下 Chat 云函数：
echo.
echo   1. chat-send
echo   2. chat-send-message
echo   3. chat-conversations
echo   4. chat-conversation-list
echo   5. chat-mark-read
echo.
echo 共计：5 个云函数
echo.

set /p confirm="确认删除？(Y/N): "
if /i not "%confirm%"=="Y" (
    echo 操作已取消
    pause
    exit /b
)

echo.
echo 开始删除本地云函数...
echo.

cd uniCloud-aliyun\cloudfunctions

if exist chat-send (
    echo [1/5] 删除 chat-send...
    rmdir /s /q chat-send
    echo       ✓ 已删除
) else (
    echo [1/5] chat-send 不存在，跳过
)

if exist chat-send-message (
    echo [2/5] 删除 chat-send-message...
    rmdir /s /q chat-send-message
    echo       ✓ 已删除
) else (
    echo [2/5] chat-send-message 不存在，跳过
)

if exist chat-conversations (
    echo [3/5] 删除 chat-conversations...
    rmdir /s /q chat-conversations
    echo       ✓ 已删除
) else (
    echo [3/5] chat-conversations 不存在，跳过
)

if exist chat-conversation-list (
    echo [4/5] 删除 chat-conversation-list...
    rmdir /s /q chat-conversation-list
    echo       ✓ 已删除
) else (
    echo [4/5] chat-conversation-list 不存在，跳过
)

if exist chat-mark-read (
    echo [5/5] 删除 chat-mark-read...
    rmdir /s /q chat-mark-read
    echo       ✓ 已删除
) else (
    echo [5/5] chat-mark-read 不存在，跳过
)

cd ..\..

echo.
echo ========================================
echo  本地云函数删除完成！
echo ========================================
echo.
echo ⚠️ 重要提示：
echo.
echo 1. 本地云函数已删除
echo 2. 请在 HBuilderX 中删除云端云函数
echo 3. 删除步骤：
echo    - 打开 HBuilderX
echo    - 展开 uniCloud-aliyun/cloudfunctions
echo    - 右键每个旧云函数
echo    - 选择 "删除云端云函数及扩展存储"
echo    - 确认删除
echo.
echo 需要删除的云端云函数：
echo   • chat-send
echo   • chat-send-message
echo   • chat-conversations
echo   • chat-conversation-list
echo   • chat-mark-read
echo.
echo ========================================
echo.

pause

