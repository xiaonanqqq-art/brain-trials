# 脑力试炼

一个中文单人益智游戏。15 道关卡、五种思维挑战，从初露锋芒到突破边界，在浏览器里享受思考的乐趣。

## 开始游玩

直接双击 `index.html` 即可打开游戏。所有运行资源都在项目内，不需要安装依赖或联网。

也可以安装 Node.js 24 后，在项目目录运行：

```sh
npm start
```

打开终端给出的本地网址，默认为 http://127.0.0.1:4173 。

## 玩法

- 数字规律、图形推理、逻辑判断、记忆挑战、空间想象，每类三关，分三个章节逐步解锁。
- **计时挑战**：每题 45 秒，答对得 100 分，按剩余时间最多加 40 分，整局满分 2100。
- **从容思考**：不限时，每题最高 100 分，整局满分 1500。
- 每题一次提示，答对时扣 30 分；答错、跳过或超时得 0 分。结算后显示完整解析。
- 记忆题有 5 秒观察时间，图案隐藏后才开始答题计时；选择相同位置才能答对。
- 暂停、切换标签页时隐藏题面并暂停计时。刷新后从首页继续，保留剩余观察或答题时间。
- 完成过的关卡可单独练习，通关后可练习错题；练习不会改变挑战记录。
- 进度与两种模式的最佳成绩分别保存在当前浏览器。清理浏览器数据会清除记录，不跨设备同步。浏览器禁止存储时仍能游玩，但不能保存。

本游戏用于娱乐和思考练习，分数不换算为标准 IQ。

## 发布到 GitHub Pages

目标账号为 `xiaonanqqq-art`，建议仓库名 `brain-trials`。以下网址是部署成功后的预期地址，并不表示当前已上线：

```text
https://xiaonanqqq-art.github.io/brain-trials/
```

### 使用 GitHub 网页上传

1. 登录目标账号，创建 `brain-trials` 公开仓库。GitHub Free 的 Pages 路线需要公开仓库，源码会公开可见。
2. 用仓库的 **Add file → Upload files** 上传发布包里的 `index.html`、`styles.css`、`questions.js`、`engine.js`、`app.js`、`favicon.svg`，放在仓库根目录。
3. 进入 **Settings → Pages**，Source 选择 **Deploy from a branch**，Branch 选 `main`，目录选 `/ (root)`，保存。
4. 等待 Pages 部署成功，打开页面显示的游玩网址。后续更新同名文件即可重新发布。

### 上传完整源码并自动测试发布

将 `brain-trials-source.zip` 解压到独立文件夹，再使用 GitHub Desktop 或 Git 上传该文件夹的源码，排除 `.gitignore` 中的临时目录。仓库默认分支采用 `main`。工作区内的其他项目不属于本游戏，不需要上传。

1. 在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main`，或在 **Actions → Verify and publish game → Run workflow** 手动触发。
3. 工作流会检查语法、运行题库与规则测试，再上传七个静态文件并部署。
4. 等待工作流成功，在 Pages 设置或工作流部署结果里打开实际网址。

两种发布方式任选其一。资源路径均为相对路径，支持 GitHub 项目子目录，也支持直接打开本地文件。

## 开发与验证

不需要 `npm install`。运行：

```sh
npm run check
npm test
node scripts/package.cjs
```

`npm test` 使用 Node 内置测试器，校验计分边界、超时、重复提交、暂停、记忆恢复、坏存档，以及独立推导的题目答案。静态发布文件输出到 `release/site`。

可选的真实浏览器检查：先运行 `npm start`，另一个终端执行 `node scripts/browser-check.cjs`。脚本使用 Node 24 和本机 Chrome，不需要第三方依赖；默认 Windows Chrome 路径，可通过 `BROWSER_BIN` 覆盖。它启动独立的无界面浏览器，不使用日常浏览器的登录数据，验证 15 关、错题练习、存档、手机布局和本地文件打开，将截图保存到被 Git 忽略的 `.qa`。

## 项目结构

| 文件 | 职责 |
| --- | --- |
| `index.html`、`styles.css` | 页面入口、视觉与响应式布局 |
| `questions.js` | 题库、SVG 图形、提示与解析 |
| `engine.js` | 可独立测试的规则与状态管理 |
| `app.js` | 页面、交互、存档与成绩 |
| `tests/` | 独立题目验证与规则测试 |
| `scripts/` | 本地预览、浏览器检查、发布打包 |
| `.github/workflows/pages.yml` | GitHub Pages 自动测试与发布 |

官方发布资料：[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[GitHub Desktop 上传](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop)、[自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
