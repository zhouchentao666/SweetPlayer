// 设置页面管理
const SettingsPage = {
  currentTab: 'appearance',
  searchQuery: '',

  // Fluent Design 页面切换动画
  switchContent(mainContent, html, onAfterRender) {
    const currentChild = mainContent.firstElementChild;

    if (!currentChild) {
      mainContent.innerHTML = html;
      const newChild = mainContent.firstElementChild;
      if (newChild) {
        newChild.classList.add('content-entrance');
      }
      if (onAfterRender) onAfterRender();
      return;
    }

    currentChild.classList.add('content-fade-out');

    const onFadeOutEnd = () => {
      currentChild.removeEventListener('animationend', onFadeOutEnd);
      mainContent.innerHTML = html;
      const newChild = mainContent.firstElementChild;
      if (newChild) {
        newChild.classList.add('content-entrance');
        const onEntranceEnd = () => {
          newChild.removeEventListener('animationend', onEntranceEnd);
          newChild.classList.remove('content-entrance');
        };
        newChild.addEventListener('animationend', onEntranceEnd);
      }
      if (onAfterRender) onAfterRender();
    };

    currentChild.addEventListener('animationend', onFadeOutEnd);
  },

  // 设置数据
  settingsData: {
    appearance: [
      { id: 'theme', label: '主题', desc: '选择应用主题', type: 'select', value: '跟随系统', options: ['跟随系统', '浅色', '深色'] },
      { id: 'accentColor', label: '主题色', desc: '选择应用主题色', type: 'colorPicker', value: '#2196F3' },
      { id: 'animations', label: '动画效果', desc: '启用界面切换和弹出动画', type: 'toggle', value: true },
      { id: 'immersivePlayer', label: '沉浸播放器', desc: '鼠标悬停时显示播放控件，移出后自动隐藏', type: 'toggle', value: false },
      { id: 'windowEffect', label: '窗口特效', desc: '选择窗口背景特效', type: 'select', value: '亚克力', options: ['无', '亚克力', '自定义图片'] },
      { id: 'acrylicIntensity', label: '毛玻璃强度', desc: '调整亚克力效果的模糊强度', type: 'slider', value: 50, min: 0, max: 100, showWhen: 'windowEffect', showValue: '亚克力' },
      { id: 'windowEffectImage', label: '背景图片', desc: '选择自定义窗口背景图片', type: 'imagePicker', value: '', showWhen: 'windowEffect', showValue: '自定义图片' }
    ],
    about: [
      { id: 'version', label: '版本', desc: 'SweetPlayer v1.0.0', type: 'text', value: '1.0.0' }
    ]
  },

  tabs: [
    { id: 'appearance', label: '外观' },
    { id: 'about', label: '关于' }
  ],

  async show() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // 加载保存的设置
    await this.loadSettingsFromFile();

    this.switchContent(mainContent, this.render(), () => {
      this.bindEvents();
    });
    console.log('设置页面已显示');
  },

  render() {
    return `
      <div class="settings-page">
        <div class="settings-header">
          <div class="settings-title-row">
            <h1 class="settings-title">设置</h1>
            <div class="settings-search">
              <span class="settings-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              </span>
              <input type="text" id="settingsSearch" placeholder="搜索设置..." value="${this.searchQuery}">
            </div>
          </div>
          <div class="settings-tabs">
            ${this.tabs.map(tab => `
              <button class="settings-tab ${tab.id === this.currentTab ? 'active' : ''}" data-tab="${tab.id}">
                ${tab.label}
              </button>
            `).join('')}
            <div class="settings-tab-indicator"></div>
          </div>
        </div>
        <div class="settings-content" id="settingsContent">
          ${this.renderSettingsList()}
        </div>
      </div>
    `;
  },

  renderSettingsList() {
    const settings = this.getFilteredSettings();
    
    if (settings.length === 0) {
      return `
        <div class="settings-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <p>未找到相关设置</p>
        </div>
      `;
    }

    const grouped = this.groupByCategory(settings);
    
    return Object.entries(grouped).map(([category, items]) => `
      <div class="settings-section">
        <h2 class="settings-section-title">${this.getCategoryLabel(category)}</h2>
        ${items.map(item => this.renderSettingItem(item)).join('')}
      </div>
    `).join('');
  },

  getFilteredSettings() {
    let settings = [];
    
    if (this.searchQuery) {
      // 搜索模式：遍历所有分类
      Object.entries(this.settingsData).forEach(([category, items]) => {
        items.forEach(item => {
          if (item.label.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
              item.desc.toLowerCase().includes(this.searchQuery.toLowerCase())) {
            settings.push({ ...item, category });
          }
        });
      });
    } else {
      // 分类模式
      const items = this.settingsData[this.currentTab] || [];
      settings = items.map(item => ({ ...item, category: this.currentTab }));
    }
    
    return settings;
  },

  groupByCategory(settings) {
    return settings.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  },

  getCategoryLabel(category) {
    const labels = {
      appearance: '外观',
      about: '关于'
    };
    return labels[category] || category;
  },

  renderSettingItem(item) {
    // 检查条件显示
    if (item.showWhen && item.showValue) {
      const parentValue = this.getSettingValue(item.showWhen);
      if (parentValue !== item.showValue) {
        return ''; // 不显示此设置项
      }
    }
    
    const control = this.renderControl(item);
    return `
      <div class="settings-item" data-id="${item.id}">
        <div class="settings-item-info">
          <div class="settings-item-label">${item.label}</div>
          <div class="settings-item-desc">${item.desc}</div>
        </div>
        ${control}
      </div>
    `;
  },

  getSettingValue(id) {
    // 从所有分类中查找设置值
    for (const category of Object.values(this.settingsData)) {
      const setting = category.find(s => s.id === id);
      if (setting) return setting.value;
    }
    return null;
  },

  renderControl(item) {
    switch (item.type) {
      case 'toggle':
        return `
          <div class="settings-toggle ${item.value ? 'active' : ''}" data-id="${item.id}">
            <div class="settings-toggle-thumb"></div>
          </div>
        `;
      case 'select':
        const isDropdownUp = item.id === 'quality';
        return `
          <div class="settings-custom-select ${isDropdownUp ? 'dropdown-up' : ''}" data-id="${item.id}">
            <div class="settings-select-trigger">
              <span class="settings-select-value">${item.value}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
            <div class="settings-select-dropdown">
              ${item.options.map(opt => `
                <div class="settings-select-option ${item.value === opt ? 'selected' : ''}" data-value="${opt}">${opt}</div>
              `).join('')}
            </div>
          </div>
        `;
      case 'slider':
        const percent = ((item.value - item.min) / (item.max - item.min)) * 100;
        return `
          <div class="settings-slider" data-id="${item.id}">
            <div class="settings-slider-fill" style="width: ${percent}%"></div>
            <div class="settings-slider-thumb" style="left: ${percent}%"></div>
          </div>
        `;
      case 'colorPicker':
        return `
          <div class="settings-color-picker" data-id="${item.id}">
            ${ThemeManager.accentColors.map(color => `
              <div class="settings-color-option ${color.value === item.value ? 'active' : ''}" 
                   data-color="${color.value}" 
                   title="${color.name}"
                   style="background: ${color.value}">
                ${color.value === item.value ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : ''}
              </div>
            `).join('')}
          </div>
        `;
      case 'imagePicker':
        const imageUrl = this.getImageUrl(item.value);
        return `
          <div class="settings-image-picker" data-id="${item.id}">
            <button class="settings-image-preview ${item.value ? 'has-image' : ''}" data-action="select-image" ${imageUrl ? `style="background-image: url('${imageUrl}')"` : ''}>
              ${item.value ? '' : `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM14.14 11.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>
                <span>选择图片</span>
              `}
            </button>
            <button class="settings-image-clear" data-action="clear-image" ${item.value ? '' : 'style="display: none;"'}>清除图片</button>
          </div>
        `;
      case 'shortcut':
        return `<span class="settings-shortcut">${item.value}</span>`;
      case 'button':
        return `<button class="settings-btn" data-id="${item.id}">${item.value}</button>`;
      case 'text':
        return `<span class="settings-shortcut">${item.value}</span>`;
      default:
        return '';
    }
  },

  bindEvents() {
    // 搜索
    const searchInput = document.getElementById('settingsSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshContent();
      });
    }

    // 分类切换
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        if (tabId === this.currentTab) return;
        this.currentTab = tabId;
        this.searchQuery = '';

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.updateTabIndicator(tab);
        this.refreshContent();

        const searchInput = document.getElementById('settingsSearch');
        if (searchInput) searchInput.value = '';
      });
    });

    this.updateTabIndicator();

    this.bindContentEvents(document);

  },

  bindContentEvents(root) {
    // 开关
    const toggles = root.querySelectorAll('.settings-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const id = toggle.getAttribute('data-id');
        this.updateSetting(id, !toggle.classList.contains('active'));
        toggle.classList.toggle('active');
      });
    });

    // 自定义下拉选择
    const customSelects = root.querySelectorAll('.settings-custom-select');
    customSelects.forEach(select => {
      const trigger = select.querySelector('.settings-select-trigger');
      const dropdown = select.querySelector('.settings-select-dropdown');
      
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.settings-custom-select.open').forEach(s => {
          if (s !== select) s.classList.remove('open');
        });
        select.classList.toggle('open');
      });
      
      const options = select.querySelectorAll('.settings-select-option');
      options.forEach(option => {
        option.addEventListener('click', () => {
          const value = option.getAttribute('data-value');
          const id = select.getAttribute('data-id');
          
          select.querySelector('.settings-select-value').textContent = value;
          
          options.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
          
          select.classList.remove('open');
          
          this.updateSetting(id, value);
        });
      });
    });
    
    document.addEventListener('click', () => {
      document.querySelectorAll('.settings-custom-select.open').forEach(s => {
        s.classList.remove('open');
      });
    });

    // 滑块
    const sliders = root.querySelectorAll('.settings-slider');
    sliders.forEach(slider => {
      let isDragging = false;
      
      const updateSlider = (e) => {
        const rect = slider.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const id = slider.getAttribute('data-id');
        const item = this.findSetting(id);
        if (item) {
          const value = Math.round(item.min + (percent / 100) * (item.max - item.min));
          this.updateSetting(id, value);
          slider.querySelector('.settings-slider-fill').style.width = percent + '%';
          slider.querySelector('.settings-slider-thumb').style.left = percent + '%';
        }
      };
      
      slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSlider(e);
      });
      
      slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e);
      }, { passive: true });
      
      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          e.preventDefault();
          updateSlider(e);
        }
      });
      
      document.addEventListener('touchmove', (e) => {
        if (isDragging) {
          updateSlider(e);
        }
      }, { passive: true });
      
      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
      
      document.addEventListener('touchend', () => {
        isDragging = false;
      });
      
      slider.addEventListener('click', (e) => {
        if (!isDragging) {
          updateSlider(e);
        }
      });
    });

    // 按钮
    const buttons = root.querySelectorAll('.settings-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id === 'checkUpdate') {
          alert('当前已是最新版本！');
        } else if (id === 'feedback') {
          alert('请发送邮件至 feedback@sweetplayer.com');
        }
      });
    });

    // 主题色选择
    const colorOptions = root.querySelectorAll('.settings-color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        const color = option.getAttribute('data-color');
        const picker = option.closest('.settings-color-picker');
        const id = picker.getAttribute('data-id');
        
        picker.querySelectorAll('.settings-color-option').forEach(opt => {
          opt.classList.remove('active');
          opt.innerHTML = '';
        });
        option.classList.add('active');
        option.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        
        this.updateSetting(id, color);
        ThemeManager.setAccentColor(color);
      });
    });

    // 背景图片选择
    const imagePickers = root.querySelectorAll('.settings-image-picker');
    imagePickers.forEach(picker => {
      const id = picker.getAttribute('data-id');
      const preview = picker.querySelector('[data-action="select-image"]');
      const clear = picker.querySelector('[data-action="clear-image"]');

      if (preview) {
        preview.addEventListener('click', async () => {
          try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('select-window-effect-image');
            if (result && !result.canceled && result.filePath) {
              this.updateSetting(id, result.filePath);
              this.refresh();
            }
          } catch (err) {
            console.error('选择背景图片失败:', err);
          }
        });
      }

      if (clear) {
        clear.addEventListener('click', () => {
          this.updateSetting(id, '');
          this.refresh();
        });
      }
    });
  },

  refresh() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = this.render();
      this.bindEvents();
    }
  },

  refreshContent() {
    const content = document.getElementById('settingsContent');
    if (content) {
      content.innerHTML = this.renderSettingsList();
      this.bindContentEvents(content);
    }
  },

  updateTabIndicator(activeTab) {
    const tabsContainer = document.querySelector('.settings-tabs');
    const indicator = tabsContainer ? tabsContainer.querySelector('.settings-tab-indicator') : null;
    if (!tabsContainer || !indicator) return;

    const tab = activeTab || tabsContainer.querySelector('.settings-tab.active');
    if (!tab) return;

    const containerRect = tabsContainer.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    indicator.style.left = (tabRect.left - containerRect.left) + 'px';
    indicator.style.width = tabRect.width + 'px';
  },

  findSetting(id) {
    for (const category of Object.values(this.settingsData)) {
      const item = category.find(i => i.id === id);
      if (item) return item;
    }
    return null;
  },

  updateSetting(id, value) {
    for (const category of Object.values(this.settingsData)) {
      const item = category.find(i => i.id === id);
      if (item) {
        item.value = value;
        console.log(`设置已更新: ${id} = ${value}`);
        
        // 应用实时生效的设置
        if (id === 'theme') {
          ThemeManager.setThemePreference(value);
        }
        
        // 动画效果开关
        if (id === 'animations') {
          this.applyAnimations(value);
        }
        
        // 沉浸播放器
        if (id === 'immersivePlayer') {
          this.applyImmersivePlayer(value);
        }
        
        // 窗口特效改变时刷新页面以显示/隐藏相关设置
        if (id === 'windowEffect') {
          this.refresh();
          // 应用窗口特效
          this.applyWindowEffect(value);
        }

        // 自定义图片改变时应用效果
        if (id === 'windowEffectImage') {
          this.applyWindowEffect(this.getSettingValue('windowEffect'));
        }
        
        // 毛玻璃强度改变时应用效果
        if (id === 'acrylicIntensity') {
          this.applyAcrylicIntensity(value);
        }
        
        // 毛玻璃强度滑块拖动时实时更新
        if (id === 'acrylicIntensity') {
          // 立即应用，不需要等待
          this.applyAcrylicIntensity(value);
        }
        
        // 保存设置到本地
        this.saveSettingsToFile();
        
        break;
      }
    }
  },

  // 保存设置到本地文件
  saveSettingsToFile() {
    try {
      const { ipcRenderer } = require('electron');
      const settings = {};
      
      // 收集所有设置项的值
      for (const [category, items] of Object.entries(this.settingsData)) {
        items.forEach(item => {
          settings[item.id] = item.value;
        });
      }
      
      ipcRenderer.send('save-settings', settings);
      console.log('设置已保存到文件:', settings);
    } catch (err) {
      console.error('保存设置失败:', err);
    }
  },

  // 从本地文件加载设置
  async loadSettingsFromFile() {
    try {
      const { ipcRenderer } = require('electron');
      const data = await ipcRenderer.invoke('load-settings');
      if (data) {
        // 恢复设置值
        for (const [category, items] of Object.entries(this.settingsData)) {
          items.forEach(item => {
            if (data[item.id] !== undefined) {
              item.value = data[item.id];
            }
          });
        }
        
        // 应用主题
        if (data.theme) {
          ThemeManager.setThemePreference(data.theme);
        }
        
        // 应用主题色
        if (data.accentColor) {
          ThemeManager.setAccentColor(data.accentColor);
        }
        
        // 应用窗口特效
        if (data.windowEffect) {
          this.applyWindowEffect(data.windowEffect);
        }
        
        // 应用毛玻璃强度
        if (data.acrylicIntensity !== undefined) {
          this.applyAcrylicIntensity(data.acrylicIntensity);
        }
        
        // 应用动画设置
        if (data.animations !== undefined) {
          this.applyAnimations(data.animations);
        }
        
        // 应用沉浸播放器
        if (data.immersivePlayer !== undefined) {
          this.applyImmersivePlayer(data.immersivePlayer);
        }
        
        console.log('设置已从文件加载:', data);
      }
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  },

  // 启动时加载设置
  async loadSettingsOnStartup() {
    try {
      const { ipcRenderer } = require('electron');
      const data = await ipcRenderer.invoke('load-settings');
      if (data) {
        // 恢复设置值，确保启动时应用特效能拿到图片路径、强度等依赖字段
        for (const items of Object.values(this.settingsData)) {
          items.forEach(item => {
            if (data[item.id] !== undefined) {
              item.value = data[item.id];
            }
          });
        }

        // 恢复主题
        if (data.theme) {
          ThemeManager.setThemePreference(data.theme);
        }
        
        // 恢复主题色
        if (data.accentColor) {
          ThemeManager.setAccentColor(data.accentColor);
        }
        
        // 应用动画设置
        if (data.animations !== undefined) {
          this.applyAnimations(data.animations);
        }
        
        // 应用沉浸播放器
        if (data.immersivePlayer !== undefined) {
          this.applyImmersivePlayer(data.immersivePlayer);
        }
        
        // 应用窗口特效
        if (data.windowEffect) {
          this.applyWindowEffect(data.windowEffect);
        }
        
        // 应用毛玻璃强度
        if (data.acrylicIntensity !== undefined) {
          this.applyAcrylicIntensity(data.acrylicIntensity);
        }
        
        console.log('启动时设置已加载:', data);
      }
    } catch (err) {
      console.error('启动时加载设置失败:', err);
    }
  },

  applyWindowEffect(effect) {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('set-window-effect', effect);
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;

    appContainer.classList.toggle('custom-window-image', effect === '自定义图片');
    appContainer.style.removeProperty('background-image');
    
    // 应用当前的毛玻璃强度
    if (effect === '亚克力') {
      const intensity = this.getSettingValue('acrylicIntensity') || 50;
      this.applyAcrylicIntensity(intensity);
    } else if (effect === '自定义图片') {
      const imagePath = this.getSettingValue('windowEffectImage');
      const imageUrl = this.getImageUrl(imagePath);
      if (imageUrl) {
        appContainer.style.setProperty('background-image', `url("${imageUrl}")`, 'important');
      }
      this.applyAcrylicIntensity(35);
    } else {
      this.applyAcrylicIntensity(0);
    }
  },

  getImageUrl(filePath) {
    if (!filePath) return '';
    try {
      const { pathToFileURL } = require('url');
      return pathToFileURL(filePath).href.replace(/'/g, '%27');
    } catch (err) {
      console.error('转换图片路径失败:', err);
      return '';
    }
  },

  applyAcrylicIntensity(intensity) {
    // 更新 CSS 变量
    document.documentElement.style.setProperty('--acrylic-intensity', intensity / 100);
    
    // 应用到侧边栏和播放器
    const sidebar = document.querySelector('.sidebar');
    const playerBar = document.querySelector('.control-bar');
    const settingsHeader = document.querySelector('.settings-header');
    
    const blurAmount = Math.max(0, (intensity / 100) * 20);
    const opacityAmount = Math.max(0.05, (intensity / 100) * 0.25);
    
    const acrylicStyle = `blur(${blurAmount}px)`;
    
    console.log('应用毛玻璃强度:', intensity, 'blur:', blurAmount, 'opacity:', opacityAmount);
    
    if (sidebar) {
      sidebar.style.backdropFilter = acrylicStyle;
      sidebar.style.webkitBackdropFilter = acrylicStyle;
      sidebar.style.background = `rgba(255, 255, 255, ${opacityAmount})`;
    }
    
    if (playerBar) {
      playerBar.style.backdropFilter = acrylicStyle;
      playerBar.style.webkitBackdropFilter = acrylicStyle;
      playerBar.style.background = `rgba(255, 255, 255, ${opacityAmount})`;
    }
    
    if (settingsHeader) {
      settingsHeader.style.backdropFilter = acrylicStyle;
      settingsHeader.style.webkitBackdropFilter = acrylicStyle;
    }
  },

  applyAnimations(enabled) {
    document.documentElement.classList.toggle('no-animations', !enabled);
  },

  applyImmersivePlayer(enabled) {
    const controlBar = document.querySelector('.control-bar');
    if (!controlBar) return;

    controlBar.classList.toggle('immersive', enabled);

    if (enabled) {
      if (!controlBar._immersiveBound) {
        controlBar._immersiveMouseEnter = () => {
          controlBar.classList.add('immersive-hover');
        };
        controlBar._immersiveMouseLeave = () => {
          controlBar.classList.remove('immersive-hover');
        };
        controlBar.addEventListener('mouseenter', controlBar._immersiveMouseEnter);
        controlBar.addEventListener('mouseleave', controlBar._immersiveMouseLeave);
        controlBar._immersiveBound = true;
      }
    } else {
      controlBar.classList.remove('immersive-hover');
      if (controlBar._immersiveBound) {
        controlBar.removeEventListener('mouseenter', controlBar._immersiveMouseEnter);
        controlBar.removeEventListener('mouseleave', controlBar._immersiveMouseLeave);
        controlBar._immersiveBound = false;
      }
    }
  }
};

module.exports = { SettingsPage };
