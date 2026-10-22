/**
 * Ziddi Launch Countdown & Opening Announcement Modal
 * Target Launch Date: 29th October 2026 (IST)
 */

(function () {
  // Target: 29th October 2026 00:00:00 IST
  const LAUNCH_DATE_MS = new Date('2026-10-29T00:00:00+05:30').getTime();

  function padZero(num) {
    return num < 10 ? '0' + num : String(num);
  }

  function updateCountdowns() {
    const now = Date.now();
    const diff = LAUNCH_DATE_MS - now;

    if (diff <= 0) {
      // Launch has arrived
      setText('topDays', '00');
      setText('topHours', '00');
      setText('topMins', '00');
      setText('topSecs', '00');

      setText('popupDays', '00');
      setText('popupHours', '00');
      setText('popupMins', '00');
      setText('popupSecs', '00');
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    // Top banner timer
    setText('topDays', padZero(days));
    setText('topHours', padZero(hours));
    setText('topMins', padZero(mins));
    setText('topSecs', padZero(secs));

    // Modal popup timer
    setText('popupDays', padZero(days));
    setText('popupHours', padZero(hours));
    setText('popupMins', padZero(mins));
    setText('popupSecs', padZero(secs));
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el && el.textContent !== text) {
      el.textContent = text;
    }
  }

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
        sessionStorage.setItem('ziddi_launch_popup_dismissed', 'true');
      } catch (e) {}
    }
  };

  function ensureLaunchModalHtml() {
    if (document.getElementById('launchModalBackdrop')) return;
    const div = document.createElement('div');
    div.className = 'launch-modal-backdrop';
    div.id = 'launchModalBackdrop';
    div.innerHTML = `
    <div class="launch-modal" id="launchModal" role="dialog" aria-modal="true" aria-labelledby="launchModalTitle">
      <button class="launch-modal-close" id="closeLaunchModalBtn" aria-label="Close Announcement">&times;</button>
      
      <div class="launch-modal-pill">
        <span class="pill-dot"></span>
        <span>Official Launch Announcement</span>
      </div>
      
      <h2 class="launch-modal-title" id="launchModalTitle">
        Ziddi Goes Live On<br>
        <span class="launch-highlight-date">29th October 2026</span>
      </h2>
      
      <p class="launch-modal-subtitle">
        The countdown is officially on! India’s premier AI-Native Human Performance, 3D Workout Tracking &amp; Preventive Health super-app is launching everywhere on iOS &amp; Android. Stay tuned!
      </p>
      
      <!-- Big Countdown Timer Display -->
      <div class="launch-countdown-grid">
        <div class="countdown-card">
          <span class="countdown-num" id="popupDays">00</span>
          <span class="countdown-label">Days</span>
        </div>
        <span class="countdown-divider">:</span>
        <div class="countdown-card">
          <span class="countdown-num" id="popupHours">00</span>
          <span class="countdown-label">Hours</span>
        </div>
        <span class="countdown-divider">:</span>
        <div class="countdown-card">
          <span class="countdown-num" id="popupMins">00</span>
          <span class="countdown-label">Mins</span>
        </div>
        <span class="countdown-divider">:</span>
        <div class="countdown-card">
          <span class="countdown-num" id="popupSecs">00</span>
          <span class="countdown-label">Secs</span>
        </div>
      </div>
      
      <!-- Early Access Open Beta Callout -->
      <div class="launch-info-box">
        <div class="info-icon">⚡</div>
        <div class="info-text">
          <strong>Can’t wait until 29th October?</strong><br>
          You don’t have to! You can test-drive the full platform on Open Beta right now:
        </div>
      </div>
      
      <!-- Modal Download Actions -->
      <div class="launch-modal-actions">
        <a href="https://play.google.com/store/apps/details?id=com.ziddi.app&hl=en_IN" target="_blank" rel="noopener noreferrer" class="launch-btn btn-android">
          <span>🤖 Android Beta</span>
        </a>
        <a href="https://testflight.apple.com/join/rsDB4vJc" target="_blank" rel="noopener noreferrer" class="launch-btn btn-ios">
          <span>🍏 iOS TestFlight</span>
        </a>
      </div>
      
      <div class="launch-modal-dismiss-wrapper">
        <button class="launch-dismiss-btn" id="dismissLaunchModal">Explore Ziddi Website →</button>
      </div>
    </div>`;
    document.body.appendChild(div);
  }

  function initLaunchModal() {
    ensureLaunchModalHtml();
    const backdrop = document.getElementById('launchModalBackdrop');
    if (!backdrop) return;

    // Auto-open if not already dismissed in this session
    try {
      const isDismissed = sessionStorage.getItem('ziddi_launch_popup_dismissed');
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

    // Allow clicking the top announcement banner text/badge to reopen the countdown modal
    const bannerTrigger = document.querySelector('.top-announcement-banner .banner-content');
    if (bannerTrigger) {
      bannerTrigger.style.cursor = 'pointer';
      bannerTrigger.setAttribute('title', 'Click to view official launch details');
      bannerTrigger.addEventListener('click', function () {
        window.openLaunchModal();
      });
    }
  }

  // Initialize immediately on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLaunchModal();
      updateCountdowns();
      setInterval(updateCountdowns, 1000);
    });
  } else {
    initLaunchModal();
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  }
})();
