const { app, BrowserWindow, ipcMain, globalShortcut, nativeTheme, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const mm = require('music-metadata');

let mainWindow;
let currentWindowEffect = '亚克力';

// 数据存储路径
const userDataPath = app.getPath('userData');
const playlistsDataPath = path.join(userDataPath, 'playlists.json');
const settingsDataPath = path.join(userDataPath, 'settings.json');

// 读取歌单数据
function readPlaylistsData() {
  try {
    if (fs.existsSync(playlistsDataPath)) {
      const data = fs.readFileSync(playlistsDataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('读取歌单数据失败:', err);
  }
  return null;
}

// 保存歌单数据
function savePlaylistsData(data) {
  try {
    fs.writeFileSync(playlistsDataPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('保存歌单数据失败:', err);
    return false;
  }
}

// 读取设置数据
function readSettingsData() {
  try {
    if (fs.existsSync(settingsDataPath)) {
      const data = fs.readFileSync(settingsDataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('读取设置数据失败:', err);
  }
  return null;
}

// 保存设置数据
function saveSettingsData(data) {
  try {
    const currentData = readSettingsData() || {};
    const nextData = { ...currentData, ...data };
    fs.writeFileSync(settingsDataPath, JSON.stringify(nextData, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('保存设置数据失败:', err);
    return false;
  }
}

// 解析歌曲元数据
async function parseMetadata(filePath) {
  try {
    const metadata = await mm.parseFile(filePath);
    const common = metadata.common;
    let cover = null;
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      let format = pic.format;
      // 确保 format 是完整的 MIME type
      if (format && !format.startsWith('image/')) {
        format = 'image/' + format;
      }
      cover = `data:${format};base64,${pic.data.toString('base64')}`;
      console.log('解析到封面:', filePath, 'format:', format, 'size:', pic.data.length);
    } else {
      console.log('无封面:', filePath);
    }
    return {
      title: common.title || null,
      artist: common.artist || null,
      album: common.album || null,
      year: common.year || null,
      genre: common.genre && common.genre.length > 0 ? common.genre[0] : null,
      duration: metadata.format.duration || null,
      cover: cover
    };
  } catch (err) {
    console.error('解析元数据失败:', filePath, err.message);
    return {};
  }
}

function applyWindowEffect(effect) {
  currentWindowEffect = effect || '亚克力';
  if (!mainWindow || mainWindow.isDestroyed() || process.platform !== 'win32') return;

  switch (currentWindowEffect) {
    case '无':
    case '自定义图片':
      mainWindow.setBackgroundMaterial('none');
      break;
    case '亚克力':
    default:
      mainWindow.setBackgroundMaterial('acrylic');
      break;
  }
}

function createWindow() {
  // 检测系统主题
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  const savedSettings = readSettingsData() || {};
  currentWindowEffect = savedSettings.windowEffect || '亚克力';

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    resizable: true,
    fullscreenable: true,
    minimizable: true,
    maximizable: true,

    // 保留系统按钮，隐藏标题栏文字
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: isDarkMode ? '#ffffff' : '#000000',
      height: 40
    },

    // 任务栏图标
    icon: path.join(__dirname, 'assets', 'icon.png'),

    // 毛玻璃效果
    backgroundColor: '#00000000',
    backgroundMaterial: currentWindowEffect === '亚克力' ? 'acrylic' : 'none',

    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    applyWindowEffect(currentWindowEffect);
    // 发送当前主题到渲染进程
    mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    mainWindow.show();
  });

  // 修复：最大化后按当前设置重新应用窗口材质
  mainWindow.on('resize', () => {
    if (process.platform === 'win32' && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        if (!mainWindow.isDestroyed()) {
          applyWindowEffect(currentWindowEffect);
        }
      }, 100);
    }
  });

  // 注册 ESC 快捷键退出全屏
  globalShortcut.register('Escape', () => {
    if (mainWindow && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });
}

// 监听系统主题变化
  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const isDarkMode = nativeTheme.shouldUseDarkColors;
      // 更新标题栏按钮颜色
      mainWindow.setTitleBarOverlay({
        color: '#00000000',
        symbolColor: isDarkMode ? '#ffffff' : '#000000',
        height: 40
      });
      // 通知渲染进程主题变化
      mainWindow.webContents.send('theme-changed', isDarkMode ? 'dark' : 'light');
    }
  });

  // 监听渲染进程请求更新标题栏按钮颜色
  ipcMain.on('update-titlebar-buttons', (event, isDark) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitleBarOverlay({
        color: '#00000000',
        symbolColor: isDark ? '#ffffff' : '#000000',
        height: 40
      });
    }
  });

  // 监听窗口特效设置
  ipcMain.on('set-window-effect', (event, effect) => {
    applyWindowEffect(effect);
  });

  // 监听选择窗口特效图片
  ipcMain.handle('select-window-effect-image', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return { canceled: true };

    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        title: '选择窗口背景图片',
        filters: [
          { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }
        ]
      });

      if (result.canceled) return { canceled: true };
      return { canceled: false, filePath: result.filePaths[0] };
    } catch (err) {
      console.error('选择窗口背景图片出错:', err);
      return { canceled: true, error: err.message };
    }
  });

  // 监听选择音乐文件导入
  ipcMain.handle('select-music-files', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return { canceled: true };

    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        title: '选择音乐文件',
        filters: [
          { name: '音乐文件', extensions: ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'wma'] }
        ]
      });

      if (result.canceled) return { canceled: true };

      const files = [];
      for (const filePath of result.filePaths) {
        const stat = fs.statSync(filePath);
        const meta = await parseMetadata(filePath);
        files.push({
          name: meta.title || path.basename(filePath, path.extname(filePath)),
          path: filePath,
          size: stat.size,
          artist: meta.artist || '',
          album: meta.album || '',
          year: meta.year || '',
          genre: meta.genre || '',
          duration: meta.duration || 0,
          cover: meta.cover || ''
        });
      }

      return { canceled: false, files };
    } catch (err) {
      console.error('选择音乐文件出错:', err);
      return { canceled: true, error: err.message };
    }
  });

  // 监听选择文件夹导入音乐
  ipcMain.handle('select-music-folder', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return { canceled: true };
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: '选择音乐文件夹'
      });
      
      if (result.canceled) return { canceled: true };
      
      const folderPath = result.filePaths[0];
      const musicExtensions = ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.wma'];
      const files = [];
      
      function scanDir(dir) {
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              scanDir(fullPath);
            } else {
              const ext = path.extname(item).toLowerCase();
              if (musicExtensions.includes(ext)) {
                files.push({
                  name: item,
                  path: fullPath,
                  size: stat.size
                });
              }
            }
          }
        } catch (err) {
          console.error('扫描文件夹出错:', err);
        }
      }
      
      scanDir(folderPath);

      // 解析所有文件的元数据
      const filesWithMeta = [];
      for (const file of files) {
        const meta = await parseMetadata(file.path);
        filesWithMeta.push({
          name: meta.title || path.basename(file.path, path.extname(file.path)),
          path: file.path,
          size: file.size,
          artist: meta.artist || '',
          album: meta.album || '',
          year: meta.year || '',
          genre: meta.genre || '',
          duration: meta.duration || 0,
          cover: meta.cover || ''
        });
      }

      return { canceled: false, folderPath, files: filesWithMeta };
    } catch (err) {
      console.error('选择文件夹出错:', err);
      return { canceled: true, error: err.message };
    }
  });

  // 监听保存歌单数据
  ipcMain.on('save-playlists', (event, playlistsData) => {
    savePlaylistsData(playlistsData);
  });

  // 监听读取歌单数据
  ipcMain.handle('load-playlists', () => {
    return readPlaylistsData();
  });

  // 监听保存设置数据
  ipcMain.on('save-settings', (event, settingsData) => {
    saveSettingsData(settingsData);
  });

  // 监听读取设置数据
  ipcMain.handle('load-settings', () => {
    return readSettingsData();
  });

  // 监听解析歌曲元数据
  ipcMain.handle('parse-song-metadata', async (event, filePath) => {
    return await parseMetadata(filePath);
  });

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
