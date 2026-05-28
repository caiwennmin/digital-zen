# Digital Zen · 数字禅

> *在信息洪流中，找回你的深度专注力。*

一个为数字时代设计的正念生产力伴侣。AI 内容过载、注意力碎片化、数字成瘾蔓延——Digital Zen 帮助你暂停、呼吸，专注于真正重要的事。

---

## 功能

**专注计时器** — 番茄钟风格，可自定义工作/休息时长  
**环境白噪音** — 9 种 Web Audio API 实时合成音效（雨、雷雨、海浪、风、森林、篝火、咖啡馆、白噪音、颂钵），零下载  
**每日意图日记** — 早晨设定 3 个优先级 + 晚间反思，自动保存  
**进度仪表盘** — 专注次数、总时长、连续天数、周趋势图  
**账号与云同步** — 邮箱注册登录，数据云端同步，换设备也能看  
**隐私优先** — 不登录也能用，数据优先存本地  
**暖纸设计** — 浅色主题，陶土橙单色 accent，深色模式自动切换

---

## 快速开始

### 纯前端（不需要服务器）

直接双击 `index.html`，所有功能离线可用。

### 带账号系统

```bash
cd server
npm install
npm start
```

浏览器打开 **http://localhost:3456**，右上角登录。

---

## 项目结构

```
digital-zen/
├── index.html
├── css/main.css
├── js/
│   ├── app.js          # 应用控制器
│   ├── auth.js         # 登录/注册/同步
│   ├── timer.js        # 番茄钟
│   ├── journal.js      # 日记
│   ├── stats.js        # 统计
│   ├── sounds.js       # 环境音合成
│   └── storage.js      # 数据持久层
├── server/
│   ├── server.js        # Express + sql.js + JWT
│   └── package.json
├── README.md
└── LICENSE
```

## 技术栈

纯 HTML/CSS/JS（前端） + Express + SQLite（后端）。零框架，零外部依赖。

## License

MIT