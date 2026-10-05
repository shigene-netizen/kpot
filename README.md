# KPOT To Go — 固定跳转层（GitHub Pages）

> **✅ 已上线**
> 跳转层网址：**https://shigene-netizen.github.io/kpot/**
> 13 张二维码已生成并全部解码核对通过（`qrcodes-stable/`）。
> **这批码印出去以后，换域名只需改 `target.js` 一行，码不用重印。**

**解决的问题**：线上点餐页每次重新发布都会换域名，店里印出去的二维码全部作废。
这一层是一个**永久不变的网址**，二维码只印它；它再转发到当前线上地址。
以后换域名，只改 `target.js` 里的**一行**，推上去，所有印刷品继续有效。

---

## 一、你会得到什么

| 用途 | 固定网址 | 二维码编码内容 |
|---|---|---|
| 通用入口（海报 / 外卖单） | `https://shigene-netizen.github.io/kpot/` | 同上 |
| 1 号桌 | `https://shigene-netizen.github.io/kpot/tables/1/` | 同上，扫了自动带 `?table=1` |
| 2 号桌 | `https://shigene-netizen.github.io/kpot/tables/2/` | 同上 |
| … | … | … |
| 12 号桌 | `https://shigene-netizen.github.io/kpot/tables/12/` | 同上 |

客人扫桌卡 → 打开上面的固定网址 → 约 0.35 秒 → 自动进入点餐页，桌号自动识别。
整个过程客人只看得到"正在打开菜单…"，体感就是直接跳转。

> **这些网址永远不变。** 换域名时你只改 `target.js`，不需要动任何二维码。

---

## 二、只改这一行 —— `target.js`

```js
window.KPOT_TARGET = {
  baseUrl: 'https://db29045e3719456fba388b4bde70fbe2.sg.agentos-app.run',
  ...
};
```

线上点餐页换了新域名后：

1. 打开 `target.js`
2. 把 `baseUrl` 换成新域名（**末尾不要加 `/`**）
3. 保存 → 提交 → 推送：

```bash
git add target.js
git commit -m "point redirect at new live url"
git push
```

GitHub Pages 约 1 分钟后自动更新。**店里所有印出去的码不用换。**

---

## 三、一次性上线步骤（只需做一遍）

### 1. 建仓库

在 GitHub 上新建一个仓库，建议名字就叫 **`kpot`**（公开仓库才免费开 Pages；
内容只是跳转页，不含任何密钥，公开是安全的）。

> 仓库名决定网址：仓库叫 `kpot` → 网址是 `https://<用户名>.github.io/kpot/`

### 2. 推代码

在本目录里执行（把 `<用户名>` 换成你的 GitHub 用户名）：

```bash
cd "C:/Users/shige/WorkBuddy AI/2026-10-02-19-51-22/kpot-redirect"

git init
git add .
git commit -m "KPOT To Go redirect layer"
git branch -M main
git remote add origin https://github.com/<用户名>/kpot.git
git push -u origin main
```

第一次推送会要求登录。GitHub 现在**不收账号密码**，要填 **Personal Access Token**：
GitHub → 右上头像 → Settings → Developer settings → Personal access tokens →
Tokens (classic) → Generate new token (classic) → 勾选 **`repo`** → 生成后复制，
推送时用户名填 GitHub 用户名，**密码位置粘贴这个 token**。

### 3. 打开 Pages

仓库页 → **Settings** → 左侧 **Pages** → **Source** 选 `Deploy from a branch`
→ Branch 选 **`main`** / **`/ (root)`** → **Save**。

等 1–2 分钟，网址就会出现：`https://<用户名>.github.io/kpot/`
先自己用手机打开试一下，确认能跳到点餐页。

### 4. 生成二维码

网址出来后（GitHub Pages 显示 "Your site is live at …"），在该网址确认能跳转后，
用你的用户名生成**印一次就永久有效**的二维码：

```bash
cd "C:/Users/shige/WorkBuddy AI/2026-10-02-19-51-22/kpot-redirect"
python _dev/make_redirect_qr.py <你的用户名>
```

生成在 `qrcodes-stable/`：

| 文件 | 用途 |
|---|---|
| `entry-qr.png` / `.svg` | 通用入口码（海报、外卖单、官网） |
| `table-01-qr.png` … `table-12-qr.png` | 12 张桌卡（还带 `.svg` 矢量版） |

脚本会**把每个码解码回来核对**，全部通过才报成功——不会出现"生成了但扫不出来"。

**这版码印出去以后，就再也不用换了。**

> 每个桌卡的 PNG 是 700×900，顶部红色标题栏 + 超大桌号 + 二维码，
> 可直接 A5 打印裁开；`.svg` 交给印刷厂放大不失真。

---

## 四、常用操作

**加桌号**（比如开到 20 桌）：

```bash
python _dev/build_tables.py 1 20     # 生成 1..20
```

**先本地预览**（不推 GitHub 也能看）：

```bash
python -m http.server 8931
# 浏览器打开 http://127.0.0.1:8931/tables/7/
```

**核对跳转是否正确**：

```bash
node _dev/verify_redirect.js http://127.0.0.1:8931
```

---

## 五、文件说明

| 文件 | 作用 | 需要改吗 |
|---|---|---|
| `target.js` | **线上地址（唯一要改的文件）** | ✅ 换域名时改这 |
| `app.js` | 读 `target.js`、拼桌号、跳转 | ❌ |
| `index.html` | 通用入口页 | ❌ |
| `style.css` | 跳转页样式 | ❌ |
| `tables/<n>/index.html` | 各桌页面（由脚本生成） | ❌ 用脚本生成 |
| `_dev/build_tables.py` | 批量生成桌号页 | 改桌数时改这里 |
| `_dev/make_redirect_qr.py` | 生成**永久有效**的印刷二维码 | 换桌数时加 `--repo` 等参数 |
| `_dev/verify_redirect.js` | 无头浏览器核对跳转 | ❌ |
| `_dev/push_to_github.sh` | 一键推送到 GitHub | ❌ |
| `.nojekyll` | 关掉 Jekyll，保证静态文件原样发布 | ❌ |

---

## 六、为什么不用平台自带域名

实测过：`*.sg.agentos-app.run` 的子域名**每次发布都重新签发**，
9 次发布 = 9 个不同域名，旧的直接 400；自定义前缀（如 `kpot-to-go.…`）也不接受。
所以这一层是必须的——**把会变的地址藏在一个不变的地址后面**。
