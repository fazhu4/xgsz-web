@echo off
chcp 65001 >nul
title 芯光数智官网
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-project.ps1"
if errorlevel 1 pause
