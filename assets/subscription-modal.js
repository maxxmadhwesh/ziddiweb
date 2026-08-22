/**
 * Ziddi Web Subscription Modal Module
 * Replicates the mobile app SubscriptionModal design for Ziddi Web.
 * Highlights Zidd AI as the primary value proposition with exact pricing tiers.
 */

const ZiddiSubscriptionModal = {
  activeTab: "premium", // "premium" | "exams" | "bundle"
  selectedPlan: "premium_monthly",
  selectedExamPlan: "exams_base",
  selectedBundlePlan: "bundle_monthly",
  couponResult: null,

  plans: {
    premium: [
      { id: "premium_trial", label: "5-Day Trial", price: 49, display: "₹49", billedNote: "5 Days Full Access", badge: "TRIAL" },
      { id: "premium_monthly", label: "1 Month", price: 349, display: "₹349", billedNote: "Standard monthly plan", badge: null },
      { id: "premium_6month", label: "6 Months", price: 1799, display: "₹1,799", billedNote: "₹300/mo · Save 14%", badge: "POPULAR" },
      { id: "premium_annual", label: "1 Year", price: 3499, display: "₹3,499", billedNote: "₹292/mo · Save 16%", badge: "BEST VALUE" },
    ],
    exams: [
      { id: "exams_base", label: "Base Plan", price: 299, display: "₹299 / 2 months", desc: "Access to 1 Target milestone (60 Days)", badge: "STARTUP SPECIAL" },
      { id: "exams_addon", label: "+ 1 Extra Target", price: 149, display: "₹149 / target", desc: "Add one more target milestone", badge: null },
    ],
    bundle: [
      { id: "bundle_monthly", label: "Monthly", price: 499, display: "₹499 / month", billedNote: "All-in-one monthly", badge: null },
      { id: "bundle_6month", label: "6 Months", price: 2699, display: "₹2,699", billedNote: "₹450/mo · Save 10%", badge: "POPULAR" },
      { id: "bundle_annual", label: "Annual", price: 4999, display: "₹4,999", billedNote: "₹417/mo · Save 17%", badge: "BEST VALUE" },
    ],
  },

  open(defaultTab = "premium") {
    this.activeTab = defaultTab;
    this.couponResult = null;
    this.render();
    const modal = document.getElementById("ziddiSubscriptionModal");
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  },

  close() {
    const modal = document.getElementById("ziddiSubscriptionModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    this.couponResult = null;
    this.render();
  },

  selectPlan(planId) {
    if (this.activeTab === "premium") this.selectedPlan = planId;
    else if (this.activeTab === "exams") this.selectedExamPlan = planId;
    else if (this.activeTab === "bundle") this.selectedBundlePlan = planId;
    this.couponResult = null;
    this.render();
  },

  getActivePlan() {
    if (this.activeTab === "premium") {
      return this.plans.premium.find((p) => p.id === this.selectedPlan) || this.plans.premium[1];
    } else if (this.activeTab === "exams") {
      return this.plans.exams.find((p) => p.id === this.selectedExamPlan) || this.plans.exams[0];
    } else {
      return this.plans.bundle.find((p) => p.id === this.selectedBundlePlan) || this.plans.bundle[0];
    }
  },

  async applyCoupon() {
    const input = document.getElementById("subCouponInput");
    const code = input ? input.value.trim().toUpperCase() : "";
    if (!code) return;

    const user = ZiddiAuth.getUser();
    if (!user) {
      alert("Please sign in first to apply coupons.");
      return;
    }

    const plan = this.getActivePlan();
    const btn = document.getElementById("subCouponApplyBtn");
    if (btn) btn.innerText = "...";

    try {
      const context = this.activeTab === "premium" ? "gym_subscription" : this.activeTab === "bundle" ? "bundle_subscription" : "exam_subscription";
      const res = await fetch(`${ZIDDI_API_BASE}/api/v1/coupons/validate?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, context, original_amount_inr: plan.price }),
      });
      const json = await res.json();
      if (json && json.data && json.data.valid) {
        this.couponResult = {
          valid: true,
          message: json.data.message || "Coupon applied!",
          finalAmountInr: json.data.final_amount_inr ?? json.data.finalAmountInr ?? plan.price,
        };
      } else {
        this.couponResult = {
          valid: false,
          message: json?.message || "Invalid coupon code",
          finalAmountInr: plan.price,
        };
      }
    } catch (e) {
      this.couponResult = {
        valid: false,
        message: "Failed to validate coupon.",
        finalAmountInr: plan.price,
      };
    }
    this.render();
  },

  clearCoupon() {
    this.couponResult = null;
    this.render();
  },

  handleCheckout() {
    const user = ZiddiAuth.getUser();
    if (!user) {
      this.close();
      if (typeof ZiddiAuth !== "undefined") {
        ZiddiAuth.openModal();
      }
      return;
    }

    const plan = this.getActivePlan();
    const finalPrice = this.couponResult && this.couponResult.valid ? this.couponResult.finalAmountInr : plan.price;

    alert(`🎉 Upgrading to ${plan.label} (₹${finalPrice})!

Ziddi payments are being processed via Razorpay. For beta testing, please use the Ziddi mobile app or contact support.`);
  },

  render() {
    let modal = document.getElementById("ziddiSubscriptionModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ziddiSubscriptionModal";
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(14px);
        display: none; align-items: center; justify-content: center;
        z-index: 10000; padding: 20px; box-sizing: border-box;
      `;
      document.body.appendChild(modal);
    }

    const plan = this.getActivePlan();
    const finalPrice = this.couponResult && this.couponResult.valid ? this.couponResult.finalAmountInr : plan.price;
    const accentColor = this.activeTab === "exams" ? "#EA580C" : this.activeTab === "bundle" ? "#F59E0B" : "#9B5CFF";

    const premiumFeatures = [
      { icon: "🤖", text: "<strong>Unlimited Zidd AI Coach</strong> (Live PR & volume context)", hl: true },
      { icon: "🩹", text: "<strong>Physical Recovery</strong> — doctor-recommended injury rehab", hl: true },
      { icon: "📈", text: "Progress charts, volume loads & 1RM PR tracking" },
      { icon: "🗓️", text: "Personal weekly workout planner & split customizer" },
      { icon: "🏅", text: "Rank & milestone badges with store discount perks" },
      { icon: "🧘", text: "Mind Premium — meditation timer & yoga flow logs" },
      { icon: "📚", text: "Improvement guides with form cues & video tips" },
    ];

    const examFeatures = [
      { icon: "🤖", text: "<strong>Zidd AI Exam Pacing Coach</strong> & cutoff benchmarks", hl: true },
      { icon: "🎯", text: "<strong>Interactive 3D Target Exam Hub</strong> & real-time testing" },
      { icon: "📋", text: "Exam-specific prep plans (SSC GD, NDA, CDS, Police…)" },
      { icon: "📊", text: "Physical test cutoff analytics & run pacing charts" },
      { icon: "➕", text: "Add extra exam targets at ₹149 anytime" },
    ];

    const bundleFeatures = [
      { icon: "🤖", text: "<strong>Unrestricted Zidd AI</strong> across Gym, Mind & Exams", hl: true },
      { icon: "👑", text: "<strong>Everything in Gym + Mind Premium</strong> (All charts & tools)" },
      { icon: "🎯", text: "Exam Target Access with 2 milestones included" },
      { icon: "🧘", text: "Full Mind meditation timer & yoga logs included" },
      { icon: "⚡", text: "Single subscription for complete app freedom" },
    ];

    const currentFeatures = this.activeTab === "exams" ? examFeatures : this.activeTab === "bundle" ? bundleFeatures : premiumFeatures;
    const currentPlans = this.activeTab === "exams" ? this.plans.exams : this.activeTab === "bundle" ? this.plans.bundle : this.plans.premium;
    const selectedId = this.activeTab === "exams" ? this.selectedExamPlan : this.activeTab === "bundle" ? this.selectedBundlePlan : this.selectedPlan;

    modal.innerHTML = `
      <div style="
        background: #121216; border: 1px solid rgba(155, 92, 255, 0.25);
        border-radius: 28px; width: 100%; max-width: 600px; max-height: 90vh;
        overflow-y: auto; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(124, 58, 237, 0.2);
        color: #FFF; position: relative; padding: 28px 24px; box-sizing: border-box;
      ">
        <!-- Close Button -->
        <button onclick="ZiddiSubscriptionModal.close()" style="
          position: absolute; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.08);
          border: none; border-radius: 50%; width: 34px; height: 34px; color: #94A3B8;
          font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        ">✕</button>

        <!-- Header -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
          <h2 style="font-size: 22px; font-weight: 900; margin: 0; color: #FFF;">Upgrade Your Training</h2>
          <span style="background: ${accentColor}25; border: 1px solid ${accentColor}; color: ${accentColor}; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">PRO</span>
        </div>
        <p style="font-size: 13px; color: #94A3B8; margin: 0 0 18px 0;">Full digital coach, injury rehab & structured progress.</p>

        <!-- Tab Selector -->
        <div style="display: flex; background: #1C1C24; padding: 4px; border-radius: 14px; margin-bottom: 20px; gap: 4px;">
          <button onclick="ZiddiSubscriptionModal.switchTab('premium')" style="
            flex: 1; padding: 10px 8px; border: none; border-radius: 10px;
            background: ${this.activeTab === 'premium' ? '#2A2A36' : 'transparent'};
            color: ${this.activeTab === 'premium' ? '#FFF' : '#94A3B8'};
            font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
            box-shadow: ${this.activeTab === 'premium' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'};
          ">👑 Gym + Mind</button>
          <button onclick="ZiddiSubscriptionModal.switchTab('exams')" style="
            flex: 1; padding: 10px 8px; border: none; border-radius: 10px;
            background: ${this.activeTab === 'exams' ? '#2A2A36' : 'transparent'};
            color: ${this.activeTab === 'exams' ? '#FFF' : '#94A3B8'};
            font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
            box-shadow: ${this.activeTab === 'exams' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'};
          ">🎯 Target Exams</button>
          <button onclick="ZiddiSubscriptionModal.switchTab('bundle')" style="
            flex: 1; padding: 10px 8px; border: none; border-radius: 10px;
            background: ${this.activeTab === 'bundle' ? '#2A2A36' : 'transparent'};
            color: ${this.activeTab === 'bundle' ? '#FFF' : '#94A3B8'};
            font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
            box-shadow: ${this.activeTab === 'bundle' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'};
          ">⚡ Bundle</button>
        </div>

        <!-- Zidd AI Spotlight Hero Card -->
        <div style="
          background: linear-gradient(135deg, rgba(155, 92, 255, 0.15), rgba(18, 8, 36, 0.9));
          border: 1.5px solid rgba(155, 92, 255, 0.35); border-radius: 20px; padding: 16px; margin-bottom: 20px;
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="position: relative; width: 44px; height: 44px; border-radius: 22px; background: rgba(155,92,255,0.2); display: flex; align-items: center; justify-content: center;">
              <img src="/assets/Zid_ai_transparent.png" alt="Zidd AI" style="width: 38px; height: 38px; object-fit: contain;">
              <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 5px; background: #10B981; border: 2px solid #120824;"></span>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px; font-weight: 900; color: #FFF;">Zidd AI</span>
                <span style="background: ${accentColor}25; border: 1px solid ${accentColor}; color: ${accentColor}; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 6px; text-transform: uppercase;">24/7 Digital Coach</span>
              </div>
              <p style="font-size: 11.5px; color: #C4B5FD; margin: 2px 0 0 0;">Powered by live context of your PRs, injuries & exam targets</p>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; font-size: 12px; color: #E2E8F0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>⚡</span> <span><strong style="color: ${accentColor};">Live PR Context:</strong> Instant volume advice & 1RM overload cues</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>🩺</span> <span><strong style="color: ${accentColor};">Injury-Safe AI:</strong> Checks injury history before recommending movements</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>🎯</span> <span><strong style="color: ${accentColor};">Target Pacing:</strong> Decomposes physical cutoffs into daily actionable milestones</span>
            </div>
          </div>
        </div>

        <!-- Features List -->
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #94A3B8; text-transform: uppercase; margin-bottom: 10px;">WHAT'S INCLUDED</div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
          ${currentFeatures.map(f => `
            <div style="
              display: flex; align-items: center; gap: 10px; padding: 8px 12px;
              background: ${f.hl ? accentColor + '12' : 'rgba(255,255,255,0.02)'};
              border: 1px solid ${f.hl ? accentColor + '35' : 'rgba(255,255,255,0.05)'};
              border-radius: 12px; font-size: 13px; color: #F1F5F9;
            ">
              <span style="font-size: 16px;">${f.icon}</span>
              <span style="flex: 1;">${f.text}</span>
              <span style="color: ${accentColor}; font-weight: 900;">✓</span>
            </div>
          `).join('')}
        </div>

        <!-- Pricing Cards -->
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #94A3B8; text-transform: uppercase; margin-bottom: 10px;">CHOOSE PLAN</div>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
          ${currentPlans.map(p => {
            const isSel = selectedId === p.id;
            return `
              <div onclick="ZiddiSubscriptionModal.selectPlan('${p.id}')" style="
                display: flex; align-items: center; justify-content: space-between; padding: 14px 16px;
                background: ${isSel ? accentColor + '18' : '#181820'};
                border: 1.5px solid ${isSel ? accentColor : 'rgba(255,255,255,0.08)'};
                border-radius: 16px; cursor: pointer; transition: all 0.2s;
              ">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="
                    width: 18px; height: 18px; border-radius: 9px; border: 2px solid ${isSel ? accentColor : '#64748B'};
                    display: flex; align-items: center; justify-content: center;
                  ">
                    ${isSel ? `<div style="width: 8px; height: 8px; border-radius: 4px; background: ${accentColor};"></div>` : ''}
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 14.5px; font-weight: 700; color: #FFF;">${p.label}</span>
                      ${p.badge ? `<span style="background: linear-gradient(135deg, #9B5CFF, #7C3AED); color: #FFF; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 6px;">${p.badge}</span>` : ''}
                    </div>
                    ${p.billedNote ? `<div style="font-size: 11.5px; color: ${isSel ? accentColor : '#94A3B8'}; margin-top: 2px;">${p.billedNote}</div>` : ''}
                    ${p.desc ? `<div style="font-size: 11.5px; color: #94A3B8; margin-top: 2px;">${p.desc}</div>` : ''}
                  </div>
                </div>
                <div style="font-size: 15px; font-weight: 900; color: ${isSel ? accentColor : '#FFF'};">${p.display}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Coupon Input -->
        <div style="display: flex; gap: 8px; margin-bottom: ${this.couponResult ? '8px' : '20px'};">
          <input id="subCouponInput" type="text" placeholder="Coupon / Referral Code" style="
            flex: 1; background: #1C1C24; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
            padding: 12px 14px; color: #FFF; font-size: 13px; outline: none; text-transform: uppercase;
          ">
          ${this.couponResult ? `
            <button onclick="ZiddiSubscriptionModal.clearCoupon()" style="
              background: #475569; border: none; border-radius: 12px; color: #FFF; font-weight: 700;
              padding: 0 16px; cursor: pointer; font-size: 12px;
            ">Clear</button>
          ` : `
            <button id="subCouponApplyBtn" onclick="ZiddiSubscriptionModal.applyCoupon()" style="
              background: ${accentColor}; border: none; border-radius: 12px; color: #FFF; font-weight: 800;
              padding: 0 18px; cursor: pointer; font-size: 13px;
            ">Apply</button>
          `}
        </div>
        ${this.couponResult ? `
          <div style="font-size: 12px; font-weight: 700; color: ${this.couponResult.valid ? '#10B981' : '#EF4444'}; margin-bottom: 18px; padding-left: 4px;">
            ${this.couponResult.valid ? `✓ ${this.couponResult.message} → ₹${this.couponResult.finalAmountInr}` : `✗ ${this.couponResult.message}`}
          </div>
        ` : ''}

        <!-- CTA Purchase Button -->
        <button onclick="ZiddiSubscriptionModal.handleCheckout()" style="
          width: 100%; background: linear-gradient(135deg, ${accentColor}, #7C3AED); border: none;
          border-radius: 16px; padding: 16px; color: #FFF; font-size: 16px; font-weight: 900;
          letter-spacing: 0.3px; cursor: pointer; box-shadow: 0 8px 25px ${accentColor}40;
          transition: all 0.2s; margin-bottom: 10px;
        ">Unlock Access · ₹${finalPrice.toLocaleString('en-IN')}</button>

        <p style="text-align: center; font-size: 11px; color: #64748B; margin: 0;">
          🔒 Secure checkout via Razorpay • Cancel anytime • Instant access
        </p>
      </div>
    `;
  },
};

window.ZiddiSubscriptionModal = ZiddiSubscriptionModal;
