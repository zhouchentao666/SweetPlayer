// 主题管理
const ThemeManager = {
  currentTheme: 'light',
  themePreference: '跟随系统',
  currentAccentColor: '#2196F3',
  listeners: [],
  colorListeners: [],

  // 预设主题色
  accentColors: [
    { name: '经典蓝', value: '#2196F3' },
    { name: '活力橙', value: '#FF9800' },
    { name: '清新绿', value: '#4CAF50' },
    { name: '优雅紫', value: '#9C27B0' },
    { name: '热情红', value: '#F44336' },
    { name: '青柠黄', value: '#CDDC39' },
    { name: '深海青', value: '#009688' },
    { name: '浪漫粉', value: '#E91E63' }
  ],

  async init() {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('theme-changed', (event, theme) => {
      if (this.themePreference === '跟随系统') {
        this.applyTheme(theme);
      }
    });

    // 加载保存的设置
    await this.loadSettings();

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    this.currentTheme = isDark ? 'dark' : 'light';
    
    // 初始化主题色
    this.applyAccentColor(this.currentAccentColor);
  },

  // 加载设置
  async loadSettings() {
    try {
      const { ipcRenderer } = require('electron');
      const data = await ipcRenderer.invoke('load-settings');
      if (data) {
        // 恢复主题
        if (data.theme) {
          this.themePreference = data.theme;
          this.applyTheme(this.resolveTheme(data.theme), { save: false });
        }
        // 恢复主题色
        if (data.accentColor) {
          this.currentAccentColor = data.accentColor;
          this.applyAccentColor(data.accentColor);
        }
        console.log('设置已加载:', data);
      }
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  },

  // 保存设置
  saveSettings() {
    try {
      const { ipcRenderer } = require('electron');
      const settings = {
        accentColor: this.currentAccentColor
      };
      ipcRenderer.send('save-settings', settings);
      console.log('设置已保存:', settings);
    } catch (err) {
      console.error('保存设置失败:', err);
    }
  },

  resolveTheme(preference) {
    if (preference === '深色') return 'dark';
    if (preference === '浅色') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  setThemePreference(preference) {
    this.themePreference = preference;
    this.applyTheme(this.resolveTheme(preference));
  },

  applyTheme(theme, options = {}) {
    const { save = true } = options;
    const changed = this.currentTheme !== theme;
    this.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    if (changed) {
      this.listeners.forEach(cb => cb(theme));
    }
    
    // 通知主进程更新标题栏按钮颜色
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('update-titlebar-buttons', theme === 'dark');
    
    if (save) {
      this.saveSettings();
    }
  },

  setTheme(theme) {
    this.applyTheme(theme);
  },

  getTheme() {
    return this.currentTheme;
  },

  isDark() {
    return this.currentTheme === 'dark';
  },

  onChange(callback) {
    this.listeners.push(callback);
  },

  setAccentColor(color) {
    if (this.currentAccentColor === color) return;
    this.currentAccentColor = color;
    this.applyAccentColor(color);
    this.colorListeners.forEach(cb => cb(color));
    
    // 保存设置
    this.saveSettings();
  },

  getAccentColor() {
    return this.currentAccentColor;
  },

  onAccentColorChange(callback) {
    this.colorListeners.push(callback);
  },

  applyAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-color-light', this.lightenColor(color, 20));
    document.documentElement.style.setProperty('--accent-color-dark', this.darkenColor(color, 20));
  },

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  },

  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
};

module.exports = { ThemeManager };
