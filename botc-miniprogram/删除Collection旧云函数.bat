@echo off
chcp 65001 >nul
echo ====================================
echo 删除 Collection 旧云函数
echo ====================================
echo.

cd /d "%~dp0"

echo 正在删除 Collection 相关旧云函数...
echo.

REM 删除收藏相关云函数
if exist "uniCloud-aliyun\cloudfunctions\favorite-add" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\favorite-add"
    echo [√] 已删除 favorite-add
) else (
    echo [!] favorite-add 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\favorite-remove" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\favorite-remove"
    echo [√] 已删除 favorite-remove
) else (
    echo [!] favorite-remove 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\favorites-list" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\favorites-list"
    echo [√] 已删除 favorites-list
) else (
    echo [!] favorites-list 不存在
)

REM 删除历史记录相关云函数
if exist "uniCloud-aliyun\cloudfunctions\history-add" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\history-add"
    echo [√] 已删除 history-add
) else (
    echo [!] history-add 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\history-list" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\history-list"
    echo [√] 已删除 history-list
) else (
    echo [!] history-list 不存在
)

echo.
echo ====================================
echo Collection 旧云函数本地删除完成！
echo ====================================
echo.
echo 共删除 5 个云函数：
echo   - favorite-add
echo   - favorite-remove
echo   - favorites-list
echo   - history-add
echo   - history-list
echo.
echo 接下来请在 HBuilderX 中删除云端的旧云函数：
echo 1. 打开 HBuilderX
echo 2. 展开 uniCloud 目录
echo 3. 右键点击"云函数列表"
echo 4. 找到上述云函数并删除
echo.
pause

