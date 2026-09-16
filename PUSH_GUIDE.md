# ECHO-09 推送指南（手动，3 步）

本机网络实测结论：**HTTPS 通道走不通**（`github.com:443` 被拦，代理的 CONNECT 隧道返回 502），
但 **SSH 通道可用**（`github.com:22` / `ssh.github.com:443` 均通）。所以请用 SSH 推送。

---

## 第 1 步：在 GitHub 网页端建一个空仓库

打开 https://github.com/new

- Repository name: `echo-09`
- 可见性：Public（Pages 免费账号需 public）
- **不要**勾选 Add README / .gitignore / license（保持空仓库，否则会冲突）

---

## 第 2 步：把本地仓库指向它（在 `D:\2atools\Workboddy\wig-echo` 下执行）

```bash
git remote add origin git@github.com:imz-a/echo-09.git
git push -u origin main
```

如果你的 SSH key 还没加到 GitHub：
- 打开 https://github.com/settings/keys → New SSH key → 粘贴 `~/.ssh/id_ed25519.pub` 内容
- 验证：`ssh -T git@github.com`

> 万一 SSH 也不行，改用 HTTPS + PAT（个人访问令牌，勾 `repo` 权限）：
> ```bash
> git remote add origin https://github.com/imz-a/echo-09.git
> git push https://<你的用户名>:<PAT>@github.com/imz-a/echo-09.git main
> ```
> HTTPS 直连若报 `CONNECT tunnel failed 502`，先临时清掉代理：
> ```bash
> set HTTP_PROXY= & set HTTPS_PROXY= & set http_proxy= & set https_proxy=
> ```
> （若直连报 443 超时，说明只有 SSH 走得通，请回到 SSH 方案。）

---

## 第 3 步：开启 Pages

仓库页面 → **Settings → Pages** → Source 选择 **GitHub Actions**

本仓库已内置 `.github/workflows/pages.yml`，推送后会自动构建部署。

部署完成后地址：**https://imz-a.github.io/echo-09/**

---

## 附：仓库当前状态

- 分支 `main`，工作区干净，18 个受版本控制文件
- 无远端（等你第 2 步接上）
- 5 个测试套件全绿：`tests/_selftest.js`、`_audit.js`、`_timeline.js`、`_pathcheck.js`、`_smoketest.js`

运行测试（PowerShell）：

```powershell
$env:NODE_PATH="C:\Users\zongs\.workbuddy\binaries\node\workspace\node_modules"
& "C:\Users\zongs\.workbuddy\binaries\node\versions\22.22.2-3\node.exe" tests\_smoketest.js
```

懒得敲命令的话，直接双击目录里的 **`push-to-github.bat`**。
