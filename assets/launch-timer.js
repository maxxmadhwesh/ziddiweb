/**
 * Ziddi Diwali Mega Sale Announcement Modal & Top Banner
 * Features: 8-second auto-close with animated countdown slider, pause-on-hover,
 * App vs Web 2X coin perk comparison, Instagram giveaways link, and store CTAs.
 */

(function () {
  let autoCloseTimerId = null;
  let remainingMs = 8000;
  const TOTAL_MS = 8000;
  let isPaused = false;

  function updateSliderUI() {
    const track = document.getElementById('launchSliderTrack');
    const secs = document.getElementById('launchSliderSecs');
    if (track) {
      const pct = Math.max(0, Math.min(100, (remainingMs / TOTAL_MS) * 100));
      track.style.width = pct + '%';
    }
    if (secs) {
      const s = Math.max(0, Math.ceil(remainingMs / 1000));
      secs.textContent = s + 's';
    }
  }

  function startAutoCloseTimer() {
    clearAutoCloseTimer();
    remainingMs = TOTAL_MS;
    isPaused = false;
    updateSliderUI();

    const stepMs = 50; // Smooth 50ms interval updates
    autoCloseTimerId = setInterval(() => {
      if (isPaused) return;

      remainingMs -= stepMs;
      updateSliderUI();

      if (remainingMs <= 0) {
        clearAutoCloseTimer();
        window.closeLaunchModal();
      }
    }, stepMs);
  }

  function clearAutoCloseTimer() {
    if (autoCloseTimerId) {
      clearInterval(autoCloseTimerId);
      autoCloseTimerId = null;
    }
  }

  window.toggleLaunchSliderPause = function () {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('launchSliderPauseBtn');
    if (pauseBtn) {
      pauseBtn.textContent = isPaused ? 'Resume ▶' : 'Pause ⏸';
      pauseBtn.style.color = isPaused ? '#FBBF24' : '#64748B';
    }
  };

  // Modal Control Functions
  window.openLaunchModal = function () {
    const backdrop = document.getElementById('launchModalBackdrop');
    if (backdrop) {
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      startAutoCloseTimer();
    }
  };

  window.closeLaunchModal = function () {
    clearAutoCloseTimer();
    const backdrop = document.getElementById('launchModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
      try {
        sessionStorage.setItem('ziddi_diwali_sale_modal_dismissed', 'true');
      } catch (e) {}
    }
  };

  function ensureLaunchModalHtml() {
    let backdrop = document.getElementById('launchModalBackdrop');
    const modalHtml = `
    <div class="launch-modal diwali-modal" id="launchModal" role="dialog" aria-modal="true" aria-labelledby="launchModalTitle" style="
      background: #100F1A; border: 1.5px solid rgba(245, 158, 11, 0.45); border-radius: 28px;
      padding: 32px 26px; max-width: 520px; width: 100%; text-align: center; position: relative;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(245, 158, 11, 0.25);
      box-sizing: border-box; max-height: 92vh; overflow-y: auto;
    ">
      <button class="launch-modal-close" id="closeLaunchModalBtn" aria-label="Close Announcement" style="
        position: absolute; top: 16px; right: 16px; background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15); color: #94A3B8; font-size: 22px; width: 34px; height: 34px;
        border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
      ">&times;</button>
      
      <!-- Top Pill Tag -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
        <div style="
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.4);
          padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800;
          letter-spacing: 1px; color: #F472B6; text-transform: uppercase;
        ">
          <span>🪔</span>
          <span>DIWALI MEGA SALE LIVE</span>
        </div>
        <div style="
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #000; padding: 4px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 900;
          letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
        ">
          <span>🔥 LIMITED TIME</span>
        </div>
      </div>
      
      <!-- Main Title -->
      <h2 id="launchModalTitle" style="font-size: 28px; font-weight: 900; color: #FFF; margin: 0 0 6px 0; line-height: 1.2;">
        Diwali Sale is <span style="background: linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #EC4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">LIVE! 🪔</span>
      </h2>
      
      <p style="font-size: 13.5px; color: #94A3B8; margin: 0 0 18px 0; line-height: 1.5;">
        Huge festival discounts across all gym apparel &amp; gear + extra coin redemption on every order!
      </p>

      <!-- App vs Web Coin Comparison Highlight Box -->
      <div style="
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(236, 72, 153, 0.15) 100%);
        border: 1.5px solid rgba(245, 158, 11, 0.45); border-radius: 18px; padding: 14px; margin-bottom: 14px; text-align: left;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="assets/ziddi_coin.png" style="width: 22px; height: 22px;" alt="Ziddi Coin">
            <strong style="color: #FBBF24; font-size: 13.5px;">Ziddi Coin Redemption Power</strong>
          </div>
          <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px;">2X ON APP</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <!-- Web Perk -->
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px;">
            <div style="font-size: 10.5px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">🌐 Web Store</div>
            <div style="font-size: 14.5px; font-weight: 900; color: #FFF; margin-top: 2px;">Redeem 25 ZC</div>
            <div style="font-size: 11px; color: #EC4899; font-weight: 700;">Flat ₹25 OFF</div>
          </div>

          <!-- Mobile App Exclusive Perk -->
          <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%); border: 1.5px solid #F59E0B; border-radius: 12px; padding: 10px; position: relative;">
            <div style="font-size: 10.5px; font-weight: 800; color: #FBBF24; text-transform: uppercase;">📱 App Exclusive</div>
            <div style="font-size: 14.5px; font-weight: 900; color: #34D399; margin-top: 2px;">Redeem 50 ZC!</div>
            <div style="font-size: 11px; color: #FDE68A; font-weight: 800;">Flat ₹50 OFF (2X Savings!)</div>
          </div>
        </div>
        <div style="font-size: 11.5px; color: #CBD5E1; margin-top: 10px; line-height: 1.4; display: flex; align-items: center; gap: 6px;">
          <span>⚡</span>
          <span><strong>Want double discount?</strong> Use the Ziddi Mobile App to redeem 25 extra coins for ₹50 total savings!</span>
        </div>
      </div>

      <!-- Feature Deal Badges -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; text-align: left;">
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px;">
          <div style="font-size: 13px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 6px;">
            <span>🏷️</span> Mega Price Cuts
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 4px; line-height: 1.35;">
            Exclusive festive slashed prices across gym wear, tees, belts &amp; gear.
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px;">
          <div style="font-size: 13px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 6px;">
            <span>🎁</span> Free Goodies
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 4px; line-height: 1.35;">
            Instagram festive giveaways &amp; secret discount promo codes.
          </div>
        </div>
      </div>

      <!-- Instagram Giveaway Card -->
      <a href="https://www.instagram.com/ziddiapp/" target="_blank" rel="noopener noreferrer" style="
        display: flex; align-items: center; justify-content: space-between;
        background: rgba(236, 72, 153, 0.08); border: 1px solid rgba(236, 72, 153, 0.25);
        border-radius: 14px; padding: 10px 14px; margin-bottom: 16px; text-decoration: none;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">📸</span>
          <div style="text-align: left;">
            <div style="font-size: 12px; font-weight: 800; color: #FFF;">Win Free Coupon Codes &amp; Goodies</div>
            <div style="font-size: 11px; color: #9CA3AF;">Follow @ZiddiApp on Instagram for giveaways</div>
          </div>
        </div>
        <span style="background: linear-gradient(135deg, #EC4899 0%, #E11D48 100%); color: #FFF; font-size: 11.5px; font-weight: 800; padding: 4px 12px; border-radius: 999px;">Follow &gt;</span>
      </a>

      <!-- Primary Action: Explore Store on Web -->
      <a href="store.html" style="
        display: block; width: 100%; background: linear-gradient(135deg, #EC4899 0%, #E11D48 100%);
        color: #FFF; text-decoration: none; border-radius: 14px; padding: 14px; font-weight: 900;
        font-size: 15px; box-shadow: 0 4px 25px rgba(236, 72, 153, 0.5); text-align: center; box-sizing: border-box;
        margin-bottom: 14px; letter-spacing: 0.3px;
      ">
        Explore Festive Gear on Web (₹25 Off) &gt;
      </a>

      <!-- App Download Bar (For Extra ₹50 Off) -->
      <div style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 11px; font-weight: 700; color: #FBBF24; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          📲 Get 2X Coin Savings (₹50 OFF) — Download Ziddi App:
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <a href="https://apps.apple.com/in/app/ziddi/id6809047218" target="_blank" rel="noopener noreferrer" style="
            flex: 1; background: rgba(37, 99, 235, 0.15); border: 1px solid #3B82F6; color: #93C5FD;
            text-decoration: none; border-radius: 12px; padding: 9px; font-weight: 800; font-size: 12px; text-align: center;
          ">🍏 Apple App Store</a>
          <a href="https://play.google.com/store/apps/details?id=com.ziddi.app&hl=en" target="_blank" rel="noopener noreferrer" style="
            flex: 1; background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; color: #6EE7B7;
            text-decoration: none; border-radius: 12px; padding: 9px; font-weight: 800; font-size: 12px; text-align: center;
          ">🤖 Google Play Store</a>
        </div>
      </div>

      <!-- 8-Second Auto-Dismiss Slider Progress Bar -->
      <div class="launch-slider-wrapper" style="margin-top: 16px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; color: #94A3B8; display: flex; align-items: center; gap: 6px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #F59E0B; display: inline-block; box-shadow: 0 0 8px #F59E0B;"></span>
            Auto-closing banner in <strong id="launchSliderSecs" style="color: #FBBF24; font-weight: 800; font-variant-numeric: tabular-nums;">8s</strong>
          </span>
          <button id="launchSliderPauseBtn" onclick="window.toggleLaunchSliderPause()" style="background: none; border: none; color: #64748B; font-size: 11px; cursor: pointer; text-decoration: underline; padding: 0;">Pause ⏸</button>
        </div>
        <div style="width: 100%; height: 5px; background: rgba(255, 255, 255, 0.08); border-radius: 999px; overflow: hidden; position: relative;">
          <div id="launchSliderTrack" style="width: 100%; height: 100%; background: linear-gradient(90deg, #F59E0B 0%, #EC4899 50%, #3B82F6 100%); border-radius: 999px; transition: width 0.05s linear; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);"></div>
        </div>
      </div>
      
      <div class="launch-modal-dismiss-wrapper" style="margin-top: 10px;">
        <button class="launch-dismiss-btn" id="dismissLaunchModal" style="color: #9CA3AF; font-size: 12.5px; background: none; border: none; cursor: pointer;">Continue Browsing Website →</button>
      </div>
    </div>`;

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'launch-modal-backdrop';
      backdrop.id = 'launchModalBackdrop';
      backdrop.innerHTML = modalHtml;
      document.body.appendChild(backdrop);
    } else {
      backdrop.innerHTML = modalHtml;
    }

    attachModalEvents();
  }

  function attachModalEvents() {
    const backdrop = document.getElementById('launchModalBackdrop');
    const modal = document.getElementById('launchModal');
    if (!backdrop) return;

    // Pause on hover so reading/clicking isn't interrupted
    if (modal) {
      modal.onmouseenter = function () {
        isPaused = true;
        const pauseBtn = document.getElementById('launchSliderPauseBtn');
        if (pauseBtn) pauseBtn.textContent = 'Paused (reading)';
      };
      modal.onmouseleave = function () {
        isPaused = false;
        const pauseBtn = document.getElementById('launchSliderPauseBtn');
        if (pauseBtn) pauseBtn.textContent = 'Pause ⏸';
      };
    }

    // Close button
    const closeBtn = document.getElementById('closeLaunchModalBtn');
    if (closeBtn) {
      closeBtn.onclick = window.closeLaunchModal;
    }

    // Dismiss button
    const dismissBtn = document.getElementById('dismissLaunchModal');
    if (dismissBtn) {
      dismissBtn.onclick = window.closeLaunchModal;
    }

    // Click outside modal
    backdrop.onclick = function (e) {
      if (e.target === backdrop) {
        window.closeLaunchModal();
      }
    };
  }

  function updateTopBannerForDiwali() {
    const banner = document.querySelector('.top-announcement-banner');
    if (banner) {
      banner.style.background = 'linear-gradient(90deg, #78350F 0%, #D97706 30%, #EC4899 70%, #701A75 100%)';
      banner.style.borderBottom = '1px solid rgba(245, 158, 11, 0.4)';
      banner.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.35)';
      
      const badge = banner.querySelector('.banner-badge');
      if (badge) {
        badge.innerHTML = '🪔 DIWALI MEGA SALE';
        badge.style.background = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
        badge.style.color = '#000';
        badge.style.fontWeight = '900';
        badge.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.6)';
      }
      
      const text = banner.querySelector('.banner-text');
      if (text) {
        text.innerHTML = 'Festival Price Cuts Live! <strong style="color: #FDE68A;">Redeem 50 ZC (₹50 OFF) on App</strong> · 25 ZC on Web';
      }

      const actions = banner.querySelector('.banner-actions');
      if (actions) {
        actions.innerHTML = `
          <a href="store.html" class="banner-cta" style="background: rgba(255, 255, 255, 0.2); border: 1px solid #FFF; color: #FFF; font-weight: 800;">
            🛍️ Shop Sale
          </a>
          <a href="https://apps.apple.com/in/app/ziddi/id6809047218" target="_blank" rel="noopener noreferrer" class="banner-cta ios-cta">
            🍏 App Store
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.ziddi.app&hl=en" target="_blank" rel="noopener noreferrer" class="banner-cta android-cta">
            🤖 Google Play
          </a>
        `;
      }
    }
  }

  function initLaunchModal() {
    ensureLaunchModalHtml();
    updateTopBannerForDiwali();

    const backdrop = document.getElementById('launchModalBackdrop');
    if (!backdrop) return;

    // Auto-open on pageload
    try {
      const isDismissed = sessionStorage.getItem('ziddi_diwali_sale_modal_dismissed');
      if (!isDismissed) {
        setTimeout(function () {
          window.openLaunchModal();
        }, 350);
      }
    } catch (e) {
      setTimeout(function () {
        window.openLaunchModal();
      }, 350);
    }

    // ESC key close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        window.closeLaunchModal();
      }
    });

    // Clicking top announcement banner reopens modal
    const bannerTriggers = document.querySelectorAll('.top-announcement-banner, .top-announcement-banner .banner-content');
    bannerTriggers.forEach(trigger => {
      trigger.style.cursor = 'pointer';
      trigger.setAttribute('title', 'Click to view Diwali Mega Sale deals & app download links');
      trigger.addEventListener('click', function (e) {
        if (e.target.closest('.banner-actions a')) return;
        window.openLaunchModal();
      });
    });
  }

  // Initialize immediately on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLaunchModal);
  } else {
    initLaunchModal();
  }
})();
