// 侧边栏管理
const Sidebar = {
  collapsed: false,
  activeItem: 'discover',

  async init() {
    this.sidebar = document.getElementById('sidebar');
    this.toggleBtn = document.getElementById('sidebarToggle');
    this.mainContent = document.getElementById('mainContent');

    if (!this.sidebar) {
      console.error('找不到侧边栏元素');
      return;
    }

    this.bindEvents();
    this.updateResponsive();
    
    // 加载保存的歌单数据
    await this.loadPlaylists();
    
    // 恢复上次的界面状态
    await this.restoreActiveItem();

    // 窗口关闭前保存界面状态
    window.addEventListener('beforeunload', () => {
      this.saveActiveItem();
    });
    
    console.log('侧边栏初始化完成');
  },

  // 加载歌单数据
  async loadPlaylists() {
    try {
      const { ipcRenderer } = require('electron');
      const data = await ipcRenderer.invoke('load-playlists');
      if (data && data.playlists) {
        // 恢复自定义歌单
        const playlistList = document.getElementById('playlistList');
        if (playlistList) {
          data.playlists.forEach(playlist => {
            if (playlist.id === 'all-songs' || playlist.id === 'my-favorites') {
              // 更新系统歌单的歌曲数据
              const item = this.sidebar.querySelector(`.playlist-item[data-id="${playlist.id}"]`);
              if (item && playlist.songs) {
                item.setAttribute('data-songs', JSON.stringify(playlist.songs));
              }
            } else {
              // 创建自定义歌单
              const li = document.createElement('li');
              li.className = 'nav-item playlist-item';
              li.setAttribute('data-id', playlist.id);
              li.setAttribute('data-desc', playlist.desc || '');
              if (playlist.cover) {
                li.setAttribute('data-cover', playlist.cover);
              }
              if (playlist.songs) {
                li.setAttribute('data-songs', JSON.stringify(playlist.songs));
              }
              const coverHtml = playlist.cover
                ? `<img src="${playlist.cover}" class="playlist-cover-img" alt="封面">`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>`;
              li.innerHTML = `
                <span class="nav-icon playlist-cover">${coverHtml}</span>
                <span class="nav-text">${playlist.name}</span>
              `;
              this.bindContextMenu(li);
              playlistList.appendChild(li);
            }
          });
        }
      }
    } catch (err) {
      console.error('加载歌单数据失败:', err);
    }
  },

  // 保存歌单数据
  savePlaylists() {
    try {
      const { ipcRenderer } = require('electron');
      const playlists = [];
      const playlistItems = this.sidebar.querySelectorAll('.playlist-item');
      
      playlistItems.forEach(item => {
        const id = item.getAttribute('data-id');
        const name = item.querySelector('.nav-text')?.textContent || '';
        const desc = item.getAttribute('data-desc') || '';
        const cover = item.getAttribute('data-cover') || '';
        const songsData = item.getAttribute('data-songs');
        const songs = songsData ? JSON.parse(songsData) : [];
        
        playlists.push({
          id,
          name,
          desc,
          cover,
          songs
        });
      });
      
      ipcRenderer.send('save-playlists', { playlists });
    } catch (err) {
      console.error('保存歌单数据失败:', err);
    }
  },

  bindEvents() {
    // 折叠/展开
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    // 导航点击
    const navItems = this.sidebar.querySelectorAll('.nav-item:not(.action-item):not(.playlist-item)');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        this.setActive(id);
        this.handleNavigate(id);
      });
    });

    // 歌单点击 - 使用事件委托避免重复绑定
    const playlistList = document.getElementById('playlistList');
    if (playlistList) {
      playlistList.addEventListener('click', (e) => {
        const item = e.target.closest('.playlist-item');
        if (!item) return;
        const id = item.getAttribute('data-id');
        this.setActivePlaylist(id);
        this.handlePlaylistClick(id);
      });
    }
    
    // 为现有歌单项绑定右键菜单
    const playlistItems = this.sidebar.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
      this.bindContextMenu(item);
    });

    // 新建歌单按钮
    const addPlaylistBtn = document.getElementById('addPlaylistBtn');
    if (addPlaylistBtn) {
      addPlaylistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.createPlaylist();
      });
    }

    // 快捷操作点击
    const actionItems = this.sidebar.querySelectorAll('.action-item');
    actionItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        this.handleAction(id);
      });
    });

    // 响应式处理
    window.addEventListener('resize', () => this.updateResponsive());
  },

  toggle() {
    this.collapsed = !this.collapsed;
    this.sidebar.classList.toggle('collapsed', this.collapsed);
    // 窗口窄时通过 expanded 类覆盖媒体查询的折叠样式
    this.sidebar.classList.toggle('expanded', !this.collapsed);
  },

  setActive(id) {
    this.activeItem = id;
    // 清除所有导航项、歌单项和快捷操作项的高亮
    const allItems = this.sidebar.querySelectorAll('.nav-item:not(.action-item), .playlist-item, .action-item');
    allItems.forEach(item => {
      item.classList.remove('active');
    });
    // 高亮当前选中的导航项
    const items = this.sidebar.querySelectorAll('.nav-item:not(.action-item)');
    items.forEach(item => {
      if (item.getAttribute('data-id') === id) {
        item.classList.add('active');
      }
    });
  },

  handleNavigate(id) {
    console.log('导航到:', id);
    const titles = {
      discover: '发现音乐',
      library: '音乐库',
      playlists: '播放列表',
      favorites: '我的收藏',
      history: '最近播放'
    };
    const title = titles[id] || 'SweetPlayer';
    this.switchContent(`
      <div class="placeholder-text">
        <h1>${title}</h1>
        <p>功能开发中...</p>
      </div>
    `);
  },

  handleAction(id) {
    console.log('快捷操作:', id);
    // 清除所有导航项、歌单项和快捷操作项的高亮
    const allItems = this.sidebar.querySelectorAll('.nav-item:not(.action-item), .playlist-item, .action-item');
    allItems.forEach(item => {
      item.classList.remove('active');
    });
    
    if (id === 'settings') {
      // 高亮设置项
      const settingsItem = this.sidebar.querySelector('.action-item[data-id="settings"]');
      if (settingsItem) {
        settingsItem.classList.add('active');
      }
      SettingsPage.show();
    } else if (id === 'sponsor') {
      // 高亮赞助项
      const sponsorItem = this.sidebar.querySelector('.action-item[data-id="sponsor"]');
      if (sponsorItem) {
        sponsorItem.classList.add('active');
      }
      SponsorPage.show();
    }
  },

  setActivePlaylist(id) {
    this.activeItem = id;
    // 清除所有导航项、歌单项和快捷操作项的高亮
    const allItems = this.sidebar.querySelectorAll('.nav-item:not(.action-item), .playlist-item, .action-item');
    allItems.forEach(item => {
      item.classList.remove('active');
    });
    // 高亮当前选中的歌单
    const items = this.sidebar.querySelectorAll('.playlist-item');
    items.forEach(item => {
      if (item.getAttribute('data-id') === id) {
        item.classList.add('active');
      }
    });
  },

  handlePlaylistClick(id) {
    console.log('打开歌单:', id);
    const titles = {
      'all-songs': '全部歌曲',
      'my-favorites': '我的收藏'
    };
    const title = titles[id] || '歌单';
    
    let songs = [];
    
    if (id === 'all-songs') {
      // 全部歌曲：综合所有歌单的歌曲
      const allPlaylistItems = this.sidebar.querySelectorAll('.playlist-item');
      const songMap = new Map(); // 用于去重
      
      allPlaylistItems.forEach(item => {
        const songsData = item.getAttribute('data-songs');
        if (songsData) {
          try {
            const itemSongs = JSON.parse(songsData);
            itemSongs.forEach(song => {
              if (song.path && !songMap.has(song.path)) {
                songMap.set(song.path, song);
              }
            });
          } catch (e) {
            // 忽略解析错误
          }
        }
      });
      
      songs = Array.from(songMap.values());
    } else {
      // 其他歌单：获取对应歌单的歌曲
      const item = this.sidebar.querySelector(`.playlist-item[data-id="${id}"]`);
      if (item) {
        const songsData = item.getAttribute('data-songs');
        if (songsData) {
          try {
            songs = JSON.parse(songsData);
          } catch (e) {
            songs = [];
          }
        }
      }
    }
    
    if (songs.length === 0) {
      const emptyMessage = id === 'all-songs'
        ? '暂无歌曲，请先在其他歌单导入音乐'
        : '暂无歌曲，右键歌单导入本地音乐';
      this.switchContent(`
        <div class="placeholder-text">
          <h1>${title}</h1>
          <p>${emptyMessage}</p>
        </div>
      `);
    } else {
      this.currentPlaylistId = id;
      this.currentPlaylistSongs = songs;
      this.isBatchMode = false;
      this.searchQuery = '';

      this.switchContent(`
        <div class="playlist-detail" data-playlist-id="${id}">
          <div class="playlist-detail-header">
            <div class="playlist-detail-title-row">
              <h1>${title}</h1>
              <span class="playlist-detail-count">共 ${songs.length} 首歌曲</span>
            </div>
            <div class="playlist-detail-toolbar">
              <div class="playlist-search-box">
                <svg class="playlist-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input type="text" class="playlist-search-input" id="playlistSearchInput" placeholder="搜索歌曲...">
              </div>
              <button class="playlist-toolbar-btn" id="batchEditBtn" title="批量编辑">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                <span>批量编辑</span>
              </button>
            </div>
          </div>
          <div class="playlist-batch-bar" id="playlistBatchBar" style="display: none;">
            <label class="batch-select-all">
              <input type="checkbox" id="batchSelectAll">
              <span>全选</span>
            </label>
            <span class="batch-selected-count" id="batchSelectedCount">已选 0 首</span>
            <button class="batch-delete-btn" id="batchDeleteBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              <span>删除所选</span>
            </button>
            <button class="batch-cancel-btn" id="batchCancelBtn">取消</button>
          </div>
          <div class="playlist-song-list" id="playlistSongList">
            ${this.renderSongItems(songs, false)}
          </div>
        </div>
      `, () => {
        this.bindPlaylistEvents(songs, id);
        this.fetchMissingMetadata(songs, id);
      });
    }
  },

  renderSongItems(songs, batchMode, filteredIndices) {
    const indices = filteredIndices || songs.map((_, i) => i);
    return indices.map((index) => {
      const song = songs[index];
      const displayName = song.name || this.getFileNameFromPath(song.path) || '未知歌曲';
      return `
        <div class="playlist-song-item${batchMode ? ' batch-mode' : ''}" data-index="${index}" data-path="${song.path || ''}" draggable="${batchMode ? 'false' : 'true'}">
          ${batchMode ? `<input type="checkbox" class="song-checkbox" data-index="${index}">` : `<span class="song-index">${index + 1}</span>`}
          <div class="song-info">
            <span class="song-name">${displayName}</span>
            <span class="song-artist">${song.artist || '--'}</span>
          </div>
          <span class="song-duration">${this.formatDuration(song.duration)}</span>
          ${batchMode ? '' : `<button class="song-play-btn" title="播放">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>`}
          ${batchMode ? '' : `<span class="song-drag-handle" title="拖动排序">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/></svg>
          </span>`}
        </div>
      `;
    }).join('');
  },

  // 从路径提取文件名（不含扩展名）
  getFileNameFromPath(filePath) {
    if (!filePath) return '';
    const parts = filePath.split(/[\\/]/);
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.[^.]+$/, '');
  },

  bindPlaylistEvents(songs, playlistId) {
    const searchInput = document.getElementById('playlistSearchInput');
    const batchEditBtn = document.getElementById('batchEditBtn');
    const batchBar = document.getElementById('playlistBatchBar');
    const batchSelectAll = document.getElementById('batchSelectAll');
    const batchSelectedCount = document.getElementById('batchSelectedCount');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    const batchCancelBtn = document.getElementById('batchCancelBtn');
    const songList = document.getElementById('playlistSongList');

    // 搜索
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchQuery = searchInput.value.trim().toLowerCase();
        this.filterPlaylistSongs(songs);
      });
    }

    // 批量编辑
    if (batchEditBtn) {
      batchEditBtn.addEventListener('click', () => {
        this.isBatchMode = true;
        if (batchBar) batchBar.style.display = 'flex';
        if (batchEditBtn) batchEditBtn.style.display = 'none';
        this.refreshSongList(songs, true);
      });
    }

    // 全选
    if (batchSelectAll) {
      batchSelectAll.addEventListener('change', () => {
        const checkboxes = songList.querySelectorAll('.song-checkbox');
        checkboxes.forEach(cb => { cb.checked = batchSelectAll.checked; });
        this.updateBatchCount();
      });
    }

    // 删除所选
    if (batchDeleteBtn) {
      batchDeleteBtn.addEventListener('click', () => {
        this.deleteSelectedSongs(songs, playlistId);
      });
    }

    // 取消批量
    if (batchCancelBtn) {
      batchCancelBtn.addEventListener('click', () => {
        this.exitBatchMode(songs);
      });
    }

    // 播放按钮
    const playBtns = this.mainContent.querySelectorAll('.song-play-btn');
    playBtns.forEach((btn) => {
      btn.onclick = async () => {
        const item = btn.closest('.playlist-song-item');
        const index = parseInt(item.getAttribute('data-index'), 10);
        const song = songs[index];
        if (song && song.path) {
          await PlayerBar.loadSong(song, songs, index);
        }
      };
    });

    // 双击播放
    const songItems = this.mainContent.querySelectorAll('.playlist-song-item');
    songItems.forEach((item) => {
      item.addEventListener('dblclick', async () => {
        if (this.isBatchMode) return;
        const index = parseInt(item.getAttribute('data-index'), 10);
        const song = songs[index];
        if (song && song.path) {
          await PlayerBar.loadSong(song, songs, index);
        }
      });
    });

    // 拖动排序
    this.bindDragSort(songList, songs, playlistId);
  },

  filterPlaylistSongs(songs) {
    const songList = document.getElementById('playlistSongList');
    if (!songList) return;

    let filteredIndices;
    if (!this.searchQuery) {
      filteredIndices = songs.map((_, i) => i);
    } else {
      filteredIndices = [];
      songs.forEach((song, index) => {
        const name = (song.name || '').toLowerCase();
        const artist = (song.artist || '').toLowerCase();
        if (name.includes(this.searchQuery) || artist.includes(this.searchQuery)) {
          filteredIndices.push(index);
        }
      });
    }

    songList.innerHTML = this.renderSongItems(songs, this.isBatchMode, filteredIndices);

    // 重新绑定事件
    if (this.isBatchMode) {
      songList.querySelectorAll('.song-checkbox').forEach(cb => {
        cb.addEventListener('change', () => this.updateBatchCount());
      });
    } else {
      songList.querySelectorAll('.song-play-btn').forEach(btn => {
        btn.onclick = async () => {
          const item = btn.closest('.playlist-song-item');
          const index = parseInt(item.getAttribute('data-index'), 10);
          const song = songs[index];
          if (song && song.path) {
            await PlayerBar.loadSong(song, songs, index);
          }
        };
      });
      songList.querySelectorAll('.playlist-song-item').forEach(item => {
        item.addEventListener('dblclick', async () => {
          const index = parseInt(item.getAttribute('data-index'), 10);
          const song = songs[index];
          if (song && song.path) {
            await PlayerBar.loadSong(song, songs, index);
          }
        });
      });
      this.bindDragSort(songList, songs, this.currentPlaylistId);
    }
  },

  refreshSongList(songs, batchMode) {
    const songList = document.getElementById('playlistSongList');
    if (!songList) return;

    songList.innerHTML = this.renderSongItems(songs, batchMode);

    if (batchMode) {
      songList.querySelectorAll('.song-checkbox').forEach(cb => {
        cb.addEventListener('change', () => this.updateBatchCount());
      });
    } else {
      songList.querySelectorAll('.song-play-btn').forEach(btn => {
        btn.onclick = async () => {
          const item = btn.closest('.playlist-song-item');
          const index = parseInt(item.getAttribute('data-index'), 10);
          const song = songs[index];
          if (song && song.path) {
            await PlayerBar.loadSong(song, songs, index);
          }
        };
      });
      songList.querySelectorAll('.playlist-song-item').forEach(item => {
        item.addEventListener('dblclick', async () => {
          const index = parseInt(item.getAttribute('data-index'), 10);
          const song = songs[index];
          if (song && song.path) {
            await PlayerBar.loadSong(song, songs, index);
          }
        });
      });
      this.bindDragSort(songList, songs, this.currentPlaylistId);
    }
  },

  updateBatchCount() {
    const songList = document.getElementById('playlistSongList');
    const countEl = document.getElementById('batchSelectedCount');
    if (!songList || !countEl) return;
    const checked = songList.querySelectorAll('.song-checkbox:checked').length;
    countEl.textContent = `已选 ${checked} 首`;
  },

  exitBatchMode(songs) {
    this.isBatchMode = false;
    const batchBar = document.getElementById('playlistBatchBar');
    const batchEditBtn = document.getElementById('batchEditBtn');
    if (batchBar) batchBar.style.display = 'none';
    if (batchEditBtn) batchEditBtn.style.display = 'flex';
    this.refreshSongList(songs, false);
  },

  deleteSelectedSongs(songs, playlistId) {
    const songList = document.getElementById('playlistSongList');
    if (!songList) return;

    const checkedBoxes = songList.querySelectorAll('.song-checkbox:checked');
    if (checkedBoxes.length === 0) return;

    const indicesToRemove = Array.from(checkedBoxes).map(cb => parseInt(cb.getAttribute('data-index'), 10));
    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach(index => {
      songs.splice(index, 1);
    });

    this.savePlaylistSongs(playlistId, songs);
    this.currentPlaylistSongs = songs;
    this.isBatchMode = false;

    const countEl = document.querySelector('.playlist-detail-count');
    if (countEl) countEl.textContent = `共 ${songs.length} 首歌曲`;

    const batchBar = document.getElementById('playlistBatchBar');
    const batchEditBtn = document.getElementById('batchEditBtn');
    if (batchBar) batchBar.style.display = 'none';
    if (batchEditBtn) batchEditBtn.style.display = 'flex';

    this.refreshSongList(songs, false);
  },

  savePlaylistSongs(playlistId, songs) {
    const playlistItem = this.sidebar.querySelector(`.playlist-item[data-id="${playlistId}"]`);
    if (playlistItem) {
      playlistItem.setAttribute('data-songs', JSON.stringify(songs));
    }
    this.savePlaylists();
  },

  async fetchMissingMetadata(songs, playlistId) {
    const { ipcRenderer } = require('electron');
    const missingIndices = [];

    songs.forEach((song, index) => {
      if (song.path && (!song.artist || !song.duration || !song.album)) {
        missingIndices.push(index);
      }
    });

    if (missingIndices.length === 0) return;

    let updated = false;

    for (const index of missingIndices) {
      const song = songs[index];
      try {
        const meta = await ipcRenderer.invoke('parse-song-metadata', song.path);
        if (meta) {
          if (meta.title) { song.name = meta.title; updated = true; }
          if (meta.artist) { song.artist = meta.artist; updated = true; }
          if (meta.album) { song.album = meta.album; updated = true; }
          if (meta.year) { song.year = meta.year; updated = true; }
          if (meta.genre) { song.genre = meta.genre; updated = true; }
          if (meta.duration) { song.duration = meta.duration; updated = true; }
          if (meta.cover) { song.cover = meta.cover; updated = true; }

          const songItem = this.mainContent.querySelector(`.playlist-song-item[data-index="${index}"]`);
          if (songItem) {
            const nameEl = songItem.querySelector('.song-name');
            const artistEl = songItem.querySelector('.song-artist');
            const durationEl = songItem.querySelector('.song-duration');
            if (nameEl && song.name) nameEl.textContent = song.name;
            if (artistEl && song.artist) artistEl.textContent = song.artist;
            if (durationEl && song.duration) durationEl.textContent = this.formatDuration(song.duration);
          }
        }
      } catch (e) {
        console.error('获取元数据失败:', song.path, e);
      }
    }

    if (updated) {
      this.currentPlaylistSongs = songs;
      if (playlistId === 'all-songs') {
        this.updateSourcePlaylistMetadata(songs);
      } else {
        this.savePlaylistSongs(playlistId, songs);
      }
    }
  },

  updateSourcePlaylistMetadata(updatedSongs) {
    const songMap = new Map();
    updatedSongs.forEach(song => {
      if (song.path) songMap.set(song.path, song);
    });

    const playlistItems = this.sidebar.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
      const id = item.getAttribute('data-id');
      if (id === 'all-songs') return;
      const songsData = item.getAttribute('data-songs');
      if (!songsData) return;
      try {
        const songs = JSON.parse(songsData);
        let changed = false;
        songs.forEach(song => {
          const updated = songMap.get(song.path);
          if (updated) {
            if (updated.artist && !song.artist) { song.artist = updated.artist; changed = true; }
            if (updated.album && !song.album) { song.album = updated.album; changed = true; }
            if (updated.duration && !song.duration) { song.duration = updated.duration; changed = true; }
            if (updated.cover && !song.cover) { song.cover = updated.cover; changed = true; }
            if (updated.name) { song.name = updated.name; changed = true; }
          }
        });
        if (changed) {
          item.setAttribute('data-songs', JSON.stringify(songs));
        }
      } catch (e) {}
    });
    this.savePlaylists();
  },

  bindDragSort(songList, songs, playlistId) {
    if (!songList) return;

    let dragItem = null;
    let dragStartIndex = -1;

    songList.querySelectorAll('.playlist-song-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        dragItem = item;
        dragStartIndex = parseInt(item.getAttribute('data-index'), 10);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragStartIndex);
      });

      item.addEventListener('dragend', () => {
        if (dragItem) dragItem.classList.remove('dragging');
        dragItem = null;
        songList.querySelectorAll('.playlist-song-item').forEach(el => {
          el.classList.remove('drag-over');
        });
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const dragging = songList.querySelector('.dragging');
        if (!dragging || dragging === item) return;

        songList.querySelectorAll('.playlist-song-item').forEach(el => {
          el.classList.remove('drag-over');
        });

        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          item.classList.add('drag-over-top');
        } else {
          item.classList.add('drag-over-bottom');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        songList.querySelectorAll('.playlist-song-item').forEach(el => {
          el.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        if (dragStartIndex === -1) return;
        const dropIndex = parseInt(item.getAttribute('data-index'), 10);
        if (dragStartIndex === dropIndex) return;

        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        let insertIndex = e.clientY < midY ? dropIndex : dropIndex + 1;

        const movedSong = songs.splice(dragStartIndex, 1)[0];
        if (insertIndex > dragStartIndex) insertIndex--;
        songs.splice(insertIndex, 0, movedSong);

        this.savePlaylistSongs(playlistId, songs);
        this.currentPlaylistSongs = songs;
        this.refreshSongList(songs, false);
      });
    });
  },

  // 打开歌单弹窗（新建或编辑）
  openPlaylistModal(mode = 'create', playlistId = null) {
    const modal = document.getElementById('createPlaylistModal');
    const title = document.getElementById('playlistModalTitle');
    const nameInput = document.getElementById('playlistNameInput');
    const descInput = document.getElementById('playlistDescInput');
    const coverPreview = document.getElementById('playlistCoverPreview');
    const coverInput = document.getElementById('playlistCoverInput');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const closeBtn = document.getElementById('modalCloseBtn');
    
    if (!modal || !nameInput) return;
    
    this.currentEditPlaylist = playlistId;
    this.currentCoverData = null;
    
    // 重置封面预览
    coverPreview.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
      <span>点击设置封面</span>
    `;
    coverPreview.classList.remove('has-image');
    
    if (mode === 'edit' && playlistId) {
      // 编辑模式
      title.textContent = '编辑歌单';
      confirmBtn.textContent = '保存';
      const item = this.sidebar.querySelector(`.playlist-item[data-id="${playlistId}"]`);
      if (item) {
        const nameEl = item.querySelector('.nav-text');
        nameInput.value = nameEl ? nameEl.textContent : '';
        // 恢复封面和描述（如果有）
        const coverData = item.getAttribute('data-cover');
        const descData = item.getAttribute('data-desc');
        if (coverData) {
          coverPreview.innerHTML = `<img src="${coverData}" alt="封面">`;
          coverPreview.classList.add('has-image');
          this.currentCoverData = coverData;
        }
        descInput.value = descData || '';
      }
    } else {
      // 新建模式
      title.textContent = '新建歌单';
      confirmBtn.textContent = '创建';
      nameInput.value = '';
      descInput.value = '';
    }
    
    // 显示弹窗
    modal.style.display = 'flex';
    nameInput.focus();
    
    const closeModal = () => {
      modal.style.display = 'none';
      this.currentEditPlaylist = null;
      this.currentCoverData = null;
    };
    
    // 移除旧的事件监听器
    const newCoverPreview = coverPreview.cloneNode(true);
    coverPreview.parentNode.replaceChild(newCoverPreview, coverPreview);
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    const newNameInput = nameInput.cloneNode(true);
    nameInput.parentNode.replaceChild(newNameInput, nameInput);
    
    // 更新引用
    const coverPreviewEl = newCoverPreview;
    const confirmBtnEl = newConfirmBtn;
    const cancelBtnEl = newCancelBtn;
    const closeBtnEl = newCloseBtn;
    const nameInputEl = newNameInput;
    
    // 封面选择
    coverPreviewEl.onclick = () => coverInput.click();
    coverInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.currentCoverData = event.target.result;
          coverPreviewEl.innerHTML = `<img src="${event.target.result}" alt="封面">`;
          coverPreviewEl.classList.add('has-image');
        };
        reader.readAsDataURL(file);
      }
    };

    const handleConfirm = () => {
      const name = nameInputEl.value.trim();
      const desc = descInput.value.trim();
      if (!name) return;
      
      if (mode === 'edit' && playlistId) {
        // 编辑现有歌单
        const item = this.sidebar.querySelector(`.playlist-item[data-id="${playlistId}"]`);
        if (item) {
          const nameEl = item.querySelector('.nav-text');
          if (nameEl) nameEl.textContent = name;
          item.setAttribute('data-desc', desc);
          if (this.currentCoverData) {
            item.setAttribute('data-cover', this.currentCoverData);
            const coverEl = item.querySelector('.playlist-cover');
            if (coverEl) {
              coverEl.innerHTML = `<img src="${this.currentCoverData}" class="playlist-cover-img" alt="封面">`;
            }
          }
          // 保存歌单数据
          this.savePlaylists();
        }
      } else {
        // 新建歌单
        const playlistList = document.getElementById('playlistList');
        if (playlistList) {
          const id = 'playlist-' + Date.now();
          const li = document.createElement('li');
          li.className = 'nav-item playlist-item';
          li.setAttribute('data-id', id);
          li.setAttribute('data-desc', desc);
          if (this.currentCoverData) {
            li.setAttribute('data-cover', this.currentCoverData);
          }
          const coverHtml = this.currentCoverData 
            ? `<img src="${this.currentCoverData}" class="playlist-cover-img" alt="封面">`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>`;
          li.innerHTML = `
            <span class="nav-icon playlist-cover">${coverHtml}</span>
            <span class="nav-text">${name}</span>
          `;
          // 绑定右键菜单
          this.bindContextMenu(li);
          playlistList.appendChild(li);
        }
      }
      // 保存歌单数据
      this.savePlaylists();
      closeModal();
    };
    
    confirmBtnEl.onclick = handleConfirm;
    cancelBtnEl.onclick = closeModal;
    closeBtnEl.onclick = closeModal;
    
    // 点击遮罩关闭
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
    
    // 回车确认
    nameInputEl.onkeydown = (e) => {
      if (e.key === 'Enter') handleConfirm();
      if (e.key === 'Escape') closeModal();
    };
  },

  createPlaylist() {
    this.openPlaylistModal('create');
  },

  // 绑定右键菜单
  bindContextMenu(element) {
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const playlistId = element.getAttribute('data-id');
      if (!playlistId) return;
      
      this.showContextMenu(e.clientX, e.clientY, playlistId);
    });
  },

  // 显示右键菜单
  showContextMenu(x, y, playlistId) {
    const menu = document.getElementById('playlistContextMenu');
    const importFilesBtn = document.getElementById('contextImportFiles');
    const importFolderBtn = document.getElementById('contextImportFolder');
    const editBtn = document.getElementById('contextEdit');
    const deleteBtn = document.getElementById('contextDelete');
    const editDivider = document.getElementById('contextEditDivider');
    const deleteDivider = document.getElementById('contextDeleteDivider');
    
    if (!menu) return;
    
    // 判断是否为系统默认歌单
    const isSystemPlaylist = playlistId === 'all-songs' || playlistId === 'my-favorites';
    
    // 设置菜单位置
    menu.style.display = 'block';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    // 确保菜单不超出窗口
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (y - rect.height) + 'px';
    }
    
    // 导入本地歌曲 - 仅「我的收藏」和自定义歌单显示，「全部歌曲」不显示
    if (playlistId === 'all-songs') {
      importFilesBtn.style.display = 'none';
      importFolderBtn.style.display = 'none';
    } else {
      importFilesBtn.style.display = 'flex';
      importFilesBtn.onclick = () => {
        menu.style.display = 'none';
        this.importLocalSongs(playlistId);
      };
      importFolderBtn.style.display = 'flex';
      importFolderBtn.onclick = () => {
        menu.style.display = 'none';
        this.importFolderSongs(playlistId);
      };
    }
    
    // 编辑和删除 - 仅自定义歌单显示
    if (isSystemPlaylist) {
      editBtn.style.display = 'none';
      editDivider.style.display = 'none';
      deleteBtn.style.display = 'none';
      deleteDivider.style.display = 'none';
    } else {
      editBtn.style.display = 'flex';
      editDivider.style.display = 'block';
      deleteBtn.style.display = 'flex';
      deleteDivider.style.display = 'block';
      
      // 编辑
      editBtn.onclick = () => {
        menu.style.display = 'none';
        this.openPlaylistModal('edit', playlistId);
      };
      
      // 删除
      deleteBtn.onclick = () => {
        menu.style.display = 'none';
        this.showConfirm({
          title: '删除歌单',
          message: '确定要删除这个歌单吗？删除后无法恢复。',
          confirmText: '删除',
          onConfirm: () => {
            const item = this.sidebar.querySelector(`.playlist-item[data-id="${playlistId}"]`);
            if (item) {
              item.remove();
              this.savePlaylists();
              if (this.mainContent && this.mainContent.querySelector('h1')?.textContent === item.querySelector('.nav-text')?.textContent) {
                this.handleNavigate('discover');
              }
            }
          }
        });
      };
    }
    
    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  },

  // 导入本地歌曲到歌单（选择文件）
  async importLocalSongs(playlistId) {
    try {
      const { ipcRenderer } = require('electron');
      const result = await ipcRenderer.invoke('select-music-files');
      
      if (result.canceled) return;
      
      if (result.error) {
        console.error('导入出错:', result.error);
        alert('导入失败: ' + result.error);
        return;
      }
      
      const files = result.files || [];
      if (files.length === 0) {
        alert('未找到音乐文件');
        return;
      }
      
      this.addSongsToPlaylist(playlistId, files);
    } catch (err) {
      console.error('导入失败:', err);
      alert('导入失败: ' + (err.message || '未知错误'));
    }
  },

  // 导入本地歌曲到歌单（选择文件夹）
  async importFolderSongs(playlistId) {
    try {
      const { ipcRenderer } = require('electron');
      const result = await ipcRenderer.invoke('select-music-folder');
      
      if (result.canceled) return;
      
      if (result.error) {
        console.error('导入出错:', result.error);
        alert('导入失败: ' + result.error);
        return;
      }
      
      const files = result.files || [];
      if (files.length === 0) {
        alert('未找到音乐文件');
        return;
      }
      
      this.addSongsToPlaylist(playlistId, files);
    } catch (err) {
      console.error('导入失败:', err);
      alert('导入失败: ' + (err.message || '未知错误'));
    }
  },

  // 显示确认弹窗
  showConfirm(options) {
    const modal = document.getElementById('confirmModal');
    const iconEl = document.getElementById('confirmIcon');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    
    if (!modal) return;
    
    const isSuccess = options.type === 'success';
    
    iconEl.classList.toggle('success', isSuccess);
    iconEl.innerHTML = isSuccess
      ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'
      : '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-10v6h2V7h-2z"/>';
    
    titleEl.textContent = options.title || '确认';
    messageEl.textContent = options.message || '';
    okBtn.textContent = options.confirmText || '确定';
    okBtn.className = isSuccess ? 'confirm-btn confirm-btn-primary' : 'confirm-btn confirm-btn-danger';
    cancelBtn.style.display = isSuccess ? 'none' : 'inline-block';
    
    modal.style.display = 'flex';
    
    const closeModal = () => {
      modal.style.display = 'none';
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };
    
    okBtn.onclick = () => {
      closeModal();
      if (options.onConfirm) options.onConfirm();
    };
    
    cancelBtn.onclick = () => {
      closeModal();
      if (options.onCancel) options.onCancel();
    };
    
    // 点击遮罩关闭
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
        if (options.onCancel) options.onCancel();
      }
    };
    
    // ESC 取消
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        if (options.onCancel) options.onCancel();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  },

  // 将歌曲添加到歌单
  addSongsToPlaylist(playlistId, files) {
    const item = this.sidebar.querySelector(`.playlist-item[data-id="${playlistId}"]`);
    if (!item) return;
    
    let existingSongs = [];
    const songsData = item.getAttribute('data-songs');
    if (songsData) {
      try {
        existingSongs = JSON.parse(songsData);
      } catch (e) {
        existingSongs = [];
      }
    }
    
    const newSongs = files.map(file => ({
      name: file.name,
      path: file.path,
      size: file.size,
      artist: file.artist || '',
      album: file.album || '',
      year: file.year || '',
      genre: file.genre || '',
      duration: file.duration || 0,
      cover: file.cover || ''
    }));
    
    const allSongs = [...existingSongs, ...newSongs];
    item.setAttribute('data-songs', JSON.stringify(allSongs));
    
    this.savePlaylists();
    
    const currentTitle = this.mainContent?.querySelector('h1')?.textContent;
    const playlistName = item.querySelector('.nav-text')?.textContent;
    if (currentTitle === playlistName) {
      this.handlePlaylistClick(playlistId);
    }
    
    this.showConfirm({
      type: 'success',
      title: '导入成功',
      message: `成功导入 ${files.length} 首歌曲到「${playlistName}」`,
      confirmText: '知道了'
    });
  },

  updateResponsive() {
    const width = window.innerWidth;
    const shouldCollapse = width < 900;
    if (shouldCollapse && !this.collapsed) {
      // 窗口变窄时自动折叠
      this.collapsed = true;
      this.sidebar.classList.add('collapsed');
    }
    // 窗口变宽时不自动展开，保留用户手动展开的状态
  },

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  saveActiveItem() {
    try {
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('save-settings', { activeItem: this.activeItem });
    } catch (e) {
      console.error('保存界面状态失败:', e);
    }
  },

  async restoreActiveItem() {
    try {
      const { ipcRenderer } = require('electron');
      const data = await ipcRenderer.invoke('load-settings');
      const savedItem = data && data.activeItem;
      if (!savedItem) return;

      const navItems = ['discover', 'library', 'playlists', 'favorites', 'history'];
      const actionItems = ['settings', 'sponsor'];

      if (navItems.includes(savedItem)) {
        this.setActive(savedItem);
        this.handleNavigate(savedItem);
      } else if (actionItems.includes(savedItem)) {
        this.handleAction(savedItem);
      } else {
        const playlistItem = this.sidebar.querySelector(`.playlist-item[data-id="${savedItem}"]`);
        if (playlistItem) {
          this.setActivePlaylist(savedItem);
          this.handlePlaylistClick(savedItem);
        }
      }
      console.log('界面状态已恢复:', savedItem);
    } catch (e) {
      console.error('恢复界面状态失败:', e);
    }
  },

  // Fluent Design 页面切换动画
  switchContent(html, onAfterRender) {
    if (!this.mainContent) return;

    const currentChild = this.mainContent.firstElementChild;

    if (!currentChild) {
      this.mainContent.innerHTML = html;
      const newChild = this.mainContent.firstElementChild;
      if (newChild) {
        newChild.classList.add('content-entrance');
      }
      if (onAfterRender) onAfterRender();
      return;
    }

    // 当前内容淡出
    currentChild.classList.add('content-fade-out');

    // 动画结束后替换内容并入场
    const onFadeOutEnd = () => {
      currentChild.removeEventListener('animationend', onFadeOutEnd);
      this.mainContent.innerHTML = html;
      const newChild = this.mainContent.firstElementChild;
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
  }
};

module.exports = { Sidebar };
