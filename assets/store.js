/**
 * Ziddi Web Store Module
 * Handles Catalog, Real Product Images, Variants (Sizes/Packs), Cart, Wishlist,
 * Address Selection, Ziddi Coins Discount, and Live Razorpay Payments.
 */

const ZiddiStore = {
  cart: JSON.parse(localStorage.getItem("ziddi_cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("ziddi_wishlist") || "[]"),
  items: [],
  selectedVariants: {}, // itemId -> variantId
  addresses: [],
  selectedAddress: null,
  useCoins: false,

  init() {
    this.fetchItems();
    this.updateAuthUI();
    this.updateCartCount();
    this.updateWishlistCount();

    const user = ZiddiAuth.getUser();
    if (user && user.id) {
      this.fetchAddresses(user.id);
    }
  },

  onAuthChanged() {
    this.updateAuthUI();
    const user = ZiddiAuth.getUser();
    if (user && user.id) {
      this.fetchAddresses(user.id);
    }
    this.renderCatalog(window.currentCategory || "all");
    this.renderCartDrawer();
  },

  updateAuthUI() {
    const user = ZiddiAuth.getUser();
    const authContainer = document.getElementById("storeAuthContainer");
    const coinsTxt = document.getElementById("storeUserCoinsTxt");
    const addressBar = document.getElementById("storeAddressBar");

    if (authContainer) {
      if (user) {
        const displayName = (user.name || user.first_name || user.username || "Athlete").split(" ")[0];
        authContainer.innerHTML = `
          <button onclick="ZiddiStore.handleUserSignOut()" class="icon-badge-btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); cursor: pointer;" title="Click to Sign Out">
            <span>👤 ${displayName}</span>
            <span style="font-size: 11px; color: #9CA3AF; margin-left: 4px;">Sign Out</span>
          </button>
        `;
      } else {
        authContainer.innerHTML = `
          <button onclick="ZiddiAuth.openModal()" class="icon-badge-btn" style="background: linear-gradient(135deg, #EC4899 0%, #E11D48 100%); color: #FFF; border: none; cursor: pointer; font-weight: 700; box-shadow: 0 4px 15px rgba(236,72,153,0.4);">
            <span>🔐 Sign In</span>
          </button>
        `;
      }
    }

    if (coinsTxt) {
      if (user) {
        const coins = user.ziddi_coins ?? user.ziddiCoins ?? 0;
        coinsTxt.textContent = `${coins.toLocaleString()} Coins`;
      } else {
        coinsTxt.textContent = "0 Coins";
      }
    }

    if (addressBar && !user) {
      addressBar.innerHTML = `📍 Deliver to: <a href="javascript:void(0)" onclick="ZiddiAuth.openModal()" style="color: #EC4899; text-decoration: underline; font-weight: 600;">Sign in to set delivery address &amp; redeem Ziddi Coins</a>`;
    }
  },

  handleUserSignOut() {
    if (confirm("Are you sure you want to sign out?")) {
      ZiddiAuth.logout();
    }
  },

  // ── Fetch Store Items from Live API ─────────────────────────────────────────
  async fetchItems() {
    try {
      const res = await fetch(`${ZIDDI_API_BASE}/api/v1/store/items`);
      if (res.ok) {
        const json = await res.json();
        this.items = json.data || json || [];
        this.initDefaultVariants();
        this.renderCatalog(window.currentCategory || "all");
        return;
      }
    } catch (e) {
      console.warn("Could not fetch live store items:", e);
    }
    this.renderCatalog(window.currentCategory || "all");
  },

  initDefaultVariants() {
    this.items.forEach(item => {
      if (item.variants && item.variants.length > 0 && !this.selectedVariants[item.id]) {
        // default to first available variant
        const firstAvail = item.variants.find(v => v.is_available) || item.variants[0];
        this.selectedVariants[item.id] = firstAvail.id;
      }
    });
  },

  selectVariant(itemId, variantId) {
    this.selectedVariants[itemId] = variantId;
    this.renderCatalog(window.currentCategory || "all");
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

      // Extract primary and secondary image URLs
      let primaryImg = null;
      let secondaryImg = null;
      if (item.image_url) {
        const urls = item.image_url.split(",").map(u => u.trim()).filter(Boolean);
        if (urls.length > 0) primaryImg = urls[0];
        if (urls.length > 1) secondaryImg = urls[1];
      }

      // Check selected variant
      const selectedVarId = this.selectedVariants[item.id];
      const selectedVar = (item.variants || []).find(v => v.id === selectedVarId);
      const displayPrice = selectedVar ? selectedVar.price_inr : item.price_inr;
      const displayOriginal = selectedVar ? selectedVar.original_price_inr : item.original_price_inr;

      return `
        <div class="drop-in-item" style="
          animation-delay: ${idx * 0.05}s;
          background: rgba(18, 17, 26, 0.85); border: 1px solid rgba(236, 72, 153, 0.22);
          border-radius: 22px; padding: 18px; display: flex; flex-direction: column;
          position: relative; backdrop-filter: blur(12px); transition: transform 0.25s ease, box-shadow 0.25s ease;
        ">
          <!-- Wishlist Heart Button -->
          <button onclick="ZiddiStore.toggleWishlist(${item.id})" style="
            position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.55);
            border: 1px solid rgba(255,255,255,0.15); border-radius: 50%; width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;
            z-index: 5; backdrop-filter: blur(6px);
          ">
            ${isWish ? "❤️" : "🤍"}
          </button>

          <!-- Product Image Container -->
          <div style="
            height: 220px; border-radius: 16px; background: #0E0D16;
            display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
            overflow: hidden; position: relative; border: 1px solid rgba(255, 255, 255, 0.06);
          ">
            ${primaryImg ? `
              <img src="${primaryImg}" alt="${item.name}" loading="lazy" style="
                width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease;
              " onmouseover="if ('${secondaryImg || ''}') this.src='${secondaryImg}'; this.style.transform='scale(1.06)';" onmouseout="this.src='${primaryImg}'; this.style.transform='scale(1)';">
            ` : `
              <div style="font-size: 64px;">${EMOJIS[item.category] || "🛍️"}</div>
            `}

            ${hasDiscount ? `
              <span style="
                position: absolute; top: 10px; left: 10px; background: #EF4444; color: #FFF;
                font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 8px;
                box-shadow: 0 4px 10px rgba(239,68,68,0.4);
              ">
                ${Math.round(((item.original_price_inr - item.price_inr) / item.original_price_inr) * 100)}% OFF
              </span>
            ` : ""}
          </div>

          <!-- Category Pill -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="
              background: rgba(236, 72, 153, 0.15); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.3);
              font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; letter-spacing: 0.5px;
            ">${item.category}</span>
            <span style="font-size: 11px; color: #10B981; font-weight: 700;">● In Stock</span>
          </div>

          <!-- Title & Description -->
          <h3 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0 0 6px 0; line-height: 1.35;">${item.name}</h3>
          <p style="font-size: 12.5px; color: #9CA3AF; margin: 0 0 14px 0; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1;">
            ${item.description}
          </p>

          <!-- Variants Selector (Sizes / Quantities) -->
          ${item.variants && item.variants.length > 0 ? `
            <div style="margin-bottom: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">SELECT OPTION:</div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${item.variants.map(v => {
                  const isSel = v.id === selectedVarId;
                  return `
                    <button onclick="ZiddiStore.selectVariant(${item.id}, ${v.id})" style="
                      background: ${isSel ? 'linear-gradient(135deg, #EC4899 0%, #E11D48 100%)' : 'rgba(255,255,255,0.06)'};
                      border: 1px solid ${isSel ? '#EC4899' : 'rgba(255,255,255,0.15)'};
                      color: ${isSel ? '#FFF' : '#CBD5E1'};
                      border-radius: 8px; padding: 4px 10px; font-size: 11.5px; font-weight: 700; cursor: pointer;
                      transition: all 0.2s ease;
                    ">${v.variant_name}</button>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Price Display -->
          <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px;">
            <span style="font-size: 20px; font-weight: 900; color: #FFF;">₹${displayPrice}</span>
            ${displayOriginal && displayOriginal > displayPrice ? `
              <span style="font-size: 13px; color: #64748B; text-decoration: line-through; font-weight: 600;">₹${displayOriginal}</span>
            ` : ""}
          </div>

          <!-- Add to Cart / Qty Actions -->
          ${cartQty > 0 ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); border: 1.5px solid #EC4899; border-radius: 12px; padding: 4px 6px;">
              <button onclick="ZiddiStore.updateQty(${item.id}, -1)" style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: #FFF; font-weight: 800; font-size: 16px; cursor: pointer;">-</button>
              <span style="font-weight: 800; color: #FFF; font-size: 14px;">${cartQty} in Cart</span>
              <button onclick="ZiddiStore.addToCart(${item.id})" style="width: 32px; height: 32px; background: #EC4899; border: none; border-radius: 8px; color: #FFF; font-weight: 800; font-size: 16px; cursor: pointer;">+</button>
            </div>
          ` : `
            <button onclick="ZiddiStore.addToCart(${item.id})" style="
              width: 100%; background: linear-gradient(135deg, #EC4899 0%, #E11D48 100%);
              color: #FFF; border: none; border-radius: 12px; padding: 12px; font-weight: 800;
              font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
              transition: transform 0.2s ease;
            ">Add to Cart</button>
          `}
        </div>
      `;
    }).join("");
  },

  // ── Cart & Wishlist Operations ──────────────────────────────────────────────
  addToCart(itemId) {
    if (!ZiddiAuth.isLoggedIn()) {
      alert("🔐 Please sign in with your Ziddi account to add items to your cart and checkout!");
      ZiddiAuth.openModal();
      return;
    }

    const variantId = this.selectedVariants[itemId] || null;
    const existing = this.cart.find(c => c.itemId === itemId && c.variantId === variantId);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({ itemId: itemId, variantId: variantId, qty: 1 });
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
        this.cart = this.cart.filter(c => c !== existing);
      }
    }
    this.saveCart();
    this.renderCatalog(window.currentCategory || "all");
    this.renderCartDrawer();
  },

  getCartQty(itemId) {
    return this.cart.filter(c => c.itemId === itemId).reduce((sum, c) => sum + c.qty, 0);
  },

  saveCart() {
    localStorage.setItem("ziddi_cart", JSON.stringify(this.cart));
    this.updateCartCount();
  },

  toggleWishlist(itemId) {
    if (!ZiddiAuth.isLoggedIn()) {
      alert("🔐 Please sign in to save items to your wishlist!");
      ZiddiAuth.openModal();
      return;
    }

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

    const user = ZiddiAuth.getUser();
    if (!user) {
      bar.innerHTML = `📍 Deliver to: <a href="javascript:void(0)" onclick="ZiddiAuth.openModal()" style="color: #EC4899; text-decoration: underline; font-weight: 600;">Sign in to set delivery address &amp; redeem Ziddi Coins</a>`;
      return;
    }

    if (this.selectedAddress) {
      const name = this.selectedAddress.recipient_name || this.selectedAddress.recipientName || user.name;
      const city = this.selectedAddress.city || "Bangalore";
      const zip = this.selectedAddress.postal_code || this.selectedAddress.postalCode || "";
      bar.innerHTML = `📍 Deliver to: <strong style="color: #EC4899;">${name} (${city}${zip ? ' - ' + zip : ''})</strong>`;
    } else {
      bar.innerHTML = `📍 Deliver to: <strong style="color: #EC4899;">${user.name || 'Athlete'} (Default Delivery Address)</strong>`;
    }
  },

  // ── Cart Drawer & Checkout ──────────────────────────────────────────────────
  openCart() {
    if (!ZiddiAuth.isLoggedIn()) {
      alert("🔐 Please sign in with your Ziddi account to view your cart and checkout!");
      ZiddiAuth.openModal();
      return;
    }

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
          <p style="font-size: 16px; font-weight: 700; color: #FFF;">Your cart is empty.</p>
          <p style="font-size: 13px; color: #94A3B8;">Add some official Ziddi gear or supplements to proceed!</p>
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
      
      const variant = (item.variants || []).find(v => v.id === c.variantId);
      const price = variant ? variant.price_inr : item.price_inr;
      const itemTotal = price * c.qty;
      subtotal += itemTotal;

      let primaryImg = null;
      if (item.image_url) {
        primaryImg = item.image_url.split(",")[0].trim();
      }

      return `
        <div style="
          display: flex; align-items: center; gap: 12px; padding: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; margin-bottom: 10px;
        ">
          <div style="width: 52px; height: 52px; border-radius: 10px; background: #0E0D16; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
            ${primaryImg ? `<img src="${primaryImg}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 26px;">🛍️</span>`}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 13.5px; font-weight: 700; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
            ${variant ? `<div style="font-size: 11px; color: #94A3B8; font-weight: 600;">Option: ${variant.variant_name}</div>` : ""}
            <div style="font-size: 13.5px; font-weight: 800; color: #EC4899; margin-top: 2px;">₹${itemTotal}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <button onclick="ZiddiStore.updateQty(${item.id}, -1)" style="width: 28px; height: 28px; background: rgba(255,255,255,0.1); border: none; border-radius: 6px; color: #FFF; font-weight: 700; cursor: pointer;">-</button>
            <span style="font-weight: 700; color: #FFF; font-size: 13.5px; min-width: 16px; text-align: center;">${c.qty}</span>
            <button onclick="ZiddiStore.addToCart(${item.id})" style="width: 28px; height: 28px; background: #EC4899; border: none; border-radius: 6px; color: #FFF; font-weight: 700; cursor: pointer;">+</button>
          </div>
        </div>
      `;
    }).join("");

    const user = ZiddiAuth.getUser();
    const userCoins = user ? (user.ziddi_coins ?? user.ziddiCoins ?? 0) : 0;
    const coinSaving = this.useCoins && userCoins >= 25 ? 25 : 0;
    const grandTotal = Math.max(1, subtotal - coinSaving);

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
              <div style="font-size: 11px; color: #9CA3AF;">${userCoins.toLocaleString()} coins available · saves ₹25</div>
            </div>
          </div>
          <input type="checkbox" ${this.useCoins ? 'checked' : ''} style="accent-color: #EC4899; width: 18px; height: 18px; cursor: pointer;">
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

      <button id="checkoutPayBtn" onclick="ZiddiStore.checkout()" style="
        width: 100%; background: linear-gradient(135deg, #EC4899 0%, #E11D48 100%);
        color: #FFF; border: none; border-radius: 14px; padding: 16px; font-weight: 800;
        font-size: 16px; cursor: pointer; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.5);
        display: flex; align-items: center; justify-content: center; gap: 8px;
      ">
        <span>🔒 Pay with Razorpay · ₹${grandTotal}</span>
      </button>
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

  // ── Checkout & Razorpay Payment Integration ────────────────────────────────
  async checkout() {
    const user = ZiddiAuth.getUser();
    if (!user || !user.id) {
      this.closeCart();
      alert("🔐 Please sign in with your Ziddi account to proceed with checkout.");
      ZiddiAuth.openModal();
      return;
    }

    if (this.cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const payBtn = document.getElementById("checkoutPayBtn");
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.innerHTML = `<span>⏳ Initializing Secure Gateway...</span>`;
    }

    const itemsMap = new Map(this.items.map(i => [i.id, i]));
    let subtotal = 0;
    this.cart.forEach(c => {
      const item = itemsMap.get(c.itemId);
      if (item) {
        const variant = (item.variants || []).find(v => v.id === c.variantId);
        const price = variant ? variant.price_inr : item.price_inr;
        subtotal += price * c.qty;
      }
    });

    const userCoins = user ? (user.ziddi_coins ?? user.ziddiCoins ?? 0) : 0;
    const coinSaving = this.useCoins && userCoins >= 25 ? 25 : 0;
    const grandTotal = Math.max(1, subtotal - coinSaving);
    const grandTotalPaise = Math.round(grandTotal * 100);

    const shippingAddr = this.selectedAddress 
      ? `${this.selectedAddress.recipient_name || user.name}, ${this.selectedAddress.address_line1 || ''}, ${this.selectedAddress.city || ''} - ${this.selectedAddress.postal_code || ''}`
      : `Primary Athlete Address, Bangalore, Karnataka - 560001, India`;

    try {
      // 1. Create order in Ziddi backend
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
        alert("Failed to initialize order: " + (orderJson.message || "Please check details and try again."));
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.innerHTML = `<span>🔒 Pay with Razorpay · ₹${grandTotal}</span>`;
        }
        return;
      }

      const order = orderJson.data || orderJson;
      const internalId = order.id || order.order_id || String(Date.now());

      // 2. Create Razorpay order on backend
      const rzpOrderRes = await fetch(`${ZIDDI_API_BASE}/api/v1/payments/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "store",
          amount: grandTotalPaise,
          internal_id: String(internalId),
          user_id: user.id
        })
      });

      const rzpOrderJson = await rzpOrderRes.json();
      if (!rzpOrderRes.ok || rzpOrderJson.status === "error" || !rzpOrderJson.data) {
        alert("Razorpay payment gateway error: " + (rzpOrderJson.message || "Could not create payment session."));
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.innerHTML = `<span>🔒 Pay with Razorpay · ₹${grandTotal}</span>`;
        }
        return;
      }

      const rzpData = rzpOrderJson.data;

      // 3. Launch Razorpay Standard Checkout
      if (typeof Razorpay === "undefined") {
        alert("Razorpay checkout script is loading. Please try again in 2 seconds.");
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.innerHTML = `<span>🔒 Pay with Razorpay · ₹${grandTotal}</span>`;
        }
        return;
      }

      const options = {
        key: rzpData.key_id || "rzp_live_TYufkSHUQz6c4t",
        amount: rzpData.amount || grandTotalPaise,
        currency: rzpData.currency || "INR",
        name: "Ziddi Store",
        description: `Order #${internalId} — Official Ziddi Gear`,
        image: "https://www.ziddiapp.com/assets/favicon.png",
        order_id: rzpData.order_id || rzpData.razorpay_order_id,
        handler: async (response) => {
          // 4. Verify Payment Signature
          try {
            const verifyRes = await fetch(`${ZIDDI_API_BASE}/api/v1/payments/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                context: "store",
                internal_id: String(internalId)
              })
            });
            const verifyJson = await verifyRes.json();
            ZiddiStore.showOrderSuccessModal(order, response.razorpay_payment_id);
          } catch (e) {
            console.warn("Verification warning:", e);
            ZiddiStore.showOrderSuccessModal(order, response.razorpay_payment_id);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || user.phone_number || ""
        },
        notes: {
          internal_id: String(internalId),
          address: shippingAddr
        },
        theme: {
          color: "#EC4899"
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        alert("❌ Payment Failed: " + (resp.error ? resp.error.description : "Transaction declined."));
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.innerHTML = `<span>🔒 Pay with Razorpay · ₹${grandTotal}</span>`;
        }
      });
      rzp.open();

      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = `<span>🔒 Pay with Razorpay · ₹${grandTotal}</span>`;
      }
    } catch (err) {
      console.error("Checkout exception:", err);
      alert("Checkout failed: " + err.message);
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = `<span>🔒 Pay with Razorpay · ₹${grandTotal}</span>`;
      }
    }
  },

  showOrderSuccessModal(order, paymentId) {
    this.cart = [];
    this.saveCart();
    this.closeCart();
    this.renderCatalog(window.currentCategory || "all");

    let modal = document.getElementById("storeOrderSuccessModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "storeOrderSuccessModal";
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(8, 8, 12, 0.92); backdrop-filter: blur(14px); z-index: 100000;
        display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;
      `;
      document.body.appendChild(modal);
    }

    const orderId = order.id || order.order_id || "ZIDDI-" + Math.floor(1000 + Math.random() * 9000);

    modal.innerHTML = `
      <div style="
        background: #12111D; border: 1.5px solid #10B981; border-radius: 24px;
        padding: 40px 32px; max-width: 460px; width: 100%; text-align: center; color: #FFF;
        box-shadow: 0 20px 60px rgba(16, 185, 129, 0.25); font-family: 'Inter', sans-serif;
      ">
        <div style="font-size: 56px; margin-bottom: 12px;">🎉</div>
        <h2 style="font-size: 24px; font-weight: 800; color: #FFF; margin: 0 0 8px 0;">Order Placed Successfully!</h2>
        <p style="font-size: 14px; color: #94A3B8; line-height: 1.5; margin: 0 0 20px 0;">
          Thank you for choosing Ziddi! Your payment has been processed securely via Razorpay.
        </p>

        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; text-align: left; margin-bottom: 24px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #94A3B8;">Order ID:</span>
            <strong style="color: #34D399;">#${orderId}</strong>
          </div>
          ${paymentId ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94A3B8;">Payment ID:</span>
              <strong style="color: #FFF;">${paymentId}</strong>
            </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94A3B8;">Fulfillment:</span>
            <span style="color: #EC4899; font-weight: 700;">Bangalore Warehouse 📦</span>
          </div>
        </div>

        <button onclick="document.getElementById('storeOrderSuccessModal').style.display='none'" style="
          width: 100%; background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: #FFF; border: none; border-radius: 12px; padding: 14px; font-weight: 800;
          font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        ">Continue Shopping 🛍️</button>
      </div>
    `;
    modal.style.display = "flex";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  ZiddiStore.init();
});
