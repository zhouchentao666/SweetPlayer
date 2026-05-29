// 播放器管理
const PlayerBar = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 60,
  currentPlaylist: [],
  currentIndex: -1,
  audio: null,
  playMode: 'order',
  progressTimer: null,
  isDraggingProgress: false,
  isDraggingVolume: false,
  playbackRate: 1,

  init() {
    this.playBtn = document.getElementById('playBtn');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.playModeBtn = document.getElementById('playModeBtn');
    this.playModeMenu = document.getElementById('playModeMenu');
    this.progressTrack = document.getElementById('progressTrack');
    this.progressFill = document.getElementById('progressFill');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeFill = document.getElementById('volumeFill');
    this.currentTimeEl = document.getElementById('currentTime');
    this.durationEl = document.getElementById('duration');
    this.songNameEl = document.getElementById('playerSongName');
    this.artistNameEl = document.getElementById('playerArtistName');
    this.coverImg = document.getElementById('coverImg');
    this.nowPlayingCover = document.getElementById('nowPlayingCover');
    this.volumeBtn = document.getElementById('volumeBtn');
    this.volumeControl = document.querySelector('.volume-control');
    this.volumeValueEl = document.getElementById('volumeValue');
    this.speedBtn = document.getElementById('speedBtn');
    this.speedPopup = document.getElementById('speedPopup');
    this.speedText = document.querySelector('.speed-text');
    this.playlistToggleBtn = document.getElementById('playlistToggleBtn');
    this.playerPlaylistPanel = document.getElementById('playerPlaylistPanel');
    this.playlistPanelList = document.getElementById('playlistPanelList');
    this.playlistPanelCount = document.getElementById('playlistPanelCount');
    this.playlistPanelClear = document.getElementById('playlistPanelClear');

    if (!this.playBtn) {
      console.error('找不到播放按钮');
      return;
    }

    this.bindEvents();
    this.setVolume(60);
    this.restorePlayerState();

    // 窗口关闭前保存状态
    window.addEventListener('beforeunload', () => {
      this.savePlayerState();
    });

    // 定时保存状态（每30秒）
    setInterval(() => {
      this.savePlayerState();
    }, 30000);

    console.log('播放器初始化完成');
  },

  bindEvents() {
    // 播放/暂停
    this.playBtn.addEventListener('click', () => {
      this.togglePlay();
    });

    // 上一首
    this.prevBtn.addEventListener('click', () => {
      this.playPrev();
    });

    // 下一首
    this.nextBtn.addEventListener('click', () => {
      this.playNext();
    });

    // 播放模式切换（左键循环切换）
    this.playModeBtn.addEventListener('click', () => {
      const modes = ['single', 'order', 'reverse', 'random', 'stop'];
      const currentIndex = modes.indexOf(this.playMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      this.setPlayMode(modes[nextIndex]);
    });

    // 播放模式右键菜单
    this.playModeBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showPlayModeMenu(e);
    });

    // 播放模式菜单项点击
    if (this.playModeMenu) {
      const menuItems = this.playModeMenu.querySelectorAll('.playmode-menu-item');
      menuItems.forEach(item => {
        item.addEventListener('click', () => {
          const mode = item.getAttribute('data-mode');
          this.setPlayMode(mode);
          this.hidePopup(this.playModeMenu);
        });
      });
    }

    // 点击外部关闭播放模式菜单
    document.addEventListener('click', (e) => {
      if (this.playModeMenu && !this.playModeBtn.contains(e.target) && !this.playModeMenu.contains(e.target)) {
        if (window.getComputedStyle(this.playModeMenu).display !== 'none') {
          this.hidePopup(this.playModeMenu);
        }
      }
    });

    // 播放列表按钮
    if (this.playlistToggleBtn) {
      this.playlistToggleBtn.addEventListener('click', () => {
        this.togglePlaylistPanel();
      });
    }

    // 清空播放列表
    if (this.playlistPanelClear) {
      this.playlistPanelClear.addEventListener('click', () => {
        this.clearPlaylist();
      });
    }

    // 播放列表点击播放
    if (this.playlistPanelList) {
      this.playlistPanelList.addEventListener('click', (e) => {
        const item = e.target.closest('.playlist-panel-item');
        if (!item) return;
        const index = parseInt(item.getAttribute('data-index'), 10);
        if (!isNaN(index)) {
          this.playAtIndex(index);
          this.renderPlaylistPanel();
        }
      });

      this.playlistPanelList.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const item = e.target.closest('.playlist-panel-item');
        if (!item) return;
        const index = parseInt(item.getAttribute('data-index'), 10);
        if (!isNaN(index)) {
          this.removeFromPlaylist(index);
        }
      });
    }

    // 进度条拖动
    this.bindProgressDragEvents();

    // 音量条点击和拖动
    this.bindVolumeDragEvents();

    // 音量控制点击显示
    if (this.volumeControl && this.volumeBtn) {
      this.volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = this.volumeControl.classList.contains('active');
        if (isVisible) {
          this.volumeControl.classList.remove('active');
        } else {
          this.volumeControl.classList.add('active');
        }
      });

      // 点击外部关闭音量面板
      document.addEventListener('click', (e) => {
        if (this.volumeControl.classList.contains('active') &&
            !this.volumeControl.contains(e.target)) {
          this.volumeControl.classList.remove('active');
        }
      });

      // 阻止音量面板内部点击冒泡
      this.volumeControl.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // 倍速按钮点击
    if (this.speedBtn && this.speedPopup) {
      this.speedBtn.addEventListener('click', () => {
        this.speedPopup.classList.toggle('active');
      });

      // 倍速选项点击
      const speedOptions = this.speedPopup.querySelectorAll('.speed-option');
      speedOptions.forEach(option => {
        option.addEventListener('click', () => {
          const speed = parseFloat(option.getAttribute('data-speed'));
          this.setPlaybackRate(speed);
          
          // 更新UI
          speedOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
          if (this.speedText) {
            this.speedText.textContent = speed + 'x';
          }
          
          this.speedPopup.classList.remove('active');
        });
      });

      // 点击外部关闭
      document.addEventListener('click', (e) => {
        if (!this.speedBtn.contains(e.target) && !this.speedPopup.contains(e.target)) {
          this.speedPopup.classList.remove('active');
        }
      });
    }
  },

  // 绑定进度条拖动事件
  bindProgressDragEvents() {
    const handleDragStart = (e) => {
      if (!this.audio || !this.duration) return;
      this.isDraggingProgress = true;
      this.handleProgressDrag(e);
    };

    const handleDragMove = (e) => {
      if (!this.isDraggingProgress) return;
      e.preventDefault();
      this.handleProgressDrag(e);
    };

    const handleDragEnd = () => {
      if (!this.isDraggingProgress) return;
      this.isDraggingProgress = false;
    };

    // 鼠标事件
    this.progressTrack.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // 触摸事件（支持移动端）
    this.progressTrack.addEventListener('touchstart', (e) => {
      if (!this.audio || !this.duration) return;
      this.isDraggingProgress = true;
      this.handleProgressDrag(e.touches[0]);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
      if (!this.isDraggingProgress) return;
      e.preventDefault();
      this.handleProgressDrag(e.touches[0]);
    }, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  },

  // 处理进度条拖动
  handleProgressDrag(e) {
    const rect = this.progressTrack.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    this.seekToPercent(percent);
  },

  // 绑定音量条拖动事件
  bindVolumeDragEvents() {
    const handleDragStart = (e) => {
      this.isDraggingVolume = true;
      this.handleVolumeDrag(e);
    };

    const handleDragMove = (e) => {
      if (!this.isDraggingVolume) return;
      e.preventDefault();
      this.handleVolumeDrag(e);
    };

    const handleDragEnd = () => {
      if (!this.isDraggingVolume) return;
      this.isDraggingVolume = false;
    };

    this.volumeSlider.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    this.volumeSlider.addEventListener('touchstart', (e) => {
      this.isDraggingVolume = true;
      this.handleVolumeDrag(e.touches[0]);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
      if (!this.isDraggingVolume) return;
      e.preventDefault();
      this.handleVolumeDrag(e.touches[0]);
    }, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  },

  // 处理音量条拖动
  handleVolumeDrag(e) {
    const rect = this.volumeSlider.getBoundingClientRect();
    const clientX = e.clientX || 0;
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    this.setVolume(percent);
  },

  // 加载并播放歌曲
  async loadSong(song, playlist = [], index = -1) {
    if (!song || !song.path) {
      console.error('无效的歌曲路径');
      return;
    }

    // 尝试从主进程获取元数据（优先使用标题）
    try {
      const { ipcRenderer } = require('electron');
      const meta = await ipcRenderer.invoke('parse-song-metadata', song.path);
      if (meta) {
        if (meta.title) song.name = meta.title;
        if (meta.artist) song.artist = meta.artist;
        if (meta.album) song.album = meta.album;
        if (meta.year) song.year = meta.year;
        if (meta.genre) song.genre = meta.genre;
        if (meta.duration) song.duration = meta.duration;
        if (meta.cover) song.cover = meta.cover;
      }
    } catch (e) {
      console.error('获取元数据失败:', e);
    }

    // 停止当前播放
    this.stop();

    // 更新播放列表和索引
    this.currentPlaylist = playlist;
    this.currentIndex = index;

    // 创建新的音频对象
    this.audio = new Audio(song.path);
    this.audio.volume = this.volume / 100;
    this.audio.playbackRate = this.playbackRate;

    // 绑定音频事件
    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration;
      this.updateDurationDisplay();
      // 如果歌曲没有时长信息，从音频元素获取
      if (!song.duration && this.audio.duration) {
        song.duration = this.audio.duration;
      }
    });

    this.audio.addEventListener('ended', () => {
      this.onSongEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('音频加载失败:', e);
      this.isPlaying = false;
      this.updatePlayButton();
    });

    // 更新UI
    this.updateSongInfo(song);
    this.isPlaying = true;
    this.updatePlayButton();

    // 开始播放
    this.audio.play().catch(err => {
      console.error('播放失败:', err);
      this.isPlaying = false;
      this.updatePlayButton();
    });

    // 启动进度更新定时器
    this.startProgressTimer();

    console.log('开始播放:', song.name);
    this.renderPlaylistPanel();
  },

  // 播放/暂停切换
  togglePlay() {
    if (!this.audio) {
      // 如果没有歌曲在播放，播放当前列表第一首
      if (this.currentPlaylist.length > 0) {
        this.playAtIndex(0);
      }
      return;
    }

    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.stopProgressTimer();
    } else {
      this.audio.play().catch(err => {
        console.error('播放失败:', err);
      });
      this.isPlaying = true;
      this.startProgressTimer();
    }
    this.updatePlayButton();
  },

  // 播放指定索引的歌曲
  playAtIndex(index) {
    if (index < 0 || index >= this.currentPlaylist.length) return;
    const song = this.currentPlaylist[index];
    this.loadSong(song, this.currentPlaylist, index);
  },

  // 播放上一首
  playPrev() {
    if (this.currentPlaylist.length === 0) return;

    let prevIndex;
    if (this.playMode === 'random') {
      prevIndex = Math.floor(Math.random() * this.currentPlaylist.length);
    } else if (this.playMode === 'reverse') {
      prevIndex = this.currentIndex + 1;
      if (prevIndex >= this.currentPlaylist.length) {
        prevIndex = 0;
      }
    } else {
      prevIndex = this.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = this.currentPlaylist.length - 1;
      }
    }
    this.playAtIndex(prevIndex);
  },

  // 播放下一首
  playNext() {
    if (this.currentPlaylist.length === 0) return;

    let nextIndex;
    if (this.playMode === 'random') {
      nextIndex = Math.floor(Math.random() * this.currentPlaylist.length);
    } else if (this.playMode === 'reverse') {
      nextIndex = this.currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = this.currentPlaylist.length - 1;
      }
    } else {
      nextIndex = this.currentIndex + 1;
      if (nextIndex >= this.currentPlaylist.length) {
        nextIndex = 0;
      }
    }
    this.playAtIndex(nextIndex);
  },

  // 歌曲结束处理
  onSongEnded() {
    switch (this.playMode) {
      case 'single':
        if (this.audio) {
          this.audio.currentTime = 0;
          this.audio.play();
        }
        break;
      case 'order':
        if (this.currentIndex < this.currentPlaylist.length - 1) {
          this.playNext();
        }
        break;
      case 'reverse':
        if (this.currentIndex > 0) {
          this.playNext();
        }
        break;
      case 'random':
        this.playNext();
        break;
      case 'stop':
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopProgressTimer();
        break;
    }
  },

  // 停止播放
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.stopProgressTimer();
    this.updatePlayButton();
    this.setProgress(0);
    this.updateTimeDisplay();
    this.updateCover(null);
  },

  // 跳转到指定百分比
  seekToPercent(percent) {
    if (!this.audio || !this.duration) return;
    const time = (percent / 100) * this.duration;
    this.audio.currentTime = time;
    this.currentTime = time;
    this.setProgress(percent);
    this.updateTimeDisplay();
  },

  // 设置播放速度
  setPlaybackRate(rate) {
    this.playbackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  },

  // 设置播放模式
  setPlayMode(mode) {
    this.playMode = mode;
    this.updatePlayModeButton();
    this.updatePlayModeMenuActive();
    console.log('播放模式:', mode);
  },

  // 更新播放模式按钮图标和提示
  updatePlayModeButton() {
    const modeConfig = {
      single: {
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>',
        title: '单曲循环'
      },
      order: {
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
        title: '顺序播放'
      },
      reverse: {
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7H7v3l-4-4 4-4v3h12v6h-2V7zm-10 10h10v-3l4 4-4 4v-3H5v-6h2v4z"/></svg>',
        title: '逆序播放'
      },
      random: {
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
        title: '随机播放'
      },
      stop: {
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>',
        title: '播完停止'
      }
    };

    const config = modeConfig[this.playMode];
    if (config && this.playModeBtn) {
      this.playModeBtn.innerHTML = config.icon;
      this.playModeBtn.title = config.title;
    }
  },

  // 更新播放模式菜单选中状态
  updatePlayModeMenuActive() {
    if (!this.playModeMenu) return;
    const menuItems = this.playModeMenu.querySelectorAll('.playmode-menu-item');
    menuItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-mode') === this.playMode);
    });
  },

  // 显示播放模式右键菜单
  showPlayModeMenu(e) {
    if (!this.playModeMenu) return;
    this.updatePlayModeMenuActive();

    const rect = this.playModeBtn.getBoundingClientRect();
    this.playModeMenu.style.position = 'fixed';
    this.playModeMenu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    this.playModeMenu.style.right = (window.innerWidth - rect.right) + 'px';
    this.playModeMenu.style.left = 'auto';
    this.showPopup(this.playModeMenu);
  },

  // 启动进度定时器
  startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      if (this.audio && this.isPlaying && !this.isDraggingProgress) {
        this.currentTime = this.audio.currentTime;
        const percent = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
        this.setProgress(percent);
        this.updateTimeDisplay();
      }
    }, 1000);
  },

  // 停止进度定时器
  stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  },

  // 更新歌曲信息
  updateSongInfo(song) {
    if (this.songNameEl) {
      const displayName = song.name || this.getFileNameFromPath(song.path) || '未知歌曲';
      this.songNameEl.textContent = displayName;
    }
    if (this.artistNameEl) {
      this.artistNameEl.textContent = song.artist || '--';
    }
    this.updateCover(song.cover);
  },

  // 从路径提取文件名（不含扩展名）
  getFileNameFromPath(filePath) {
    if (!filePath) return '';
    const parts = filePath.split(/[\\/]/);
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.[^.]+$/, '');
  },

  // 更新封面
  updateCover(coverData) {
    if (!this.coverImg || !this.nowPlayingCover) return;
    const svgIcon = this.nowPlayingCover.querySelector('svg');
    if (coverData) {
      this.coverImg.src = coverData;
      this.coverImg.style.display = 'block';
      if (svgIcon) svgIcon.style.display = 'none';
      this.coverImg.onerror = () => {
        console.error('封面加载失败:', coverData.substring(0, 100) + '...');
        this.coverImg.style.display = 'none';
        if (svgIcon) svgIcon.style.display = 'block';
      };
    } else {
      this.coverImg.style.display = 'none';
      if (svgIcon) svgIcon.style.display = 'block';
    }
  },

  // 更新时间显示
  updateTimeDisplay() {
    if (this.currentTimeEl) {
      this.currentTimeEl.textContent = this.formatTime(this.currentTime);
    }
  },

  // 更新时长显示
  updateDurationDisplay() {
    if (this.durationEl) {
      this.durationEl.textContent = this.formatTime(this.duration);
    }
  },

  // 格式化时间
  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  // 更新播放按钮图标
  updatePlayButton() {
    const icon = this.isPlaying
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    this.playBtn.innerHTML = icon;
  },

  // 设置进度条
  setProgress(percent) {
    if (this.progressFill) {
      this.progressFill.style.width = percent + '%';
    }
  },

  // 设置音量
  setVolume(percent) {
    this.volume = percent;
    if (this.volumeFill) {
      this.volumeFill.style.width = percent + '%';
    }
    if (this.audio) {
      this.audio.volume = percent / 100;
    }
    if (this.volumeValueEl) {
      this.volumeValueEl.textContent = Math.round(percent);
    }
  },

  // 保存播放器状态
  savePlayerState() {
    try {
      const { ipcRenderer } = require('electron');
      const state = {
        volume: this.volume,
        playMode: this.playMode,
        playbackRate: this.playbackRate,
        currentSongPath: this.currentPlaylist.length > 0 && this.currentIndex >= 0
          ? this.currentPlaylist[this.currentIndex].path : null,
        currentTime: this.audio ? this.audio.currentTime : 0,
        isPlaying: this.isPlaying
      };
      ipcRenderer.send('save-settings', { playerState: state });
    } catch (e) {
      console.error('保存播放器状态失败:', e);
    }
  },

  // 恢复播放器状态
  async restorePlayerState() {
    try {
      const { ipcRenderer } = require('electron');
      const data = await ipcRenderer.invoke('load-settings');
      const state = data && data.playerState;
      if (!state) return;

      if (state.volume !== undefined) {
        this.setVolume(state.volume);
      }
      if (state.playMode) {
        this.setPlayMode(state.playMode);
      }
      if (state.playbackRate) {
        this.setPlaybackRate(state.playbackRate);
        const speedOptions = document.querySelectorAll('.speed-option');
        speedOptions.forEach(opt => {
          opt.classList.toggle('active', parseFloat(opt.getAttribute('data-speed')) === state.playbackRate);
        });
        if (this.speedText) {
          this.speedText.textContent = state.playbackRate + 'x';
        }
      }

      if (state.currentSongPath) {
        const playlistsData = await ipcRenderer.invoke('load-playlists');
        if (playlistsData && playlistsData.playlists) {
          let foundSong = null;
          let foundPlaylist = null;
          let foundIndex = -1;
          for (const playlist of playlistsData.playlists) {
            if (playlist.songs) {
              const idx = playlist.songs.findIndex(s => s.path === state.currentSongPath);
              if (idx !== -1) {
                foundSong = playlist.songs[idx];
                foundPlaylist = playlist.songs;
                foundIndex = idx;
                break;
              }
            }
          }
          if (foundSong) {
            this.currentPlaylist = foundPlaylist;
            this.currentIndex = foundIndex;
            this.audio = new Audio(foundSong.path);
            this.audio.volume = this.volume / 100;
            this.audio.playbackRate = this.playbackRate;
            this.audio.addEventListener('loadedmetadata', () => {
              this.duration = this.audio.duration;
              this.updateDurationDisplay();
              if (state.currentTime > 0 && state.currentTime < this.duration) {
                this.audio.currentTime = state.currentTime;
              }
            });
            this.audio.addEventListener('ended', () => {
              this.onSongEnded();
            });
            this.audio.addEventListener('error', () => {
              this.isPlaying = false;
              this.updatePlayButton();
            });
            this.updateSongInfo(foundSong);
            if (state.isPlaying) {
              this.audio.play().catch(() => {
                this.isPlaying = false;
                this.updatePlayButton();
              });
              this.isPlaying = true;
              this.updatePlayButton();
              this.startProgressTimer();
            } else {
              this.isPlaying = false;
              this.updatePlayButton();
            }
          }
        }
      }
      console.log('播放器状态已恢复');
    } catch (e) {
      console.error('恢复播放器状态失败:', e);
    }
  },

  // 切换播放列表面板
  togglePlaylistPanel() {
    if (!this.playerPlaylistPanel) return;
    const computedDisplay = window.getComputedStyle(this.playerPlaylistPanel).display;
    const isVisible = computedDisplay !== 'none' &&
                      !this.playerPlaylistPanel.classList.contains('popup-fade-out');
    if (isVisible) {
      this.hidePopup(this.playerPlaylistPanel, 'flex', () => {
        this.playlistToggleBtn.classList.remove('active');
      });
    } else {
      this.renderPlaylistPanel();
      this.showPopup(this.playerPlaylistPanel, 'flex', () => {
        this.playlistToggleBtn.classList.add('active');
      });
    }
  },

  // 渲染播放列表面板
  renderPlaylistPanel() {
    if (!this.playlistPanelList || !this.playlistPanelCount) return;
    const songs = this.currentPlaylist;
    this.playlistPanelCount.textContent = songs.length + '首';

    if (songs.length === 0) {
      this.playlistPanelList.innerHTML = '<div class="playlist-panel-empty">播放列表为空</div>';
      return;
    }

    this.playlistPanelList.innerHTML = songs.map((song, index) => {
      const isCurrent = index === this.currentIndex;
      const displayName = song.name || this.getFileNameFromPath(song.path) || '未知歌曲';
      return `
        <div class="playlist-panel-item${isCurrent ? ' current' : ''}" data-index="${index}">
          <div class="playlist-panel-item-info">
            <span class="playlist-panel-item-name">${displayName}</span>
            <span class="playlist-panel-item-artist">${song.artist || '--'}</span>
          </div>
          <span class="playlist-panel-item-duration">${this.formatDuration(song.duration)}</span>
        </div>
      `;
    }).join('');

    const currentItem = this.playlistPanelList.querySelector('.playlist-panel-item.current');
    if (currentItem) {
      currentItem.scrollIntoView({ block: 'nearest' });
    }
  },

  // 从播放列表移除歌曲
  removeFromPlaylist(index) {
    if (index < 0 || index >= this.currentPlaylist.length) return;
    this.currentPlaylist.splice(index, 1);
    if (index < this.currentIndex) {
      this.currentIndex--;
    } else if (index === this.currentIndex) {
      if (this.currentIndex >= this.currentPlaylist.length) {
        this.currentIndex = this.currentPlaylist.length - 1;
      }
      if (this.currentPlaylist.length === 0) {
        this.stop();
      }
    }
    this.renderPlaylistPanel();
  },

  // 清空播放列表
  clearPlaylist() {
    this.currentPlaylist = [];
    this.currentIndex = -1;
    this.stop();
    this.renderPlaylistPanel();
  },

  showPopup(el, displayType = 'block', onAfterShow) {
    if (!el) return;
    el.classList.remove('popup-fade-out');
    el.style.display = displayType;
    el.classList.add('popup-entrance');
    const onEnd = () => {
      el.removeEventListener('animationend', onEnd);
      el.classList.remove('popup-entrance');
      if (onAfterShow) onAfterShow();
    };
    el.addEventListener('animationend', onEnd);
  },

  hidePopup(el, displayType = 'block', onAfterHide) {
    if (!el) return;
    el.classList.remove('popup-entrance');
    el.classList.add('popup-fade-out');
    const onEnd = () => {
      el.removeEventListener('animationend', onEnd);
      el.classList.remove('popup-fade-out');
      el.style.display = 'none';
      if (onAfterHide) onAfterHide();
    };
    el.addEventListener('animationend', onEnd);
  },

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};

module.exports = { PlayerBar };
