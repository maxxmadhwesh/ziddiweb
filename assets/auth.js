/**
 * Ziddi Web Global Authentication & Session Management Module
 * Connects to ziddi-backend (/api/v1/users) and handles Sign In, Sign Up, Google OAuth, and UI state.
 */

const ZIDDI_API_BASE = window.ZIDDI_API_URL || (typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8080" : "https://api.ziddiapp.com");
const GOOGLE_CLIENT_ID = "511364796454-utbr1ciqcjcu1mk6niv3tevje6727qsg.apps.googleusercontent.com";

// Dynamically load Google Identity Services SDK
if (!document.getElementById("googleGsiScript")) {
  const gsiScript = document.createElement("script");
  gsiScript.id = "googleGsiScript";
  gsiScript.src = "https://accounts.google.com/gsi/client";
  gsiScript.async = true;
  gsiScript.defer = true;
  document.head.appendChild(gsiScript);
}

const ZiddiAuth = {
  getUser() {
    try {
      const stored = localStorage.getItem("ziddi_user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getUser();
  },

  saveUser(userData) {
    localStorage.setItem("ziddi_user", JSON.stringify(userData));
    this.updateUI();
  },

  logout() {
    localStorage.removeItem("ziddi_user");
    this.updateUI();
  },

  async login(identifier, password) {
    const response = await fetch(`${ZIDDI_API_BASE}/api/v1/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier.trim(), password: password })
    });

    const result = await response.json();
    if (!response.ok || result.status === "error") {
      throw new Error(result.message || "Invalid credentials");
    }

    const user = result.data || result;
    this.saveUser(user);
    return user;
  },

  async signUp(fullName, username, email, password) {
    const response = await fetch(`${ZIDDI_API_BASE}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim(),
        passwordHash: password,
        authProvider: "manual"
      })
    });

    const result = await response.json();
    if (!response.ok || result.status === "error") {
      throw new Error(result.message || "Sign up failed");
    }

    const user = result.data || result;
    this.saveUser(user);
    return user;
  },

  async syncOAuthUser(provider, profile) {
    const providerId = profile.sub || profile.id;
    const email = profile.email || "";
    const name = profile.name || profile.given_name || email.split("@")[0];
    const picture = profile.picture || null;

    try {
      // 1. Try finding existing OAuth user in backend
      const oauthRes = await fetch(`${ZIDDI_API_BASE}/api/v1/users/oauth?authProvider=${provider}&providerId=${encodeURIComponent(providerId)}`);
      if (oauthRes.ok) {
        const json = await oauthRes.json();
        if (json.status === "success" && json.data) {
          this.saveUser(json.data);
          return json.data;
        }
      }

      // 2. If not found, register new OAuth user in backend
      const createRes = await fetch(`${ZIDDI_API_BASE}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          username: email ? email.split("@")[0] : providerId.substring(0, 8),
          authProvider: provider,
          providerId: providerId,
          profilePictureUrl: picture
        })
      });

      if (createRes.ok) {
        const json = await createRes.json();
        const user = json.data || json;
        this.saveUser(user);
        return user;
      }
    } catch (err) {
      console.warn("Backend offline, saving local OAuth session:", err);
    }

    // Local session fallback if backend is not reachable
    const localUser = {
      id: `${provider}-${providerId}`,
      name: name,
      email: email,
      username: email ? email.split("@")[0] : name,
      profile_picture_url: picture,
      is_premium: true,
      ziddi_coins: 2450,
      auth_provider: provider
    };
    this.saveUser(localUser);
    return localUser;
  },

  loginWithGoogle() {
    if (window.google && google.accounts && google.accounts.oauth2) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await res.json();
              await ZiddiAuth.syncOAuthUser("google", profile);
              ZiddiAuth.closeModal();
            } catch (err) {
              alert("Could not fetch Google profile: " + err.message);
            }
          }
        },
      });
      client.requestAccessToken();
    } else {
      alert("Google Identity Services SDK is still loading. Please try again in 2 seconds.");
    }
  },

  loginWithApple() {
    alert("Apple Sign-In is currently available on the iOS App Store build. Web support is coming soon!");
  },

  /**
   * Calculate exact actual stats for logged in user
   */
  async fetchUserStats(userId) {
    const defaultStats = { totalWorkouts: 0, mindSessions: 0, streakDays: 0 };
    if (!userId || userId.startsWith("google-") || userId.startsWith("apple-")) {
      return defaultStats;
    }

    try {
      // Fetch strength logs, cardio logs, yoga logs, streak
      const [strengthRes, cardioRes, yogaRes, streakRes] = await Promise.all([
        fetch(`${ZIDDI_API_BASE}/api/v1/strength-logs/user/${userId}`),
        fetch(`${ZIDDI_API_BASE}/api/v1/cardio-logs/user/${userId}`),
        fetch(`${ZIDDI_API_BASE}/api/v1/yoga-logs/user/${userId}`),
        fetch(`${ZIDDI_API_BASE}/api/v1/yoga-logs/user/${userId}/streak`)
      ]);

      let strengthCount = 0;
      let cardioCount = 0;
      let yogaCount = 0;
      let streakDays = 0;

      if (strengthRes.ok) {
        const json = await strengthRes.json();
        const logs = json.data || json || [];
        strengthCount = Array.isArray(logs) ? logs.length : 0;
      }
      if (cardioRes.ok) {
        const json = await cardioRes.json();
        const logs = json.data || json || [];
        cardioCount = Array.isArray(logs) ? logs.length : 0;
      }
      if (yogaRes.ok) {
        const json = await yogaRes.json();
        const logs = json.data || json || [];
        yogaCount = Array.isArray(logs) ? logs.length : 0;
      }
      if (streakRes.ok) {
        const json = await streakRes.json();
        if (json.data && json.data.currentStreak != null) {
          streakDays = json.data.currentStreak;
        }
      }

      return {
        totalWorkouts: strengthCount + cardioCount,
        mindSessions: yogaCount,
        streakDays: streakDays
      };
    } catch (e) {
      return defaultStats;
    }
  },

  updateUI() {
    this.renderSidebar();
    if (typeof renderHeroDashboard === "function") {
      renderHeroDashboard();
    }
    if (typeof ZiddAIChat !== "undefined" && typeof ZiddAIChat.checkAccessAndRender === "function") {
      ZiddAIChat.checkAccessAndRender();
    }
  },

  renderSidebar() {
    const sideDrawer = document.getElementById("sideDrawer");
    if (!sideDrawer) return;

    let authBtn = document.getElementById("sidebarAuthBtn");
    if (!authBtn) {
      authBtn = document.createElement("div");
      authBtn.id = "sidebarAuthBtn";
      authBtn.style.marginTop = "auto";
      authBtn.style.paddingTop = "20px";
      authBtn.style.borderTop = "1px solid rgba(255, 255, 255, 0.08)";
      sideDrawer.appendChild(authBtn);
    }

    const user = this.getUser();
    if (user) {
      const displayName = user.name || user.username || user.email || "Athlete";
      authBtn.innerHTML = `
        <div style="font-size: 13px; color: #A78BFA; font-weight: 600; margin-bottom: 8px;">Logged in as ${displayName}</div>
        <button onclick="ZiddiAuth.logout()" class="drawer-login-btn" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5; width: 100%;">
          🚪 Log Out
        </button>
      `;
    } else {
      authBtn.innerHTML = `
        <button onclick="ZiddiAuth.openModal()" class="drawer-login-btn" style="width: 100%;">
          🔑 Sign In / Create Account
        </button>
      `;
    }
  },

  openModal(defaultTab = "signin") {
    let modal = document.getElementById("ziddiAuthModal");
    if (!modal) {
      modal = this.createModalElement();
      document.body.appendChild(modal);
    }
    modal.style.display = "flex";
    this.switchTab(defaultTab);
  },

  closeModal() {
    const modal = document.getElementById("ziddiAuthModal");
    if (modal) modal.style.display = "none";
  },

  switchTab(tab) {
    const signinTab = document.getElementById("tabBtnSignIn");
    const signupTab = document.getElementById("tabBtnSignUp");
    const signinForm = document.getElementById("authFormSignIn");
    const signupForm = document.getElementById("authFormSignUp");
    const errorAlert = document.getElementById("authModalError");

    if (errorAlert) errorAlert.style.display = "none";

    if (tab === "signin") {
      signinTab.style.borderBottom = "2px solid #7C3AED";
      signinTab.style.color = "#FFF";
      signupTab.style.borderBottom = "none";
      signupTab.style.color = "#8F97B3";
      signinForm.style.display = "block";
      signupForm.style.display = "none";
    } else {
      signupTab.style.borderBottom = "2px solid #7C3AED";
      signupTab.style.color = "#FFF";
      signinTab.style.borderBottom = "none";
      signinTab.style.color = "#8F97B3";
      signupForm.style.display = "block";
      signinForm.style.display = "none";
    }
  },

  createModalElement() {
    const modal = document.createElement("div");
    modal.id = "ziddiAuthModal";
    modal.style.cssText = `
      display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
      z-index: 10000; align-items: center; justify-content: center; padding: 20px;
    `;

    modal.innerHTML = `
      <div style="
        background: #12111D; border: 1px solid rgba(157, 107, 255, 0.25);
        border-radius: 20px; width: 100%; max-width: 440px; padding: 32px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6); position: relative; color: #FFF;
        font-family: 'Inter', -apple-system, sans-serif;
      ">
        <button onclick="ZiddiAuth.closeModal()" style="
          position: absolute; top: 16px; right: 16px; background: none; border: none;
          color: #8F97B3; font-size: 24px; cursor: pointer;
        ">&times;</button>

        <div style="text-align: center; margin-bottom: 20px;">
          <img src="assets/z_vector_logo.svg" alt="Ziddi Logo" style="height: 48px; width: auto; margin-bottom: 8px;">
          <h2 style="font-size: 22px; font-weight: 800; margin: 0;">Welcome to Ziddi</h2>
          <p style="font-size: 13px; color: #8F97B3; margin-top: 4px; margin-bottom: 12px;">Train Smarter. Track Better.</p>
          
          <div style="
            background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(157, 107, 255, 0.3);
            border-radius: 12px; padding: 10px 14px; text-align: center; font-size: 13px; font-weight: 600;
            color: #C084FC; line-height: 1.4;
          ">
            🚀 <strong>Ziddi App is launching in August 2026!</strong><br>Sign in or create an account to get early access & reserve your handle.
          </div>
        </div>

        <!-- Error Alert -->
        <div id="authModalError" style="
          display: none; padding: 12px; background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px;
          color: #FCA5A5; font-size: 13px; margin-bottom: 16px; text-align: center;
        "></div>

        <!-- Tab Switcher -->
        <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
          <button id="tabBtnSignIn" onclick="ZiddiAuth.switchTab('signin')" style="
            flex: 1; padding: 10px; background: none; border: none; font-weight: 700;
            cursor: pointer; font-size: 14px; transition: all 0.2s;
          ">Sign In</button>
          <button id="tabBtnSignUp" onclick="ZiddiAuth.switchTab('signup')" style="
            flex: 1; padding: 10px; background: none; border: none; font-weight: 700;
            cursor: pointer; font-size: 14px; transition: all 0.2s;
          ">Create Account</button>
        </div>

        <!-- Sign In Form -->
        <form id="authFormSignIn" onsubmit="ZiddiAuth.handleSignInSubmit(event)">
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; font-weight: 600; color: #A78BFA; display: block; margin-bottom: 6px;">EMAIL OR USERNAME</label>
            <input type="text" id="signInIdentifier" required placeholder="e.g. user@ziddiapp.com or username" style="
              width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px; padding: 12px 14px; color: #FFF; font-size: 14px; outline: none; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 18px;">
            <label style="font-size: 12px; font-weight: 600; color: #A78BFA; display: block; margin-bottom: 6px;">PASSWORD</label>
            <input type="password" id="signInPassword" required placeholder="••••••••" style="
              width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px; padding: 12px 14px; color: #FFF; font-size: 14px; outline: none; box-sizing: border-box;
            ">
          </div>
          <button type="submit" id="btnSubmitSignIn" style="
            width: 100%; background: linear-gradient(135deg, #7C3AED 0%, #9D6BFF 100%);
            color: #FFF; border: none; border-radius: 10px; padding: 14px; font-weight: 700;
            font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
          ">Sign In</button>
        </form>

        <!-- Sign Up Form -->
        <form id="authFormSignUp" onsubmit="ZiddiAuth.handleSignUpSubmit(event)" style="display: none;">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 600; color: #A78BFA; display: block; margin-bottom: 6px;">FULL NAME</label>
            <input type="text" id="signUpName" required placeholder="e.g. Madhwesh Anand" style="
              width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px; padding: 10px 14px; color: #FFF; font-size: 14px; outline: none; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 600; color: #A78BFA; display: block; margin-bottom: 6px;">USERNAME</label>
            <input type="text" id="signUpUsername" required placeholder="e.g. madhwesh" style="
              width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px; padding: 10px 14px; color: #FFF; font-size: 14px; outline: none; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 600; color: #A78BFA; display: block; margin-bottom: 6px;">EMAIL</label>
            <input type="email" id="signUpEmail" required placeholder="e.g. user@ziddiapp.com" style="
              width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px; padding: 10px 14px; color: #FFF; font-size: 14px; outline: none; box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 18px;">
            <label style="font-size: 12px; font-weight: 600; color: #A78BFA; display: block; margin-bottom: 6px;">PASSWORD</label>
            <input type="password" id="signUpPassword" required placeholder="Min 8 characters" style="
              width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
              border-radius: 10px; padding: 10px 14px; color: #FFF; font-size: 14px; outline: none; box-sizing: border-box;
            ">
          </div>
          <button type="submit" id="btnSubmitSignUp" style="
            width: 100%; background: linear-gradient(135deg, #7C3AED 0%, #9D6BFF 100%);
            color: #FFF; border: none; border-radius: 10px; padding: 14px; font-weight: 700;
            font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
          ">Create Account</button>
        </form>

        <!-- Divider -->
        <div style="display: flex; align-items: center; margin: 20px 0; color: #8F97B3; font-size: 12px;">
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
          <span style="padding: 0 10px;">OR</span>
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
        </div>

        <!-- OAuth Buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button onclick="ZiddiAuth.loginWithGoogle()" style="
            width: 100%; background: #1A73E8; color: #FFF; border: none; border-radius: 10px;
            padding: 12px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex;
            align-items: center; justify-content: center; gap: 8px;
          ">
            <span>🔵</span> Continue with Google
          </button>
          <button onclick="ZiddiAuth.loginWithApple()" style="
            width: 100%; background: #000; color: #FFF; border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px; padding: 12px; font-weight: 600; font-size: 14px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          ">
            <span>🍏</span> Continue with Apple
          </button>
        </div>
      </div>
    `;

    return modal;
  },

  async handleSignInSubmit(event) {
    event.preventDefault();
    const errorAlert = document.getElementById("authModalError");
    const submitBtn = document.getElementById("btnSubmitSignIn");
    const identifier = document.getElementById("signInIdentifier").value.trim();
    const password = document.getElementById("signInPassword").value;

    errorAlert.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing In...";

    try {
      await this.login(identifier, password);
      this.closeModal();
    } catch (err) {
      errorAlert.textContent = err.message || "Failed to sign in. Check credentials.";
      errorAlert.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In";
    }
  },

  async handleSignUpSubmit(event) {
    event.preventDefault();
    const errorAlert = document.getElementById("authModalError");
    const submitBtn = document.getElementById("btnSubmitSignUp");
    const name = document.getElementById("signUpName").value.trim();
    const username = document.getElementById("signUpUsername").value.trim();
    const email = document.getElementById("signUpEmail").value.trim();
    const password = document.getElementById("signUpPassword").value;

    if (password.length < 8) {
      errorAlert.textContent = "Password must be at least 8 characters.";
      errorAlert.style.display = "block";
      return;
    }

    errorAlert.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Account...";

    try {
      await this.signUp(name, username, email, password);
      this.closeModal();
    } catch (err) {
      errorAlert.textContent = err.message || "Failed to create account.";
      errorAlert.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
    }
  }
};

// Initialize UI on load
document.addEventListener("DOMContentLoaded", () => {
  ZiddiAuth.updateUI();
});
