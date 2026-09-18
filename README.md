# ECHO-09 · 回声档案

![ECHO-09 · 回声档案 封面](assets/img/cover.jpg)

> 一个纯前端的**网页解密游戏（WIG, Web Interactive Game）**。你扮演一名档案调查员，在一台「2011 年的旧电脑」里，用搜索引擎、论坛、网盘、邮箱、企业内网和终端，拼出一个失踪者的真相。

**在线试玩：** https://imz-a.github.io/echo-09/

---

## 这是什么

不是点击找物的密室，也不是靠运气的猜谜。整个游戏只有一台拟真电脑桌面和 9 个站点：

| 站点 | 类型 | 作用 |
| --- | --- | --- |
| 委托信 | 文档 | 开场：给你一个名字 |
| 搜鸿搜索 | 搜索引擎 | 全局线索入口 |
| 深蓝 BBS | 论坛（Discuz! 风） | 人物关系、被折叠的帖子 |
| 云雀网盘 | 网盘 | 带提取码的文件 |
| 回声小站 | 博客 | 她的日记 |
| 星尘邮箱 | 企业 WebMail | 内部通知 |
| 星尘内网 | 企业后台 | 员工档案 / 日志 / 语料库 |
| 终端 | 命令行 | 键盘移位解码、回收密钥 |
| 线索板 | 辅助 | 自动归档线索 + 两档提示 |

**密码不在别处，就在已经写下的文字里。** 5 道密码锁层层递进：一个日子 → 一只猫的名字 → 键盘错位 → 两段密钥拼接 → 终端回收。

内容规模：38 条线索 · 6 个论坛帖 · 10 封邮件 · 4 个网盘文件 · 4 篇博客 · 5 个成就 · 2 个结局 · 10 级防卡关提示。

## 怎么玩

打开链接即可，无需安装。按任意键进入桌面。

- 建议**戴耳机**（有实时合成的环境音效，可在顶栏关闭）。
- 支持存档：进度存在浏览器 `localStorage`，关掉页面下次继续。
- 想重玩：顶栏「重置」，或访问 `...?` 后在地址栏加 `#reset`。
- 卡关时点开**线索板**底部的「卡住了？」：两档提示（委婉 / 直答）。选过某一档后，提示会**跟着进度自动换到下一条**。
- 实在过不去：**[完整通关攻略 → WALKTHROUGH.md](WALKTHROUGH.md)**（含五段密码链总览、38 条线索分布、排查清单，按最小剧透组织）。

## 技术说明

零构建、零依赖、零后端——就是一组静态文件，扔到任何静态托管上都能跑。

```
index.html          入口
css/style.css       视觉系统 v3（拟真电脑：照片壁纸 / Aqua 窗口 / 各站点真实样式）
js/icons.js         50 个线性 SVG 图标 + 彩色应用图标
js/data.js          全部内容数据（剧情 / 密码 / 线索）
js/core.js          状态、存档、窗口管理、音效（WebAudio 实时合成，无音频文件）
js/apps.js          各站点渲染器
js/main.js          开机引导序列
assets/img/         真实照片（壁纸 / 博客封面 / 猫）+ 作品封面（cover.jpg / cover-social.jpg）
tests/              自测与审计脚本（不属于游戏本体，部署时已排除）
```

**兼容性**：所有资源引用均为相对路径，无 `fetch()` / XHR / ES Module / `file://` 依赖，因此可直接部署在 GitHub Pages 的**子路径**下（`用户名.github.io/仓库名/`）。

## 本地运行

因为用了本地文件，请用任意静态服务器打开（直接双击 `index.html` 也能玩，但推荐起个服务）：

```bash
# 任选其一
npx serve .
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 自测

五套脚本，全部纯 Node、无需构建：

```bash
# 1) 数据完整性 + 密码链（无需依赖）
node tests/_selftest.js

# 2) 剧情链路审计：38 条线索的来源、解锁死锁、结局链路、提示覆盖
node tests/_audit.js

# 3) 叙事时间线一致性 + 数字交叉核对
node tests/_timeline.js

# 4) GitHub Pages 子路径资源检查（本地起 http server 校验全部引用）
node tests/_pathcheck.js

# 5) 完整通关模拟（需要 jsdom）
npm i jsdom
node tests/_smoketest.js
```

`_smoketest.js` 用 jsdom 真实执行一遍从开机到结局的完整流程，共 60+ 项断言，覆盖密码链、存档、图标、视觉层、窗口交互，并在结尾检查无 JS 运行时错误。

## 部署到 GitHub Pages

仓库已内置 GitHub Actions 工作流（`.github/workflows/pages.yml`），推送到 `main` 即自动部署，**首次会自动开启 Pages，无需手动设置**：

1. `git push origin main`
2. 打开 **Actions** 页，等 `Deploy to GitHub Pages` 跑完（约 1 分钟）
3. 访问 `https://<用户名>.github.io/echo-09/`

工作流只发布游戏本体（`index.html` + `css/` + `js/` + `assets/`），不含 `tests/`。

> 也可以不用 Actions：仓库 **Settings → Pages** 里把 **Source** 选 `Deploy from a branch` → `main` / `/ (root)`。
> 两种方式都行，因为站点是纯静态、且所有资源路径都是相对的。

---

## 许可

剧情、文案与代码均为原创。图片素材由 AI 生成，可自由用于本项目的演示。
