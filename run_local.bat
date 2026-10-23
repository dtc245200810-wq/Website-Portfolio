@echo off
chcp 65001 >nul
title Website Portfolio & Admin CMS - De 13 (To Vu Dat)
echo ======================================================================
echo  KHOI DONG WEBSITE PORTFOLIO & ADMIN CMS (DE 13) - CHE DO STANDALONE
echo  Sinh vien: To Vu Dat - DTC245200810 - Lop: CNTT K23I
echo ======================================================================
echo.

python "%~dp0scripts\run_standalone.py"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Neu gap loi, vui long kiem tra Python hoac Node.js tren may tinh.
    pause
)
