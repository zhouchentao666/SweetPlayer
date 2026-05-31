const { Icons } = require('../utils/icons');

class PlayerBar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      onPlay: () => {},
      onPause: () => {},
      onPrev: () => {},
      onNext: () => {},
      onShuffle: () => {},
      onRepeat: () => {},
      onVolumeChange: () => {},
      onProgressChange: () => {},
      ...options
    };
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 60;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="control-bar">
        <div class="control-left">
          <button class="control-btn" id="prevBtn" title="上一首">
            ${Icons.prev}
          </button>
          <button class="control-btn play-btn" id="playBtn" title="播放/暂停">
            ${Icons.play}
          </button>
          <button class="control-btn" id="nextBtn" title="下一首">
            ${Icons.next}
          </button>
        </div>

        <div class="control-center">
          <div class="song-info">
            <span class="song-name">未在播放</span>
            <span class="artist-name">--</span>
          </div>
          <div class="progress-bar">
            <span class="time" id="currentTime">0:00</span>
            <div class="progress-track" id="progressTrack">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <span class="time" id="duration">0:00</span>
          </div>
        </div>

        <div class="control-right">
          <button class="control-btn" id="shuffleBtn" title="随机播放">
            ${Icons.shuffle}
          </button>
          <button class="control-btn" id="repeatBtn" title="循环播放">
            ${Icons.repeat}
          </button>
          <div class="volume-control">
            <button class="control-btn" id="volumeBtn" title="音量">
              ${Icons.volume}
            </button>
            <div class="volume-slider" id="volumeSlider">
              <div class="volume-fill" id="volumeFill"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 播放/暂停
    const playBtn = this.container.querySelector('#playBtn');
    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playBtn.innerHTML = this.isPlaying ? Icons.pause : Icons.play;
      if (this.isPlaying) {
        this.options.onPlay();
      } else {
        this.options.onPause();
      }
    });

    // 上一首
    const prevBtn = this.container.querySelector('#prevBtn');
    prevBtn.addEventListener('click', () => this.options.onPrev());

    // 下一首
    const nextBtn = this.container.querySelector('#nextBtn');
    nextBtn.addEventListener('click', () => this.options.onNext());

    // 随机播放
    const shuffleBtn = this.container.querySelector('#shuffleBtn');
    shuffleBtn.addEventListener('click', () => {
      shuffleBtn.classList.toggle('active');
      this.options.onShuffle(shuffleBtn.classList.contains('active'));
    });

    // 循环播放
    const repeatBtn = this.container.querySelector('#repeatBtn');
    repeatBtn.addEventListener('click', () => {
      repeatBtn.classList.toggle('active');
      this.options.onRepeat(repeatBtn.classList.contains('active'));
    });

    // 进度条
    const progressTrack = this.container.querySelector('#progressTrack');
    const progressFill = this.container.querySelector('#progressFill');
    progressTrack.addEventListener('click', (e) => {
      const rect = progressTrack.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      progressFill.style.width = percent + '%';
      this.options.onProgressChange(percent);
    });

    // 音量条
    const volumeSlider = this.container.querySelector('#volumeSlider');
    const volumeFill = this.container.querySelector('#volumeFill');
    volumeSlider.addEventListener('click', (e) => {
      const rect = volumeSlider.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      volumeFill.style.width = percent + '%';
      this.volume = percent;
      this.options.onVolumeChange(percent);
    });
  }

  setSongInfo(name, artist) {
    const songName = this.container.querySelector('.song-name');
    const artistName = this.container.querySelector('.artist-name');
    if (songName) songName.textContent = name || '未在播放';
    if (artistName) artistName.textContent = artist || '--';
  }

  setProgress(current, total) {
    this.currentTime = current;
    this.duration = total;
    const percent = total > 0 ? (current / total) * 100 : 0;
    const progressFill = this.container.querySelector('#progressFill');
    if (progressFill) progressFill.style.width = percent + '%';

    const currentTimeEl = this.container.querySelector('#currentTime');
    const durationEl = this.container.querySelector('#duration');
    if (currentTimeEl) currentTimeEl.textContent = this.formatTime(current);
    if (durationEl) durationEl.textContent = this.formatTime(total);
  }

  setVolume(percent) {
    this.volume = percent;
    const volumeFill = this.container.querySelector('#volumeFill');
    if (volumeFill) volumeFill.style.width = percent + '%';
  }

  setPlaying(playing) {
    this.isPlaying = playing;
    const playBtn = this.container.querySelector('#playBtn');
    if (playBtn) playBtn.innerHTML = playing ? Icons.pause : Icons.play;
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

module.exports = { PlayerBar };
