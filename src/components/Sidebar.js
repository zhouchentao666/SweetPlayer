const { Icons } = require('../utils/icons');
const { AppConfig } = require('../config/app.config');

class Sidebar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      collapsed: false,
      onNavigate: () => {},
      onAction: () => {},
      ...options
    };
    this.collapsed = this.options.collapsed;
    this.activeItem = 'discover';
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.updateResponsive();
  }

  render() {
    const { navItems, quickActions, user } = AppConfig;
    const collapsedClass = this.collapsed ? 'collapsed' : '';

    this.container.innerHTML = `
      <aside class="sidebar ${collapsedClass}">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">♪</div>
            <span class="logo-text">${AppConfig.appName}</span>
          </div>
          <button class="sidebar-toggle" id="sidebarToggle">
            ${Icons.chevronLeft}
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="nav-label">导航</span>
            <ul class="nav-list">
              ${navItems.map(item => this.renderNavItem(item)).join('')}
            </ul>
          </div>
        </nav>

        <div class="sidebar-actions">
          <div class="nav-section">
            <span class="nav-label">快捷操作</span>
            <ul class="nav-list">
              ${quickActions.map(action => this.renderActionItem(action)).join('')}
            </ul>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : Icons.user}
            </div>
            <div class="user-details">
              <span class="user-name">${user.name}</span>
              <span class="user-status">
                <span class="status-dot ${user.status}"></span>
                ${user.status === 'online' ? '在线' : '离线'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  renderNavItem(item) {
    const isActive = item.id === this.activeItem ? 'active' : '';
    const icon = Icons[item.icon] || Icons.compass;
    return `
      <li class="nav-item ${isActive}" data-id="${item.id}" data-type="nav">
        <span class="nav-icon">${icon}</span>
        <span class="nav-text">${item.label}</span>
        ${!this.collapsed && item.shortcut ? `<span class="nav-shortcut">${item.shortcut}</span>` : ''}
      </li>
    `;
  }

  renderActionItem(action) {
    const icon = Icons[action.icon] || Icons.plus;
    return `
      <li class="nav-item action-item" data-id="${action.id}" data-type="action">
        <span class="nav-icon">${icon}</span>
        <span class="nav-text">${action.label}</span>
      </li>
    `;
  }

  bindEvents() {
    // 折叠/展开
    const toggleBtn = this.container.querySelector('#sidebarToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    // 导航点击
    const navItems = this.container.querySelectorAll('[data-type="nav"]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        this.setActive(id);
        this.options.onNavigate(id);
      });
    });

    // 快捷操作点击
    const actionItems = this.container.querySelectorAll('[data-type="action"]');
    actionItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        this.options.onAction(id);
      });
    });

    // 响应式处理
    window.addEventListener('resize', () => this.updateResponsive());
  }

  toggle() {
    this.collapsed = !this.collapsed;
    const sidebar = this.container.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed', this.collapsed);
    this.render();
    this.bindEvents();
  }

  setActive(id) {
    this.activeItem = id;
    const items = this.container.querySelectorAll('[data-type="nav"]');
    items.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-id') === id);
    });
  }

  updateResponsive() {
    const width = window.innerWidth;
    const shouldCollapse = width < AppConfig.sidebar.breakpoint;
    if (shouldCollapse !== this.collapsed) {
      this.collapsed = shouldCollapse;
      const sidebar = this.container.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.toggle('collapsed', this.collapsed);
      }
    }
  }

  destroy() {
    window.removeEventListener('resize', () => this.updateResponsive());
    this.container.innerHTML = '';
  }
}

module.exports = { Sidebar };
