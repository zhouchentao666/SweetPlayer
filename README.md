# SweetPlayer

一个基于 Electron 构建的现代化本地音乐播放器，采用 Fluent Design 设计语言，支持 Windows 亚克力/毛玻璃特效。

![SweetPlayer](assets/icon.png)

## 功能特性

### 核心功能
- 本地音乐文件播放（支持 MP3、FLAC、WAV 等常见格式）
- 智能元数据读取（标题、艺术家、专辑、封面等）
- 歌单管理（创建、编辑、删除、导入导出）
- 播放列表（播放队列、历史记录）

### 播放控制
- 多种播放模式（顺序、逆序、随机、单曲循环、列表循环）
- 音量控制（0-100，带数值显示）
- 播放速度调节（0.5x - 2.0x）
- 进度拖拽、上一首/下一首切换

### 界面特性
- Fluent Design 设计风格
- 页面切换动画（从下往上非线性弹出）
- 深色/浅色主题切换
- 自定义主题色
- 窗口特效（亚克力/毛玻璃/自定义背景图片）
- 动画效果开关

### 歌单功能
- 搜索歌曲（按名称、艺术家过滤）
- 批量编辑（批量删除）
- 拖拽排序
- 全部歌曲自动聚合

## 技术栈

- **框架**: Electron
- **前端**: 原生 HTML5 + CSS3 + JavaScript
- **音频**: HTML5 Audio API
- **元数据**: music-metadata
- **系统集成**: Windows DWM API（亚克力效果）

## 安装与运行

### 环境要求
- Node.js 16+
- Windows 10/11（推荐，支持亚克力特效）

### 安装依赖
```bash
npm install
```

### 运行应用
```bash
npm start
```

### 打包发布
```bash
# 使用 electron-builder 或其他打包工具
# 请自行配置打包脚本
```

## 项目结构

```
SweetPlayer/
├── main.js                 # Electron 主进程
├── index.html              # 主界面
├── package.json            # 项目配置
├── README.md               # 项目说明
├── assets/                 # 静态资源（图标、图片）
├── src/
│   ├── js/
│   │   ├── player.js       # 播放器核心逻辑
│   │   ├── sidebar.js      # 侧边栏与歌单管理
│   │   ├── settings.js     # 设置页面
│   │   ├── theme.js        # 主题管理
│   │   └── sponsor.js      # 赞助页面
│   ├── styles/
│   │   ├── main.css        # 主样式
│   │   ├── player.css      # 播放器样式
│   │   ├── sidebar.css     # 侧边栏样式
│   │   └── settings.css    # 设置页面样式
│   └── utils/
│       └── icons.js        # 图标工具
└── ...
```

## 使用说明

### 导入音乐
1. 点击侧边栏"全部歌曲"或任意歌单
2. 右键选择"导入文件"或"导入文件夹"
3. 选择音乐文件即可自动添加到歌单

### 创建歌单
1. 在侧边栏歌单区域右键
2. 选择"新建歌单"
3. 输入歌单名称并确认

### 切换主题
1. 点击侧边栏"设置"
2. 在外观选项中选择"主题"（跟随系统/浅色/深色）
3. 可自定义主题色和窗口特效

### 播放控制
- 底栏控制播放/暂停、上一首/下一首
- 点击播放模式按钮切换循环/随机模式
- 点击音量按钮显示音量滑块
- 点击播放列表按钮显示当前播放队列

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Space | 播放/暂停 |
| Ctrl + → | 下一首 |
| Ctrl + ← | 上一首 |
| Ctrl + ↑ | 音量增加 |
| Ctrl + ↓ | 音量减少 |

## 截图

*待添加*

## 开源协议

ISC License

## 作者

- GitHub: [@zhouchentao666](https://github.com/zhouchentao666)

## 致谢

感谢以下开源项目：
- [Electron](https://www.electronjs.org/)
- [music-metadata](https://github.com/Borewit/music-metadata)
- [Fluent Design System](https://www.microsoft.com/design/fluent/)

## 赞助支持

如果这个项目对你有帮助，欢迎赞助支持开发者：

- 支付宝 / 微信支付：见应用内"赞助"页面

---

Made with ❤️ by zhouchentao666
