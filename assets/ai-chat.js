/**
 * Zidd AI Web Chat Stream Engine
 * Real-time SSE communication with Ziddi Backend (/api/v1/ai/chat/stream)
 */

const ZiddAIChat = {
  messages: [],
  isGenerating: false,
  sessionId: null,
  xhr: null,

  init() {
    this.sessionId = "web_session_" + Date.now();
    this.checkAccessAndRender();
  },

  checkAccessAndRender() {
    const user = ZiddiAuth.getUser();
    const chatContainer = document.getElementById("chatMainContainer");
    const hudContainer = document.getElementById("athleteContextHud");

    if (!user) {
      this.renderUnauthenticatedState(chatContainer);
      if (hudContainer) hudContainer.style.display = "none";
      return;
    }

    const isPremium = user.is_premium || user.isPremium;
    if (!isPremium) {
      this.renderNonPremiumState(chatContainer, user);
      if (hudContainer) hudContainer.style.display = "none";
      return;
    }

    if (hudContainer) {
      hudContainer.style.display = "flex";
      this.renderAthleteHud(hudContainer, user);
    }

    this.renderChatInterface(chatContainer, user);
  },

  async renderAthleteHud(container, user) {
    const name = user.first_name || user.name || user.username || "Athlete";
    const coins = user.ziddi_coins ?? user.ziddiCoins ?? 0;
    const streak = user.login_streak ?? user.longest_streak ?? 0;

    let stats = { totalWorkouts: 0 };
    try {
      if (typeof ZiddiAuth.fetchUserStats === "function") {
        stats = await ZiddiAuth.fetchUserStats(user.id);
      }
    } catch (e) {}

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 900px; margin: 0 auto; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 19px; background: linear-gradient(135deg, #9B5CFF, #7C3AED); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: #FFF;">
            ${name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 6px;">
              <span>${name}</span>
              <span style="background: #F59E0B; color: #000; font-size: 9px; font-weight: 900; padding: 1px 6px; border-radius: 6px;">👑 PRO</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8;">Live Context Connected</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 10px;">
            <span style="font-size: 14px;">🔥</span>
            <span style="font-size: 12.5px; font-weight: 700; color: #FF9F43;">${streak} Day Streak</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 10px;">
            <img src="/assets/ziddi_coin.png" alt="Coins" style="width: 16px; height: 16px;">
            <span style="font-size: 12.5px; font-weight: 700; color: #F59E0B;">${coins.toLocaleString()}</span>
          </div>
          <button onclick="ZiddAIChat.clearChat()" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #94A3B8; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;">
            🔄 New Session
          </button>
        </div>
      </div>
    `;
  },

  renderUnauthenticatedState(container) {
    container.innerHTML = `
      <div style="text-align: center; max-width: 480px; margin: 80px auto; padding: 40px 24px; background: rgba(18, 18, 24, 0.85); border: 1px solid rgba(155, 92, 255, 0.25); border-radius: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.7);">
        <div style="position: relative; width: 80px; height: 80px; margin: 0 auto 20px auto; background: rgba(155, 92, 255, 0.15); border-radius: 40px; display: flex; align-items: center; justify-content: center;">
          <img src="/assets/Zid_ai_transparent.png" alt="Zidd AI" style="width: 64px; height: 64px; object-fit: contain;">
          <span style="position: absolute; bottom: 4px; right: 4px; font-size: 20px;">🔒</span>
        </div>
        <h2 style="font-size: 26px; font-weight: 900; color: #FFF; margin-bottom: 8px;">Sign In to Access Zidd AI</h2>
        <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; margin-bottom: 28px;">
          Zidd AI uses your real-time workout logs, injury history, and target exam benchmarks to give personalized coaching. Please sign in to link your context.
        </p>
        <button onclick="ZiddiAuth.openModal()" style="
          width: 100%; background: linear-gradient(135deg, #9B5CFF, #7C3AED); border: none; border-radius: 14px;
          padding: 16px; color: #FFF; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4);
        ">Sign In with Ziddi Account</button>
        <div style="margin-top: 18px;">
          <a href="index.html" style="color: #94A3B8; font-size: 13px; text-decoration: none;">← Back to Home</a>
        </div>
      </div>
    `;
  },

  renderNonPremiumState(container, user) {
    const name = user.first_name || user.name || user.username || "Athlete";
    container.innerHTML = `
      <div style="text-align: center; max-width: 520px; margin: 70px auto; padding: 40px 28px; background: rgba(18, 18, 24, 0.85); border: 1.5px solid rgba(155, 92, 255, 0.35); border-radius: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.7);">
        <div style="position: relative; width: 84px; height: 84px; margin: 0 auto 20px auto; background: rgba(155, 92, 255, 0.2); border-radius: 42px; display: flex; align-items: center; justify-content: center;">
          <img src="/assets/Zid_ai_transparent.png" alt="Zidd AI" style="width: 68px; height: 68px; object-fit: contain;">
          <span style="position: absolute; bottom: 0; right: 0; background: #F59E0B; border: 2px solid #120824; border-radius: 10px; padding: 2px 6px; font-size: 10px; font-weight: 900; color: #000;">👑 PRO</span>
        </div>
        <h2 style="font-size: 26px; font-weight: 900; color: #FFF; margin-bottom: 8px;">Upgrade to Unlock Zidd AI</h2>
        <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin-bottom: 24px;">
          Hey <strong>${name}</strong>! Zidd AI is an exclusive feature for Ziddi Premium athletes. Upgrade today to unlock 24/7 personalized coaching, real-time PR calculations, and injury-safe exercise alternatives.
        </p>
        <button onclick="ZiddiSubscriptionModal.open('premium')" style="
          width: 100%; background: linear-gradient(135deg, #9B5CFF, #7C3AED); border: none; border-radius: 16px;
          padding: 16px; color: #FFF; font-size: 15.5px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.45);
          margin-bottom: 14px;
        ">View Premium Plans (From ₹49)</button>
        <div>
          <a href="index.html" style="color: #94A3B8; font-size: 13px; text-decoration: none;">← Back to Home</a>
        </div>
      </div>
    `;
  },

  renderChatInterface(container, user) {
    const name = user.first_name || user.name || user.username || "Athlete";

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%; max-width: 900px; margin: 0 auto; width: 100%;">
        <!-- Messages Scroll Box -->
        <div id="chatMessagesList" style="
          flex: 1; overflow-y: auto; padding: 20px 12px; display: flex; flex-direction: column; gap: 16px;
          scroll-behavior: smooth;
        ">
          <!-- Welcome Greeting Card -->
          <div style="
            background: linear-gradient(135deg, rgba(155, 92, 255, 0.12), rgba(18, 18, 24, 0.8));
            border: 1px solid rgba(155, 92, 255, 0.25); border-radius: 20px; padding: 20px;
            display: flex; gap: 14px; align-items: flex-start;
          ">
            <img src="/assets/Zid_ai_transparent.png" alt="Zidd AI" style="width: 44px; height: 44px; object-fit: contain;">
            <div style="flex: 1;">
              <div style="font-size: 15px; font-weight: 800; color: #FFF; margin-bottom: 4px;">
                Welcome back, ${name}! 👋 I'm Zidd AI.
              </div>
              <p style="font-size: 13px; color: #C4B5FD; line-height: 1.5; margin: 0 0 12px 0;">
                I have full live context of your workout logs, PR progression, joint injury status, and target goals. How can I assist your training today?
              </p>
              
              <!-- Suggested Prompt Chips -->
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button onclick="ZiddAIChat.sendQuickPrompt('What are my current PRs across all lifts?')" style="
                  background: rgba(255,255,255,0.06); border: 1px solid rgba(155,92,255,0.3); border-radius: 12px;
                  color: #E2E8F0; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;
                ">🏆 Check My PRs</button>
                <button onclick="ZiddAIChat.sendQuickPrompt('Suggest an injury-safe chest exercise swap')" style="
                  background: rgba(255,255,255,0.06); border: 1px solid rgba(155,92,255,0.3); border-radius: 12px;
                  color: #E2E8F0; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;
                ">🩺 Safe Exercise Swap</button>
                <button onclick="ZiddAIChat.sendQuickPrompt('How should I pace my 1.6km run to beat the physical cutoff?')" style="
                  background: rgba(255,255,255,0.06); border: 1px solid rgba(155,92,255,0.3); border-radius: 12px;
                  color: #E2E8F0; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;
                ">🎯 1.6km Run Pacing</button>
                <button onclick="ZiddAIChat.sendQuickPrompt('What should my daily calorie and protein targets be?')" style="
                  background: rgba(255,255,255,0.06); border: 1px solid rgba(155,92,255,0.3); border-radius: 12px;
                  color: #E2E8F0; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: left;
                ">🥑 Nutrition & Macros</button>
              </div>
            </div>
          </div>

          <!-- Existing Dynamic Messages -->
          <div id="dynamicMessagesArea" style="display: flex; flex-direction: column; gap: 16px;"></div>
        </div>

        <!-- Input Bar -->
        <div style="padding: 16px 8px 24px 8px; border-top: 1px solid rgba(255,255,255,0.08); background: #0A0A0C;">
          <form id="chatInputForm" onsubmit="ZiddAIChat.handleFormSubmit(event)" style="display: flex; gap: 10px; align-items: center;">
            <input id="chatTextInput" type="text" placeholder="Ask Zidd AI anything about training, PRs, injuries, or nutrition..." autocomplete="off" style="
              flex: 1; background: #181820; border: 1.5px solid rgba(155, 92, 255, 0.3); border-radius: 16px;
              padding: 14px 18px; font-size: 14px; color: #FFF; outline: none; transition: border-color 0.2s;
            ">
            <button id="chatSendBtn" type="submit" style="
              background: linear-gradient(135deg, #9B5CFF, #7C3AED); border: none; border-radius: 16px;
              padding: 14px 22px; color: #FFF; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px;
              box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
            ">
              <span>Send</span> <span>🚀</span>
            </button>
          </form>
        </div>
      </div>
    `;

    this.renderMessages();
  },

  sendQuickPrompt(promptText) {
    const input = document.getElementById("chatTextInput");
    if (input) input.value = promptText;
    this.handleFormSubmit(new Event("submit"));
  },

  handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById("chatTextInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text || this.isGenerating) return;

    input.value = "";
    this.sendMessage(text);
  },

  sanitizeOutput(text) {
    if (!text) return "";
    return text
      .replace(/<\|eot_id\|>/gi, "")
      .replace(/<\|start_header_id\|>/gi, "")
      .replace(/<\|end_header_id\|>/gi, "")
      .replace(/<\|user\|>/gi, "")
      .replace(/<\|assistant\|>/gi, "")
      .replace(/<\|system\|>/gi, "")
      .replace(/<s>/gi, "")
      .replace(/<\/s>/gi, "")
      .replace(/\[\/INST\]/gi, "")
      .replace(/\[INST\]/gi, "");
  },

  formatMarkdown(raw) {
    const text = this.sanitizeOutput(raw);
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 style="font-size: 15px; font-weight: 800; color: #C4B5FD; margin: 10px 0 4px 0;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="font-size: 16px; font-weight: 900; color: #FFF; margin: 12px 0 6px 0;">$1</h3>');

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #FFF; font-weight: 700;">$1</strong>');

    // Inline code / exercises
    html = html.replace(/`(.*?)`/gim, '<code style="background: rgba(155,92,255,0.2); color: #C4B5FD; padding: 2px 6px; border-radius: 6px; font-size: 12px;">$1</code>');

    // Bullet points
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<div style="display: flex; gap: 8px; margin: 4px 0;"><span style="color: #9B5CFF;">•</span><span>$1</span></div>');

    // Numbered lists
    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div style="display: flex; gap: 8px; margin: 4px 0;"><strong style="color: #9B5CFF;">$1.</strong><span>$2</span></div>');

    // Line breaks
    html = html.replace(/\n/g, "<br>");

    return html;
  },

  renderMessages() {
    const area = document.getElementById("dynamicMessagesArea");
    if (!area) return;

    area.innerHTML = this.messages.map((msg) => {
      const isAi = msg.sender === "ai";
      return `
        <div style="display: flex; gap: 12px; align-items: flex-start; justify-content: ${isAi ? 'flex-start' : 'flex-end'};">
          ${isAi ? `
            <div style="width: 36px; height: 36px; border-radius: 18px; background: rgba(155, 92, 255, 0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <img src="/assets/Zid_ai_transparent.png" alt="Zidd AI" style="width: 30px; height: 30px; object-fit: contain;">
            </div>
          ` : ''}

          <div style="
            max-width: 80%; padding: 14px 18px; border-radius: 20px; font-size: 13.5px; line-height: 1.6;
            ${isAi 
              ? 'background: #161620; border: 1px solid rgba(255,255,255,0.08); color: #E2E8F0; border-top-left-radius: 4px;' 
              : 'background: linear-gradient(135deg, #7C3AED, #6D28D9); color: #FFF; border-top-right-radius: 4px; box-shadow: 0 4px 15px rgba(124,58,237,0.3);'}
          ">
            ${isAi ? this.formatMarkdown(msg.text) : msg.text}
            ${msg.isStreaming ? '<span style="display: inline-block; width: 6px; height: 14px; background: #9B5CFF; margin-left: 4px; vertical-align: middle; animation: blink 1s infinite;"></span>' : ''}
          </div>

          ${!isAi ? `
            <div style="width: 36px; height: 36px; border-radius: 18px; background: linear-gradient(135deg, #9B5CFF, #7C3AED); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #FFF; flex-shrink: 0;">
              👤
            </div>
          ` : ''}
        </div>
      `;
    }).join("");

    const scrollBox = document.getElementById("chatMessagesList");
    if (scrollBox) {
      scrollBox.scrollTop = scrollBox.scrollHeight;
    }
  },

  async sendMessage(promptText) {
    const user = ZiddiAuth.getUser();
    if (!user) return;

    this.messages.push({
      sender: "user",
      text: promptText,
    });

    const aiMsgIndex = this.messages.length;
    this.messages.push({
      sender: "ai",
      text: "",
      isStreaming: true,
    });

    this.isGenerating = true;
    this.renderMessages();

    let accumulatedText = "";
    let processedIndex = 0;

    const xhr = new XMLHttpRequest();
    this.xhr = xhr;

    const endpoint = `${ZIDDI_API_BASE}/api/v1/ai/chat/stream?userId=${encodeURIComponent(user.id)}`;
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/event-stream, application/json, text/plain");

    xhr.onprogress = () => {
      const fullResponse = xhr.responseText;
      const newContent = fullResponse.substring(processedIndex);
      processedIndex = fullResponse.length;

      const lines = newContent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const payload = trimmed.substring(5).trim();
          if (payload === "[DONE]") {
            continue;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.chunk) accumulatedText += parsed.chunk;
            else if (parsed.content) accumulatedText += parsed.content;
            else if (parsed.text) accumulatedText += parsed.text;
          } catch (e) {
            accumulatedText += payload;
          }
        } else if (trimmed && !trimmed.startsWith("event:") && !trimmed.startsWith("id:")) {
          accumulatedText += trimmed;
        }
      }

      this.messages[aiMsgIndex].text = accumulatedText;
      this.renderMessages();
    };

    xhr.onload = () => {
      this.isGenerating = false;
      this.messages[aiMsgIndex].isStreaming = false;
      if (!this.messages[aiMsgIndex].text) {
        this.messages[aiMsgIndex].text = "I've reviewed your training data. How else can I help optimize your next session?";
      }
      this.renderMessages();
    };

    xhr.onerror = () => {
      this.isGenerating = false;
      this.messages[aiMsgIndex].isStreaming = false;
      this.messages[aiMsgIndex].text = "⚠️ Network connection issue. Please make sure the Ziddi backend is running and try again.";
      this.renderMessages();
    };

    xhr.send(JSON.stringify({
      message: promptText,
      sessionId: this.sessionId,
    }));
  },

  clearChat() {
    this.messages = [];
    this.sessionId = "web_session_" + Date.now();
    this.renderMessages();
  },
};

window.ZiddAIChat = ZiddAIChat;
