@echo off
title AI Browser Bridge Chrome (Port 9222) - Claude & AiPASS
echo ========================================================
echo  Launching Chrome with Remote Debugging on Port 9222...
echo ========================================================

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="%LOCALAPPDATA%\Google\Chrome\AiBridgeData" "https://claude.ai/new"

echo.
echo Browser opened! Please log in to your Claude account on the tab.
echo Keep this browser window open so Antigravity can connect.
echo.
pause

