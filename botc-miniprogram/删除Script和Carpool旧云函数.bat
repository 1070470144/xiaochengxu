@echo off
chcp 65001 >nul
echo ========================================
echo 删除 Script 和 Carpool 旧云函数
echo ========================================
echo.

echo 准备删除以下云函数：
echo.
echo [Script 相关] 13 个云函数
echo   - script-list
echo   - script-detail
echo   - script-upload
echo   - script-my-uploads
echo   - script-delete
echo   - script-review-create
echo   - script-rating
echo   - script-json-get
echo   - script-ranking-hot
echo   - script-ranking-new
echo   - script-ranking-rating
echo   - script-ranking-download
echo   - script-calculate-heat
echo.
echo [Carpool 相关] 9 个云函数
echo   - carpool-create
echo   - carpool-list
echo   - carpool-detail
echo   - carpool-apply
echo   - carpool-applied-list
echo   - carpool-cancel-apply
echo   - carpool-confirm-member
echo   - carpool-remove-member
echo   - carpool-update-status
echo.
echo ⚠️  注意：script-generate-json-url 将被保留（用于外部URL访问）
echo.
echo ========================================
pause

echo.
echo 开始删除 Script 相关云函数...
echo.

if exist "uniCloud-aliyun\cloudfunctions\script-list" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-list"
    echo [✓] 已删除 script-list
) else (
    echo [!] script-list 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-detail" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-detail"
    echo [✓] 已删除 script-detail
) else (
    echo [!] script-detail 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-upload" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-upload"
    echo [✓] 已删除 script-upload
) else (
    echo [!] script-upload 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-my-uploads" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-my-uploads"
    echo [✓] 已删除 script-my-uploads
) else (
    echo [!] script-my-uploads 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-delete" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-delete"
    echo [✓] 已删除 script-delete
) else (
    echo [!] script-delete 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-review-create" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-review-create"
    echo [✓] 已删除 script-review-create
) else (
    echo [!] script-review-create 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-rating" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-rating"
    echo [✓] 已删除 script-rating
) else (
    echo [!] script-rating 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-json-get" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-json-get"
    echo [✓] 已删除 script-json-get
) else (
    echo [!] script-json-get 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-ranking-hot" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-ranking-hot"
    echo [✓] 已删除 script-ranking-hot
) else (
    echo [!] script-ranking-hot 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-ranking-new" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-ranking-new"
    echo [✓] 已删除 script-ranking-new
) else (
    echo [!] script-ranking-new 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-ranking-rating" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-ranking-rating"
    echo [✓] 已删除 script-ranking-rating
) else (
    echo [!] script-ranking-rating 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-ranking-download" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-ranking-download"
    echo [✓] 已删除 script-ranking-download
) else (
    echo [!] script-ranking-download 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\script-calculate-heat" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\script-calculate-heat"
    echo [✓] 已删除 script-calculate-heat
) else (
    echo [!] script-calculate-heat 不存在
)

echo.
echo 开始删除 Carpool 相关云函数...
echo.

if exist "uniCloud-aliyun\cloudfunctions\carpool-create" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-create"
    echo [✓] 已删除 carpool-create
) else (
    echo [!] carpool-create 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-list" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-list"
    echo [✓] 已删除 carpool-list
) else (
    echo [!] carpool-list 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-detail" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-detail"
    echo [✓] 已删除 carpool-detail
) else (
    echo [!] carpool-detail 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-apply" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-apply"
    echo [✓] 已删除 carpool-apply
) else (
    echo [!] carpool-apply 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-applied-list" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-applied-list"
    echo [✓] 已删除 carpool-applied-list
) else (
    echo [!] carpool-applied-list 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-cancel-apply" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-cancel-apply"
    echo [✓] 已删除 carpool-cancel-apply
) else (
    echo [!] carpool-cancel-apply 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-confirm-member" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-confirm-member"
    echo [✓] 已删除 carpool-confirm-member
) else (
    echo [!] carpool-confirm-member 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-remove-member" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-remove-member"
    echo [✓] 已删除 carpool-remove-member
) else (
    echo [!] carpool-remove-member 不存在
)

if exist "uniCloud-aliyun\cloudfunctions\carpool-update-status" (
    rmdir /s /q "uniCloud-aliyun\cloudfunctions\carpool-update-status"
    echo [✓] 已删除 carpool-update-status
) else (
    echo [!] carpool-update-status 不存在
)

echo.
echo ========================================
echo 删除完成！
echo ========================================
echo.
echo 已删除 22 个旧云函数
echo ✅ script-generate-json-url 已保留（用于外部访问）
echo.
echo 📝 请注意：
echo   1. 本地文件已删除，云端文件需要在 uniCloud 控制台手动删除
echo   2. 删除前请确保新云对象已上传并测试通过
echo   3. 详细信息请查看：DELETE_OLD_CLOUD_FUNCTIONS.md
echo.
pause

