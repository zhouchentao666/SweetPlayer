const { ipcRenderer } = require('electron');

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.listeners = [];
    this.init();
  }

  init() {
    // 监听主进程主题变化
    ipcRenderer.on('theme-changed', (event, theme) => {
      this.setTheme(theme);
    });

    // 初始化当前主题
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    this.currentTheme = isDark ? 'dark' : 'light';
  }

  setTheme(theme) {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    this.notifyListeners(theme);
  }

  getTheme() {
    return this.currentTheme;
  }

  isDark() {
    return this.currentTheme === 'dark';
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(theme) {
    this.listeners.forEach(cb => cb(theme));
  }

  // 获取当前主题的颜色配置
  getColors() {
    const isDark = this.isDark();
    return {
      textPrimary: isDark ? '#ffffff' : '#333333',
      textSecondary: isDark ? '#cccccc' : '#666666',
      textMuted: isDark ? '#888888' : '#999999',
      bgButton: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      bgButtonHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      progressTrack: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
      progressFill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
    };
  }
}

module.exports = { ThemeManager };
