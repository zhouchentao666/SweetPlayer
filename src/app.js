const { Sidebar } = require('./components/Sidebar');
const { PlayerBar } = require('./components/PlayerBar');
const { ThemeManager } = require('./utils/theme');

class SweetPlayer {
  constructor() {
    this.themeManager = null;
    this.sidebar = null;
    this.playerBar = null;
  }

  init() {
    console.log('SweetPlayer 初始化开始');
    this.themeManager = new ThemeManager();
    this.initSidebar();
    this.initPlayerBar();
    this.bindGlobalEvents();
    console.log('SweetPlayer 初始化完成');
  }

  initSidebar() {
    const sidebarContainer = document.getElementById('sidebarContainer');
    console.log('侧边栏容器:', sidebarContainer);
    if (!sidebarContainer) {
      console.error('找不到侧边栏容器 #sidebarContainer');
      return;
    }

    try {
      this.sidebar = new Sidebar('sidebarContainer', {
        collapsed: window.innerWidth < 900,
        onNavigate: (id) => this.handleNavigate(id),
        onAction: (id) => this.handleAction(id)
      });
      console.log('侧边栏初始化成功');
    } catch (err) {
      console.error('侧边栏初始化失败:', err);
    }
  }

  initPlayerBar() {
    const playerContainer = document.getElementById('playerContainer');
    console.log('播放器容器:', playerContainer);
    if (!playerContainer) {
      console.error('找不到播放器容器 #playerContainer');
      return;
    }

    try {
      this.playerBar = new PlayerBar('playerContainer', {
        onPlay: () => console.log('播放'),
        onPause: () => console.log('暂停'),
        onPrev: () => console.log('上一首'),
        onNext: () => console.log('下一首'),
        onShuffle: (active) => console.log('随机播放:', active),
        onRepeat: (active) => console.log('循环播放:', active),
        onVolumeChange: (percent) => console.log('音量:', percent),
        onProgressChange: (percent) => console.log('进度:', percent)
      });
      console.log('播放器初始化成功');
    } catch (err) {
      console.error('播放器初始化失败:', err);
    }
  }

  handleNavigate(id) {
    console.log('导航到:', id);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const titles = {
        discover: '发现音乐',
        library: '音乐库',
        playlists: '播放列表',
        favorites: '我的收藏',
        history: '最近播放'
      };
      const title = titles[id] || 'SweetPlayer';
      mainContent.innerHTML = `
        <div class="placeholder-text">
          <h1>${title}</h1>
          <p>功能开发中...</p>
        </div>
      `;
    }
  }

  handleAction(id) {
    console.log('快捷操作:', id);
    const actions = {
      add: () => alert('添加歌曲'),
      folder: () => alert('打开文件夹'),
      settings: () => alert('设置')
    };
    if (actions[id]) actions[id]();
  }

  bindGlobalEvents() {
    this.themeManager.onChange((theme) => {
      console.log('主题切换为:', theme);
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            this.sidebar?.setActive('discover');
            this.handleNavigate('discover');
            break;
          case 'l':
            e.preventDefault();
            this.sidebar?.setActive('library');
            this.handleNavigate('library');
            break;
          case 'p':
            e.preventDefault();
            this.sidebar?.setActive('playlists');
            this.handleNavigate('playlists');
            break;
          case 'f':
            e.preventDefault();
            this.sidebar?.setActive('favorites');
            this.handleNavigate('favorites');
            break;
          case 'h':
            e.preventDefault();
            this.sidebar?.setActive('history');
            this.handleNavigate('history');
            break;
        }
      }
    });
  }

  destroy() {
    this.sidebar?.destroy();
    this.playerBar?.destroy();
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 已加载，开始初始化 SweetPlayer');
  window.sweetPlayer = new SweetPlayer();
  window.sweetPlayer.init();
});

module.exports = { SweetPlayer };
