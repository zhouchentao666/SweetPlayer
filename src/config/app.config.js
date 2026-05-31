const AppConfig = {
  appName: 'SweetPlayer',
  version: '1.0.0',
  sidebar: {
    width: 220,
    collapsedWidth: 64,
    breakpoint: 900
  },
  themes: {
    light: {
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      bgButton: 'rgba(0, 0, 0, 0.08)',
      bgButtonHover: 'rgba(0, 0, 0, 0.15)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
      progressTrack: 'rgba(0, 0, 0, 0.15)',
      progressFill: 'rgba(0, 0, 0, 0.6)'
    },
    dark: {
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      textMuted: '#888888',
      bgButton: 'rgba(255, 255, 255, 0.1)',
      bgButtonHover: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      progressTrack: 'rgba(255, 255, 255, 0.2)',
      progressFill: 'rgba(255, 255, 255, 0.7)'
    }
  },
  navItems: [
    { id: 'discover', label: '发现音乐', icon: 'compass', shortcut: 'Ctrl+D' },
    { id: 'library', label: '音乐库', icon: 'library', shortcut: 'Ctrl+L' },
    { id: 'playlists', label: '播放列表', icon: 'playlist', shortcut: 'Ctrl+P' },
    { id: 'favorites', label: '我的收藏', icon: 'heart', shortcut: 'Ctrl+F' },
    { id: 'history', label: '最近播放', icon: 'history', shortcut: 'Ctrl+H' }
  ],
  quickActions: [
    { id: 'add', label: '添加歌曲', icon: 'plus' },
    { id: 'folder', label: '打开文件夹', icon: 'folder' },
    { id: 'settings', label: '设置', icon: 'settings' }
  ],
  user: {
    name: '音乐爱好者',
    avatar: '',
    status: 'online'
  }
};

module.exports = { AppConfig };
