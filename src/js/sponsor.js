// 赞助页面管理
const SponsorPage = {
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

  show() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    this.switchContent(mainContent, this.render());
    console.log('赞助页面已显示');
  },

  render() {
    return `
      <div class="sponsor-page">
        <div class="sponsor-header">
          <h1 class="sponsor-title">赞助支持</h1>
          <p class="sponsor-desc">感谢您对 SweetPlayer 的支持！您的赞助将帮助我们持续改进产品。</p>
        </div>
        <div class="sponsor-content">
          <div class="sponsor-item">
            <h3>微信支付</h3>
            <div class="sponsor-qr">
              <img src="assets/微信.jpg" alt="微信支付二维码">
            </div>
          </div>
          <div class="sponsor-item">
            <h3>支付宝</h3>
            <div class="sponsor-qr">
              <img src="assets/支付宝.jpg" alt="支付宝二维码">
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

module.exports = { SponsorPage };
