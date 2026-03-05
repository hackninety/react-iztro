# react-iztro（二改版）

> 基于 [SylarLong/react-iztro](https://github.com/SylarLong/react-iztro) 的二次开发版本，部署于 Cloudflare。

## 项目说明

本项目是 [react-iztro](https://github.com/SylarLong/react-iztro) 的 Fork 二改版本，在原项目基础上增加以下功能：

- **大运盘 JSON 导出** — 将大运盘数据转换为结构化 JSON 格式
- **流年盘 JSON 导出** — 将流年盘数据转换为结构化 JSON 格式
- **流月盘 JSON 导出** — 将流月盘数据转换为结构化 JSON 格式
- **流日盘 JSON 导出** — 将流日盘数据转换为结构化 JSON 格式
- **流时盘 JSON 导出** — 将流时盘数据转换为结构化 JSON 格式

导出的 JSON 数据用于上传至 AI 进行紫微斗数命盘分析。

## 仓库信息

| 仓库 | 地址 |
| --- | --- |
| origin（本仓库） | `git@github-0x7c:hackninety/react-iztro.git` |
| upstream（上游） | `git@github.com:SylarLong/react-iztro.git` |

## Cloudflare Pages 部署

本项目以 Storybook 静态站点的形式部署在 **Cloudflare Pages** 上。

### 方式一：通过 Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages**
2. 选择 **Connect to Git**，授权并选择 `hackninety/react-iztro` 仓库
3. 配置构建设置：

   | 配置项 | 值 |
   | --- | --- |
   | 生产分支 | `main` |
   | 构建命令 | `npm run build-storybook` |
   | 构建输出目录 | `storybook-static` |
   | 部署命令 | 留空（不填） |

   > **⚠️ 注意**：**部署命令必须留空**。Cloudflare Pages 会在构建完成后自动完成部署，无需也不能填写 `wrangler pages deploy`，否则会因构建环境中未安装 wrangler 而报错 `/bin/sh: wrangler: not found`。

4. 配置环境变量（可选）：

   进入 **Settings** → **Environment variables**，按需添加（Production 和 Preview 都要设置）：

   | 变量名 | 值 | 说明 |
   | --- | --- | --- |
   | `NODE_VERSION` | `18` | 指定 Node.js 版本 |

   > **⚠️ 注意**：仓库中已删除 `yarn.lock` 并将其加入 `.gitignore`，仅保留 `package-lock.json`。这样 Cloudflare 构建环境会自动检测并使用 npm 安装依赖，避免 Yarn 4.x 与旧版锁文件不兼容导致的 `YN0028` 构建失败。

5. 点击 **Save and Deploy**，等待构建完成
6. 后续每次 `git push origin main`，Cloudflare Pages 会自动触发重新构建和部署

### 方式二：通过 Wrangler CLI 手动部署

```bash
# 安装 Wrangler CLI（如尚未安装）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建 Storybook 静态站点
npm run build-storybook

# 首次部署（创建项目）
wrangler pages project create react-iztro

# 部署到 Cloudflare Pages
wrangler pages deploy storybook-static --project-name=react-iztro
```

### 环境变量（如需要）

在 Cloudflare Dashboard → Pages 项目 → **Settings** → **Environment variables** 中配置：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `NODE_VERSION` | `18` | 指定 Node.js 版本 |

### 自定义域名（可选）

1. 进入 Cloudflare Pages 项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入域名并按提示配置 DNS 记录

### 部署状态检查

```bash
# 通过 Wrangler 查看部署列表
wrangler pages deployment list --project-name=react-iztro
```

也可以在 Cloudflare Dashboard → Pages 项目页面中直接查看每次部署的状态和预览链接。

## 与上游同步流程

> 每次同步前，务必确保本地工作区是干净且最新的。

### 1. 确保本地最新

```bash
# 查看当前状态，确保没有未提交的更改
git status

# 如果有未提交的更改，先暂存或提交
git stash        # 暂存（稍后用 git stash pop 恢复）
# 或
git add . && git commit -m "wip: save local changes"
```

### 2. 拉取上游最新代码

```bash
# 拉取上游所有分支的最新代码
git fetch upstream
```

### 3. 合并上游代码（二选一）

#### 方式 A：Merge（合并，推荐）

保留完整的提交历史，产生一个合并提交节点。

```bash
git checkout main
git merge upstream/main
```

#### 方式 B：Rebase（变基）

将本地提交"重放"到上游最新代码之上，使提交历史更线性。

```bash
git checkout main
git rebase upstream/main
```

> **注意**：如果本地有较多二改提交，rebase 可能产生更多冲突，需要逐个提交处理。公共分支一般推荐使用 merge。

### 4. 冲突处理流程

当 merge 或 rebase 过程中出现冲突时：

```bash
# 1. 查看冲突文件列表
git status

# 2. 打开冲突文件，搜索冲突标记并手动解决
#    <<<<<<< HEAD
#    （本地的更改）
#    =======
#    （上游的更改）
#    >>>>>>> upstream/main

# 3.【Merge 模式】解决冲突后，标记为已解决并完成合并
git add <冲突文件>
git commit  # 如果所有冲突都已解决，Git 会自动生成合并提交信息

# 3.【Rebase 模式】解决冲突后，继续变基
git add <冲突文件>
git rebase --continue
# 如果某个提交需要跳过
git rebase --skip
# 如果需要中止变基，回到 rebase 之前的状态
git rebase --abort
```

### 5. 推送到 origin

```bash
# Merge 后正常推送
git push origin main

# Rebase 后需要强制推送（注意：确认没有他人在此分支协作）
git push origin main --force-with-lease
```

### 6. 完整同步流程速查

```bash
# 一键式 Merge 同步流程
git status                    # 确认工作区干净
git fetch upstream            # 拉取上游
git checkout main             # 切到主分支
git merge upstream/main       # 合并上游
# （如有冲突则手动解决）
git push origin main          # 推送到自己的仓库
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动 Storybook 进行开发调试
npm run storybook

# 构建
npm run build
```

## 许可证

沿用上游项目许可证。
