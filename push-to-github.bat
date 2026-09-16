@echo off
REM ============================================================
REM  ECHO-09 · 回声档案  ——  一键推送到 GitHub + 开启 Pages
REM  用法：把本文件放到 wig-echo 目录下，双击运行。
REM  前提：本机已装 git，且已完成 GitHub 登录（SSH key 或 PAT）
REM ============================================================
setlocal
cd /d "%~dp0"

echo [1/6] 检查 git ...
where git >nul 2>nul || (echo 未找到 git，请先安装 https://git-scm.com/ && pause && exit /b 1)

echo.
echo [2/6] 检查远端配置 ...
git remote -v
echo.
echo   如果上面是空的，执行下面这行添加远端（仓库名按需改）：
echo     git remote add origin git@github.com:imz-a/echo-09.git
echo   ^(HTTPS 会被本机代理的 CONNECT 502 挡住，请用 SSH^)
echo.
set /p REMOTE_OK="远端已配置好且用 SSH 吗? (y/n): "
if /i not "%REMOTE_OK%"=="y" (
  echo 请先在 GitHub 网页端建好空仓库 echo-09，然后：
  echo   git remote add origin git@github.com:imz-a/echo-09.git
  pause && exit /b 1
)

echo.
echo [3/6] 推送 main 分支 ...
git push -u origin main || (echo 推送失败，请检查 SSH key 是否已加到 GitHub && pause && exit /b 1)

echo.
echo [4/6] 推送标签/其他分支（如有）...
git push --all origin
git push --tags origin

echo.
echo [5/6] 完成。接下来去 GitHub 仓库页面：
echo   Settings - Pages - Source 选择 "GitHub Actions"
echo   本仓库已含 .github/workflows/pages.yml，会自动部署。
echo.
echo [6/6] 部署完成后访问：
echo   https://imz-a.github.io/echo-09/
echo.

echo 本地校验（可选）：运行全部测试
set NODE=C:\Users\zongs\.workbuddy\binaries\node\versions\22.22.2-3\node.exe
if exist "%NODE%" (
  set NODE_PATH=C:\Users\zongs\.workbuddy\binaries\node\workspace\node_modules
  echo   - selftest / audit / timeline / pathcheck / smoketest
  "%NODE%" tests\_selftest.js
  "%NODE%" tests\_audit.js
  "%NODE%" tests\_timeline.js
  "%NODE%" tests\_pathcheck.js
  "%NODE%" tests\_smoketest.js
) else (
  echo   (未找到便携 node，跳过本地测试)
)

echo.
echo 全部完成。
pause
