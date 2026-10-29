/**
 * Ziddi Official App Release Announcement Modal
 * Live on Apple App Store & Google Play Store
 */

(function () {
  // Modal Control Functions
  window.openLaunchModal = function () {
    const backdrop = document.getElementById('launchModalBackdrop');
    if (backdrop) {
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeLaunchModal = function () {
    const backdrop = document.getElementById('launchModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
      try {
        sessionStorage.setItem('ziddi_app_live_popup_dismissed', 'true');
      } catch (e) {}
    }
  };

  function ensureLaunchModalHtml() {
    let backdrop = document.getElementById('launchModalBackdrop');
    const modalHtml = `
    <div class="launch-modal" id="launchModal" role="dialog" aria-modal="true" aria-labelledby="launchModalTitle">
      <button class="launch-modal-close" id="closeLaunchModalBtn" aria-label="Close Announcement">&times;</button>
      
      <div class="launch-modal-pill" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399;">
        <span class="pill-dot" style="background: #10B981; box-shadow: 0 0 10px #10B981;"></span>
        <span>Official Store Release</span>
      </div>
      
      <h2 class="launch-modal-title" id="launchModalTitle">
        Ziddi is Officially<br>
        <span class="launch-highlight-date" style="background: linear-gradient(135deg, #34D399 0%, #10B981 50%, #6EE7B7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">NOW LIVE! 🚀</span>
      </h2>
      
      <p class="launch-modal-subtitle">
        India’s premier AI-Native Human Performance, 3D Workout Tracking &amp; Preventive Health super-app is now live on iOS &amp; Android. Download today and start your journey!
      </p>
      
      <!-- Feature Highlights -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 22px 0; text-align: center;">
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 8px;">
          <div style="font-size: 22px; margin-bottom: 4px;">🤖</div>
          <div style="font-size: 12px; font-weight: 700; color: #FFF;">AI Coach</div>
          <div style="font-size: 10.5px; color: #94A3B8;">Context Grounded</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 8px;">
          <div style="font-size: 22px; margin-bottom: 4px;">🏆</div>
          <div style="font-size: 12px; font-weight: 700; color: #FFF;">Challenges</div>
          <div style="font-size: 10.5px; color: #94A3B8;">Reel Proof &amp; Podium</div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 8px;">
          <div style="font-size: 22px; margin-bottom: 4px;">⚡</div>
          <div style="font-size: 12px; font-weight: 700; color: #FFF;">3D Anatomy</div>
          <div style="font-size: 10.5px; color: #94A3B8;">Precision Tracking</div>
        </div>
      </div>
      
      <!-- Modal Download Actions -->
      <div class="launch-modal-actions">
        <a href="https://apps.apple.com/in/app/ziddi/id6809047218" target="_blank" rel="noopener noreferrer" class="launch-btn btn-ios" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);">
          <span>🍏 Apple App Store</span>
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.ziddi.app&hl=en" target="_blank" rel="noopener noreferrer" class="launch-btn btn-android" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
          <span>🤖 Google Play Store</span>
        </a>
      </div>
      
      <div class="launch-modal-dismiss-wrapper">
        <button class="launch-dismiss-btn" id="dismissLaunchModal">Explore Ziddi Website →</button>
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
  }

  function initLaunchModal() {
    ensureLaunchModalHtml();
    const backdrop = document.getElementById('launchModalBackdrop');
    if (!backdrop) return;

    // Auto-open if not already dismissed in this session
    try {
      const isDismissed = sessionStorage.getItem('ziddi_app_live_popup_dismissed');
      if (!isDismissed) {
        setTimeout(function () {
          window.openLaunchModal();
        }, 400);
      }
    } catch (e) {
      setTimeout(function () {
        window.openLaunchModal();
      }, 400);
    }

    // Close button
    const closeBtn = document.getElementById('closeLaunchModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', window.closeLaunchModal);
    }

    // Dismiss button
    const dismissBtn = document.getElementById('dismissLaunchModal');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', window.closeLaunchModal);
    }

    // Click outside modal
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        window.closeLaunchModal();
      }
    });

    // ESC key close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        window.closeLaunchModal();
      }
    });

    // Allow clicking the top announcement banner text/badge to reopen the announcement modal
    const bannerTriggers = document.querySelectorAll('.top-announcement-banner, .top-announcement-banner .banner-content');
    bannerTriggers.forEach(trigger => {
      trigger.style.cursor = 'pointer';
      trigger.setAttribute('title', 'Click to view app store links');
      trigger.addEventListener('click', function (e) {
        // Only open modal if not clicking directly on one of the action buttons
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
