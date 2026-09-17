@echo off
title Rotta do Acai - Sistema de Pedidos e Gestao
echo ==============================================================
echo             ROTTA DO ACAI - CARREGANDO SISTEMA...
echo ==============================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor_local.ps1"
pause
