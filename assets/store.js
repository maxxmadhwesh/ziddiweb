/**
 * Ziddi Web Store Module
 * Handles Catalog, Cart, Wishlist, Address Selection, Ziddi Coins Discount, and Razorpay Payments.
 */

const ZiddiStore = {
  cart: JSON.parse(localStorage.getItem("ziddi_cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("ziddi_wishlist") || "[]"),
  items: [],
  addresses: [],
  selectedAddress: null,
  useCoins: false,

  init() {
    this.fetchItems();
    this.updateCartCount();
    this.updateWishlistCount();

    const user = ZiddiAuth.getUser();
    if (user) {
      const coins = user.ziddi_coins ?? user.ziddiCoins ?? 0;
      const coinsTxt = document.getElementById("storeUserCoinsTxt");
      if (coinsTxt) coinsTxt.textContent = `${coins.toLocaleString()} Coins`;
      if (user.id) this.fetchAddresses(user.id);
    }
  },

  // ── Pink Circular Radial Burst Transition Launcher ──────────────────────────
  launchStoreBurst(e) {
    if (e && e.preventDefault) e.preventDefault();

    const clickX = e ? e.clientX || window.innerWidth / 2 : window.innerWidth / 2;
    const clickY = e ? e.clientY || window.innerHeight / 2 : window.innerHeight / 2;

    let overlay = document.getElementById("pinkStoreBurstOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "pinkStoreBurstOverlay";
      document.body.appendChild(overlay);
    }

    overlay.style.setProperty("--burst-x", `${clickX}px`);
    overlay.style.setProperty("--burst-y", `${clickY}px`);
    
    // Force reflow then trigger transition
    void overlay.offsetWidth;
    overlay.classList.add("active");

    setTimeout(() => {
      window.location.href = "store.html";
    }, 500);
  },

  // ── Fetch Store Items ────────────────────────────────────────────────────────
  async fetchItems() {
    try {
      const res = await fetch(`${ZIDDI_API_BASE}/api/v1/store/items`);
      if (res.ok) {
        const json = await res.json();
        this.items = json.data || json || [];
        this.renderCatalog("all");
      }
    } catch (e) {
      console.warn("Could not fetch live store items:", e);
      // Fallback catalog if backend is loading
      this.items = [
        { id: 1, name: "Ziddi Pro Lifting Straps", category: "accessories", price_inr: 499, original_price_inr: 799, coin_discount_pct: 10, coins_required: 25, description: "Heavy duty padded cotton straps for heavy deadlifts.", image_url: null, is_available: true },
        { id: 2, name: "Ziddi Performance Tee", category: "apparel", price_inr: 999, original_price_inr: 1499, coin_discount_pct: 15, coins_required: 25, description: "Sweat-wicking athletic fit shirt with 3D reflection.", image_url: null, is_available: true },
        { id: 3, name: "Ziddi Whey Isolate (1kg)", category: "supplements", price_inr: 2499, original_price_inr: 3299, coin_discount_pct: 20, coins_required: 25, description: "Pure ultra-filtered whey isolate with digestive enzymes.", image_url: null, is_available: true },
        { id: 4, name: "Ziddi Tactical Duffle Bag", category: "gear", price_inr: 1799, original_price_inr: 2499, coin_discount_pct: 15, coins_required: 25, description: "Water-resistant gym bag with shoe compartment.", image_url: null, is_available: true }
      ];
      this.renderCatalog("all");
    }
  },

  // ── Render Store Catalog ────────────────────────────────────────────────────
  renderCatalog(category = "all") {
    const grid = document.getElementById("storeGrid");
    if (!grid) return;

    const filtered = category === "all" ? this.items : this.items.filter(i => i.category === category);
    
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #8F97B3;">
          <div style="font-size: 48px; margin-bottom: 12px;">📦</div>
          <p style="font-size: 16px; font-weight: 600;">No items found in this category.</p>
        </div>
      `;
      return;
    }

    const EMOJIS = { apparel: "👕", accessories: "🏋️", supplements: "🧪", gear: "🎒" };

    grid.innerHTML = filtered.map((item, idx) => {
      const isWish = this.wishlist.includes(item.id);
      const cartQty = this.getCartQty(item.id);
      const hasDiscount = item.original_price_inr && item.original_price_inr > item.price_inr;

      return `
        <div class="drop-in-item" style="
          animation-delay: ${idx * 0.08}s;
          background: rgba(236, 72, 153, 0.08); border: 1px solid rgba(236, 72, 153, 0.2);
          border-radius: 20px; padding: 18px; display: flex; flex-direction: column;
          position: relative; backdrop-filter: blur(8px); transition: transform 0.2s;
        ">
          <button onclick="ZiddiStore.toggleWishlist(${item.id})" style="
            position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 34px; height: 34px;
            display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;
          ">
            ${isWish ? "❤️" : "🤍"}
          </button>

          <div style="
            height: 140px; border-radius: 14px; background: rgba(236, 72, 153, 0.12);
            display: flex; align-items: center; justify-content: center; font-size: 56px; margin-bottom: 14px;
          ">
            ${EMOJIS[item.category] || "🛍️"}
          </div>

          <span style="
            align-self: flex-start; background: rgba(236, 72, 153, 0.2); color: #F472B6;
            font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 12px; margin-bottom: 8px;
          ">${item.category}</span>

          <h3 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0 0 4px 0; line-height: 1.3;">${item.name}</h3>
          <p style="font-size: 12px; color: #9CA3AF; margin: 0 0 14px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1;">
            ${item.description}
          </p>

          <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px;">
            <span style="font-size: 18px; font-weight: 800; color: #FFF;">₹${item.price_inr}</span>
            ${hasDiscount ? `<span style="font-size: 13px; color: #6B7280; text-decoration: line-through;">₹${item.original_price_inr}</span>` : ""}
          </div>

          ${cartQty > 0 ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.3); border: 1px solid #EC4899; border-radius: 12px; padding: 4px;">
              <button onclick="ZiddiStore.updateQty(${item.id}, -1)" style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: #FFF; font-weight: 800; cursor: pointer;">-</button>
              <span style="font-weight: 800; color: #FFF; font-size: 14px;">${cartQty} in Cart</span>
              <button onclick="ZiddiStore.addToCart(${item.id})" style="width: 32px; height: 32px; background: #EC4899; border: none; border-radius: 8px; color: #FFF; font-weight: 800; cursor: pointer;">+</button>
            </div>
          ` : `
            <button onclick="ZiddiStore.addToCart(${item.id})" style="
              width: 100%; background: linear-gradient(135deg, #EC4899 0%, #E11D48 100%);
              color: #FFF; border: none; border-radius: 12px; padding: 12px; font-weight: 700;
              font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
            ">Add to Cart</button>
          `}
        </div>
      `;
    }).join("");
  },

  // ── Cart & Wishlist Operations ──────────────────────────────────────────────
  addToCart(itemId) {
    if (!ZiddiAuth.isLoggedIn()) {
      ZiddiAuth.openModal();
      return;
    }

    const existing = this.cart.find(c => c.itemId === itemId);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({ itemId: itemId, qty: 1 });
    }

    this.saveCart();
    this.renderCatalog(window.currentCategory || "all");
    this.renderCartDrawer();
  },

  updateQty(itemId, delta) {
    const existing = this.cart.find(c => c.itemId === itemId);
    if (existing) {
      existing.qty += delta;
      if (existing.qty <= 0) {
        this.cart = this.cart.filter(c => c.itemId !== itemId);
      }
    }
    this.saveCart();
    this.renderCatalog(window.currentCategory || "all");
    this.renderCartDrawer();
  },

  getCartQty(itemId) {
    const existing = this.cart.find(c => c.itemId === itemId);
    return existing ? existing.qty : 0;
  },

  saveCart() {
    localStorage.setItem("ziddi_cart", JSON.stringify(this.cart));
    this.updateCartCount();
  },

  toggleWishlist(itemId) {
    if (this.wishlist.includes(itemId)) {
      this.wishlist = this.wishlist.filter(id => id !== itemId);
    } else {
      this.wishlist.push(itemId);
    }
    localStorage.setItem("ziddi_wishlist", JSON.stringify(this.wishlist));
    this.updateWishlistCount();
    this.renderCatalog(window.currentCategory || "all");
  },

  updateCartCount() {
    const total = this.cart.reduce((sum, c) => sum + c.qty, 0);
    const bubble = document.getElementById("cartCountBubble");
    if (bubble) {
      bubble.textContent = total;
      bubble.style.display = total > 0 ? "inline-flex" : "none";
    }
  },

  updateWishlistCount() {
    const total = this.wishlist.length;
    const bubble = document.getElementById("wishlistCountBubble");
    if (bubble) {
      bubble.textContent = total;
      bubble.style.display = total > 0 ? "inline-flex" : "none";
    }
  },

  // ── Fetch Shipping Addresses ────────────────────────────────────────────────
  async fetchAddresses(userId) {
    try {
      const res = await fetch(`${ZIDDI_API_BASE}/api/v1/user-addresses/user/${userId}`);
      if (res.ok) {
        const json = await res.json();
        this.addresses = json.data || [];
        this.selectedAddress = this.addresses.find(a => a.is_default || a.isDefault) || this.addresses[0] || null;
        this.renderAddressBar();
      }
    } catch (e) {
      console.warn("Could not fetch user addresses:", e);
    }
  },

  renderAddressBar() {
    const bar = document.getElementById("storeAddressBar");
    if (!bar) return;

    if (this.selectedAddress) {
      const name = this.selectedAddress.recipient_name || this.selectedAddress.recipientName;
      const city = this.selectedAddress.city;
      const zip = this.selectedAddress.postal_code || this.selectedAddress.postalCode;
      bar.innerHTML = `📍 Deliver to: <strong style="color: #EC4899;">${name} (${city} - ${zip})</strong>`;
    } else {
      bar.innerHTML = `📍 Deliver to: <span style="color: #9CA3AF;">Add shipping address</span>`;
    }
  },

  // ── Cart Drawer & Checkout ──────────────────────────────────────────────────
  openCart() {
    let drawer = document.getElementById("ziddiCartDrawer");
    if (!drawer) {
      drawer = this.createCartDrawerElement();
      document.body.appendChild(drawer);
    }
    drawer.style.display = "flex";
    this.renderCartDrawer();
  },

  closeCart() {
    const drawer = document.getElementById("ziddiCartDrawer");
    if (drawer) drawer.style.display = "none";
  },

  renderCartDrawer() {
    const body = document.getElementById("cartDrawerBody");
    const footer = document.getElementById("cartDrawerFooter");
    if (!body || !footer) return;

    if (this.cart.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #8F97B3;">
          <div style="font-size: 56px; margin-bottom: 12px;">🛒</div>
          <p style="font-size: 16px; font-weight: 700;">Your cart is empty.</p>
        </div>
      `;
      footer.style.display = "none";
      return;
    }

    const itemsMap = new Map(this.items.map(i => [i.id, i]));
    let subtotal = 0;

    body.innerHTML = this.cart.map(c => {
      const item = itemsMap.get(c.itemId);
      if (!item) return "";
      const itemTotal = item.price_inr * c.qty;
      subtotal += itemTotal;

      return `
        <div style="
          display: flex; align-items: center; gap: 12px; padding: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; margin-bottom: 10px;
        ">
          <div style="font-size: 32px; width: 44px; text-align: center;">🛍️</div>
          <div style="flex: 1;">
            <div style="font-size: 14px; font-weight: 700; color: #FFF;">${item.name}</div>
            <div style="font-size: 13px; font-weight: 800; color: #EC4899;">₹${itemTotal}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button onclick="ZiddiStore.updateQty(${item.id}, -1)" style="width: 28px; height: 28px; background: rgba(255,255,255,0.1); border: none; border-radius: 6px; color: #FFF; font-weight: 700; cursor: pointer;">-</button>
            <span style="font-weight: 700; color: #FFF; font-size: 14px;">${c.qty}</span>
            <button onclick="ZiddiStore.addToCart(${item.id})" style="width: 28px; height: 28px; background: #EC4899; border: none; border-radius: 6px; color: #FFF; font-weight: 700; cursor: pointer;">+</button>
          </div>
        </div>
      `;
    }).join("");

    const user = ZiddiAuth.getUser();
    const userCoins = user ? (user.ziddi_coins ?? user.ziddiCoins ?? 0) : 0;
    const coinSaving = this.useCoins && userCoins >= 25 ? 25 : 0;
    const grandTotal = Math.max(0, subtotal - coinSaving);

    footer.style.display = "block";
    footer.innerHTML = `
      ${userCoins >= 25 ? `
        <div onclick="ZiddiStore.toggleUseCoins()" style="
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; background: ${this.useCoins ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)'};
          border: 1px solid ${this.useCoins ? '#EC4899' : 'rgba(255,255,255,0.1)'};
          border-radius: 14px; margin-bottom: 14px; cursor: pointer;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="assets/ziddi_coin.png" style="height: 20px; width: 20px;">
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #FFF;">Redeem 25 Ziddi Coins</div>
              <div style="font-size: 11px; color: #9CA3AF;">${userCoins} coins available · saves ₹25</div>
            </div>
          </div>
          <input type="checkbox" ${this.useCoins ? 'checked' : ''} style="accent-color: #EC4899; width: 18px; height: 18px;">
        </div>
      ` : ""}

      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; color: #9CA3AF;">
        <span>Subtotal</span>
        <span style="color: #FFF; font-weight: 600;">₹${subtotal}</span>
      </div>
      ${coinSaving > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; color: #F59E0B;">
          <span>Coin discount</span>
          <span style="font-weight: 700;">- ₹${coinSaving}</span>
        </div>
      ` : ""}
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 18px; font-weight: 800; color: #FFF; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
        <span>Grand Total</span>
        <span style="color: #EC4899;">₹${grandTotal}</span>
      </div>

      <button onclick="ZiddiStore.checkout()" style="
        width: 100%; background: linear-gradient(135deg, #EC4899 0%, #E11D48 100%);
        color: #FFF; border: none; border-radius: 14px; padding: 16px; font-weight: 800;
        font-size: 16px; cursor: pointer; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.5);
      ">Pay with Razorpay · ₹${grandTotal}</button>
    `;
  },

  toggleUseCoins() {
    this.useCoins = !this.useCoins;
    this.renderCartDrawer();
  },

  createCartDrawerElement() {
    const drawer = document.createElement("div");
    drawer.id = "ziddiCartDrawer";
    drawer.style.cssText = `
      display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 10000;
      justify-content: flex-end;
    `;

    drawer.innerHTML = `
      <div style="
        width: 100%; max-width: 440px; height: 100%; background: #0D0D14;
        border-left: 1px solid rgba(236, 72, 153, 0.3); display: flex; flex-direction: column;
        padding: 24px; box-sizing: border-box; color: #FFF; font-family: 'Inter', sans-serif;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: 800; margin: 0; color: #FFF;">Shopping Cart</h2>
          <button onclick="ZiddiStore.closeCart()" style="background: none; border: none; color: #9CA3AF; font-size: 24px; cursor: pointer;">&times;</button>
        </div>

        <div id="cartDrawerBody" style="flex: 1; overflow-y: auto;"></div>
        <div id="cartDrawerFooter" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;"></div>
      </div>
    `;

    return drawer;
  },

  // ── Checkout & Razorpay Payment ──────────────────────────────────────────────
  async checkout() {
    const user = ZiddiAuth.getUser();
    if (!user || !user.id) {
      this.closeCart();
      ZiddiAuth.openModal();
      return;
    }

    if (this.cart.length === 0) return;

    const shippingAddr = this.selectedAddress 
      ? `${this.selectedAddress.recipient_name || user.name}, ${this.selectedAddress.address_line1 || ''}, ${this.selectedAddress.city || ''} - ${this.selectedAddress.postal_code || ''}`
      : `Primary Athlete Address, India`;

    try {
      // 1. Create order in backend
      const orderRes = await fetch(`${ZIDDI_API_BASE}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          use_coins: this.useCoins,
          payment_method: "razorpay",
          shipping_address: shippingAddr,
          items: this.cart.map(c => ({
            store_item_id: c.itemId,
            quantity: c.qty
          }))
        })
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || orderJson.status === "error") {
        alert("Failed to create order: " + (orderJson.message || "Try again."));
        return;
      }

      const order = orderJson.data || orderJson;

      // 2. Trigger Razorpay Payment or Mock Verify
      const verifyRes = await fetch(`${ZIDDI_API_BASE}/api/v1/payments/razorpay/mock-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "store",
          internal_id: order.id,
          success: "true"
        })
      });

      if (verifyRes.ok) {
        alert("🎉 Order Placed Successfully! Thank you for buying from Ziddi.");
        this.cart = [];
        this.saveCart();
        this.closeCart();
        this.renderCatalog(window.currentCategory || "all");
      } else {
        alert("Order placed pending payment confirmation.");
      }
    } catch (err) {
      alert("Checkout failed: " + err.message);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  ZiddiStore.init();
});
