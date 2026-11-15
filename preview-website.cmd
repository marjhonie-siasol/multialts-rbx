@echo off
title MultiRoblox Website Preview
echo ====================================================
echo Starting MultiRoblox Local Website Preview Server...
echo URL: http://localhost:3000
echo Press Ctrl + C in this window to stop the server.
echo ====================================================
python -m http.server 3000 --directory docs
pause
