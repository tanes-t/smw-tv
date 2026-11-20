@echo off
chcp 65001 >nul
echo ========================================================
echo        SMW-TV Automated Pipeline & Deploy Tool
echo ========================================================
echo.
echo [1] Run Local Dev Server (npm run dev)
echo [2] Build & Sync to Android Shell (build + sync:android)
echo [3] Full Deploy to Vercel (git add, commit & push to GitHub)
echo [4] All-in-One: Build, Sync Android, and Deploy to Vercel
echo [5] Exit
echo.
set /p choice="Select an option (1-5): "

if "%choice%"=="1" goto LOCAL_DEV
if "%choice%"=="2" goto SYNC_ANDROID
if "%choice%"=="3" goto DEPLOY_VERCEL
if "%choice%"=="4" goto ALL_IN_ONE
if "%choice%"=="5" goto END

:LOCAL_DEV
echo.
echo [INFO] Starting Local Vite Dev Server...
npm run dev
goto END

:SYNC_ANDROID
echo.
echo [1/2] Building web production assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Aborting.
    pause
    goto END
)
echo [2/2] Syncing to Android assets directory...
call npm run sync:android
echo.
echo [SUCCESS] Synced dist to android-webview-shell successfully!
pause
goto END

:DEPLOY_VERCEL
echo.
set /p commit_msg="Enter commit message (Leave empty for default): "
if "%commit_msg%"=="" set commit_msg="deploy: update SMW-TV assets and fixes"
echo [1/3] Adding changes to git...
git add -A
echo [2/3] Committing changes...
git commit -m "%commit_msg%"
echo [3/3] Pushing to GitHub (Triggers Vercel auto-deploy)...
git push origin main
echo.
echo [SUCCESS] Pushed to GitHub! Vercel is deploying now.
pause
goto END

:ALL_IN_ONE
echo.
echo [1/4] Building web production assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Aborting.
    pause
    goto END
)
echo [2/4] Syncing to Android assets directory...
call npm run sync:android
echo [3/4] Adding changes to git...
git add -A
set /p commit_msg="Enter commit message (Leave empty for default): "
if "%commit_msg%"=="" set commit_msg="deploy: sync android and release to vercel"
git commit -m "%commit_msg%"
echo [4/4] Pushing to GitHub (Vercel deploy)...
git push origin main
echo.
echo [SUCCESS] Complete! Android synced and Vercel updated.
pause
goto END

:END
