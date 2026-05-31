// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM 已加载，开始初始化...');
  await ThemeManager.init();
  await Sidebar.init();
  PlayerBar.init();
  
  // 加载并应用所有保存的设置
  await SettingsPage.loadSettingsOnStartup();
  
  console.log('初始化完成');
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'd':
        e.preventDefault();
        Sidebar.setActive('discover');
        Sidebar.handleNavigate('discover');
        break;
      case 'l':
        e.preventDefault();
        Sidebar.setActive('library');
        Sidebar.handleNavigate('library');
        break;
      case 'p':
        e.preventDefault();
        Sidebar.setActive('playlists');
        Sidebar.handleNavigate('playlists');
        break;
      case 'f':
        e.preventDefault();
        Sidebar.setActive('favorites');
        Sidebar.handleNavigate('favorites');
        break;
      case 'h':
        e.preventDefault();
        Sidebar.setActive('history');
        Sidebar.handleNavigate('history');
        break;
    }
  }
});
