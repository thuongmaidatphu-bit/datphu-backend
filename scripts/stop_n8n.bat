@echo off
title Dung n8n Chay Ngam
echo ========================================================
echo   DUNG TIEN TRINH N8N DANG CHAY NGAM (PORT 5678)
echo ========================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5678" ^| findstr "LISTENING"') do (
    echo Dang tat tien trinh PID: %%a...
    taskkill /F /PID %%a
)

echo.
echo Da dung tien trinh n8n thanh cong!
pause
