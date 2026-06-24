// ===== COUPON SUGGESTIONS =====
async function loadCouponSuggestions(subtotal) {
  try {
    const data = await api('GET', `/coupons/suggestions?subtotal=${subtotal}`);
    renderCouponSuggestions(data, subtotal);
  } catch (e) {
    // silently fail — suggestions are optional
  }
}

function renderCouponSuggestions({ applicable, nearlyEligible }, subtotal) {
  const box = document.getElementById('coupon-suggestions');
  if (!box) return;
  if (applicable.length === 0 && nearlyEligible.length === 0) { box.innerHTML = ''; return; }

  let html = '<div class="suggestions-box">';
  html += '<div class="suggestions-title">🏷️ Available Coupons</div>';

  applicable.forEach(c => {
    html += `<div class="suggestion-card suggestion-applicable">
      <div class="suggestion-left">
        <span class="suggestion-code">${c.code}</span>
        <span class="suggestion-desc">Save ${c.label} on this order · You save <strong>₹${c.savingAmount}</strong></span>
      </div>
      <button class="suggestion-apply-btn" onclick="quickApplyCoupon('${c.code}')">Apply</button>
    </div>`;
  });

  nearlyEligible.forEach(c => {
    html += `<div class="suggestion-card suggestion-nearly">
      <div class="suggestion-left">
        <span class="suggestion-code">${c.code}</span>
        <span class="suggestion-desc">Add ₹${c.amountNeeded} more to unlock ${c.label}</span>
      </div>
      <button class="suggestion-shop-btn" onclick="navigate('products')">+ Add Items</button>
    </div>`;
  });

  html += '</div>';
  box.innerHTML = html;
}

async function quickApplyCoupon(code) {
  try {
    const coupon = await api('POST', '/coupons/validate', { code, subtotal: cartSubtotal() });
    state.appliedCoupon = coupon;
    showNotification(`🎉 Coupon "${coupon.code}" applied! You saved ${coupon.type === 'percent' ? coupon.discount + '%' : '₹' + coupon.discount}`);
    renderPage();
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

// ===== CART PAGE =====
function renderCart(main) {
  if (state.cart.length === 0) {
    main.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🛒</div>
      <h2>Your cart is empty</h2>
      <p>Add some fresh groceries to get started</p>
      <button class="btn-primary btn-auto" onclick="navigate('products')">Browse Products</button>
    </div>`; return;
  }

  const subtotal = cartSubtotal();
  let discount = 0;
  if (state.appliedCoupon) {
    discount = state.appliedCoupon.type === 'percent'
      ? Math.round(subtotal * state.appliedCoupon.discount / 100)
      : state.appliedCoupon.discount;
  }
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const total = subtotal - discount + deliveryFee;

  main.innerHTML = `<div class="cart-page">
    <h2 class="section-title">🛒 Your Cart (${cartCount()} items)</h2>
    <div class="cart-grid">
      <div id="cart-items">
        ${state.cart.map(item => `
          <div class="cart-item">
            <div class="cart-emoji">${item.image}</div>
            <div class="cart-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-unit">${item.unit}</div>
              <div class="cart-item-price">₹${item.price * item.qty}</div>
            </div>
            <div class="qty-btns">
              <button class="qty-btn" onclick="updateQty('${item._id}', ${item.qty - 1})">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty('${item._id}', ${item.qty + 1})">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item._id}')">🗑️</button>
          </div>`).join('')}
      </div>
      <div>
        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div id="coupon-suggestions"><div class="suggestions-loading">🏷️ Loading coupon suggestions…</div></div>
          <div class="coupon-row">
            <input class="coupon-input" id="coupon-input" type="text" placeholder="Enter coupon code" value="">
            <button class="btn-primary btn-auto" style="margin-top:0;padding:10px 16px" onclick="applyCoupon()">Apply</button>
          </div>
          ${state.appliedCoupon ? `
            <div class="applied-coupon">
              <span>✅ ${state.appliedCoupon.code}</span>
              <span style="cursor:pointer" onclick="removeCoupon()">✕</span>
            </div>` : ''}
          <div class="sum-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
          ${discount > 0 ? `<div class="sum-row sum-discount"><span>Discount</span><span>−₹${discount}</span></div>` : ''}
          <div class="sum-row"><span>Delivery Fee</span><span class="${deliveryFee === 0 ? 'sum-free' : ''}">${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}</span></div>
          ${subtotal < 500 ? `<div class="free-delivery-hint">Add ₹${500 - subtotal} more for free delivery</div>` : ''}
          <div class="sum-total"><span>Total</span><span>₹${total}</span></div>
          <div id="checkout-area">
            <button class="btn-primary" style="margin-top:16px" onclick="showCheckout()">Proceed to Checkout →</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  // Load coupon suggestions asynchronously after rendering
  if (state.user) loadCouponSuggestions(subtotal);
}

async function applyCoupon() {
  const code = document.getElementById('coupon-input').value.toUpperCase().trim();
  if (!code) return;
  try {
    const coupon = await api('POST', '/coupons/validate', { code, subtotal: cartSubtotal() });
    state.appliedCoupon = coupon;
    showNotification(`Coupon "${coupon.code}" applied!`);
    renderPage();
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

function removeCoupon() {
  state.appliedCoupon = null;
  renderPage();
}

function showCheckout() {
  if (!state.user) { navigate('login'); return; }
  document.getElementById('checkout-area').innerHTML = `
    <div class="checkout-form">
      <textarea id="delivery-address" placeholder="Enter delivery address..."></textarea>
      <button class="btn-primary" onclick="placeOrder()">🚀 Place Order</button>
    </div>`;
}

async function placeOrder() {
  const address = document.getElementById('delivery-address').value.trim();
  if (!address) { showNotification('Please enter delivery address', 'error'); return; }
  try {
    const order = await api('POST', '/orders', {
      items: state.cart.map(i => ({ productId: i._id, name: i.name, image: i.image, unit: i.unit, price: i.price, qty: i.qty })),
      address,
      couponCode: state.appliedCoupon?.code || null
    });
    state.cart = []; state.appliedCoupon = null; saveState();
    showNotification('Order placed successfully! 🎉');
    navigate('tracking', { trackingOrderId: order.orderId });
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

// ===== LOGIN PAGE =====
function renderLogin(main) {
  main.innerHTML = `<div class="auth-page">
    <div class="auth-card">
      <div style="text-align:center;margin-bottom:20px">
        <span style="font-size:40px">🛒</span>
        <div style="font-size:22px;font-weight:800;color:#7c3aed">GroShop</div>
      </div>
      <h2 class="auth-title">Welcome back!</h2>
      <p class="auth-sub">Sign in to your GroShop account</p>
      <div class="input-group"><label>Email address</label><input type="email" id="login-email" placeholder="Email address"></div>
      <div class="input-group"><label>Password</label><input type="password" id="login-password" placeholder="Password" onkeydown="if(event.key==='Enter')doLogin()"></div>
      <button class="btn-primary" onclick="doLogin()">Sign In</button>
      <p class="auth-switch">Don't have an account? <button class="link-btn" onclick="navigate('register')">Create one</button></p>
      <div class="demo-box"><strong>Demo accounts:</strong><br>Admin: admin@groshop.com / admin123<br>User: priya@example.com / user123</div>
    </div>
  </div>`;
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const user = await api('POST', '/auth/login', { email, password });
    state.user = user; state.token = user.token;
    saveState();
    showNotification(`Welcome back, ${user.name}!`);
    navigate(user.role === 'admin' ? 'admin' : 'home');
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

// ===== REGISTER PAGE =====
function renderRegister(main) {
  main.innerHTML = `<div class="auth-page">
    <div class="auth-card">
      <h2 class="auth-title">Create Account</h2>
      <p class="auth-sub">Join GroShop and get fresh groceries delivered</p>
      <div class="input-group"><label>Full name</label><input type="text" id="reg-name" placeholder="Full name"></div>
      <div class="input-group"><label>Email address</label><input type="email" id="reg-email" placeholder="Email address"></div>
      <div class="input-group"><label>Phone number</label><input type="tel" id="reg-phone" placeholder="Phone number"></div>
      <div class="input-group"><label>Password</label><input type="password" id="reg-password" placeholder="Password"></div>
      <button class="btn-primary" onclick="doRegister()">Create Account</button>
      <p class="auth-switch">Already have an account? <button class="link-btn" onclick="navigate('login')">Sign in</button></p>
    </div>
  </div>`;
}

async function doRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;
  try {
    const user = await api('POST', '/auth/register', { name, email, phone, password });
    state.user = user; state.token = user.token;
    saveState();
    showNotification('Account created! Welcome to GroShop!');
    navigate('home');
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

// ===== ORDERS PAGE =====
async function renderOrders(main) {
  if (!state.user) {
    main.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📦</div>
      <h2>Sign in to view your orders</h2>
      <button class="btn-primary btn-auto" onclick="navigate('login')">Sign In</button>
    </div>`; return;
  }
  main.innerHTML = `<div class="section"><h2 class="section-title">📦 My Orders</h2><div class="loading"><span class="spinner"></span>Loading orders...</div></div>`;
  try {
    const orders = await api('GET', '/orders/my');
    state.orders = orders;
    if (orders.length === 0) {
      main.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h2>No orders yet</h2><p>Start shopping to see your orders here</p><button class="btn-primary btn-auto" onclick="navigate('products')">Shop Now</button></div>`;
      return;
    }
    main.innerHTML = `<div class="section"><h2 class="section-title">📦 My Orders</h2>${orders.map(orderCardHTML).join('')}</div>`;
  } catch (e) {
    main.innerHTML = `<div class="section"><p style="color:#ef4444">Failed to load orders.</p></div>`;
  }
}

function orderCardHTML(order) {
  const isDelivered = order.status === 'Delivered';
  return `<div class="order-card">
    <div class="order-header">
      <div>
        <div class="order-id">Order #${order.orderId}</div>
        <div class="order-meta">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div class="order-meta">${order.items.length} items · ₹${order.total}</div>
      </div>
      <div class="order-actions">
        <span class="status-badge ${isDelivered ? 'status-delivered' : 'status-active'}">${order.status}</span>
        <button class="track-btn" onclick="navigate('tracking', {trackingOrderId:'${order.orderId}'})">Track Order</button>
      </div>
    </div>
    <div class="order-items">${order.items.map(i => `<span class="order-item-tag">${i.image} ${i.name} ×${i.qty}</span>`).join('')}</div>
    ${isDelivered && !order.rating ? ratingWidgetHTML(order.orderId) : ''}
    ${order.rating ? `<div style="margin-top:12px;background:#f0fdf4;border-radius:8px;padding:12px;font-size:13px;color:#065f46">⭐ Your rating: ${order.rating}/5 — "${order.review}"</div>` : ''}
  </div>`;
}

function ratingWidgetHTML(orderId) {
  return `<div class="rating-widget" id="rating-${orderId}">
    <div style="font-size:14px;font-weight:600;margin-bottom:8px">Rate your order</div>
    <div class="stars" id="stars-${orderId}">
      ${[1,2,3,4,5].map(n => `<span class="star" onclick="setRating('${orderId}',${n})" onmouseover="hoverStars('${orderId}',${n})" onmouseout="resetStars('${orderId}')">⭐</span>`).join('')}
    </div>
    <input class="rating-input" id="review-${orderId}" type="text" placeholder="Write a review (optional)">
    <button class="btn-primary btn-auto" style="padding:9px 20px" onclick="submitRating('${orderId}')">Submit</button>
  </div>`;
}

let selectedRatings = {};
function setRating(orderId, n) { selectedRatings[orderId] = n; hoverStars(orderId, n); }
function hoverStars(orderId, n) {
  document.querySelectorAll(`#stars-${orderId} .star`).forEach((s, i) => s.classList.toggle('active', i < n));
}
function resetStars(orderId) {
  const r = selectedRatings[orderId] || 0;
  document.querySelectorAll(`#stars-${orderId} .star`).forEach((s, i) => s.classList.toggle('active', i < r));
}

async function submitRating(orderId) {
  const rating = selectedRatings[orderId];
  if (!rating) { showNotification('Please select a star rating', 'error'); return; }
  const review = document.getElementById(`review-${orderId}`).value;
  try {
    await api('PUT', `/orders/${orderId}/rate`, { rating, review });
    showNotification('Thanks for your feedback!');
    renderPage();
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

// ===== TRACKING PAGE =====
const ORDER_STATUSES = ['Order Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

async function renderTracking(main) {
  const orderId = state.trackingOrderId;
  if (!orderId) { navigate('orders'); return; }
  main.innerHTML = `<div class="tracking-page"><div class="loading"><span class="spinner"></span>Loading order...</div></div>`;
  try {
    const order = await api('GET', `/orders/${orderId}`);
    main.innerHTML = `<div class="tracking-page">
      <h2 class="section-title" style="margin-bottom:8px">📍 Order Tracking</h2>
      <p style="color:#6b7280;margin-bottom:24px">Order #${order.orderId}</p>
      <div class="tracking-card">
        <div class="tracker">
          ${ORDER_STATUSES.map((status, idx) => {
            const done = idx <= order.statusIndex;
            const current = idx === order.statusIndex;
            const isLast = idx === ORDER_STATUSES.length - 1;
            return `<div class="tracker-step">
              <div class="tracker-dot-col">
                <div class="tracker-dot ${done ? 'done' : ''} ${current ? 'current' : ''}"></div>
                ${!isLast ? `<div class="tracker-line ${idx < order.statusIndex ? 'done' : ''}"></div>` : ''}
              </div>
              <div class="tracker-label ${done ? 'done' : 'pending'}" style="padding-bottom:${!isLast ? '32px' : '0'}">${status}</div>
            </div>`;
          }).join('')}
        </div>

        <div class="delivery-boy">
          <div class="avatar">${order.deliveryBoy.avatar}</div>
          <div>
            <div style="font-weight:700;font-size:16px">${order.deliveryBoy.name}</div>
            <a href="tel:${order.deliveryBoy.phone}" style="color:#7c3aed;font-size:14px">${order.deliveryBoy.phone}</a>
            <div style="font-size:13px;color:#6b7280;margin-top:2px">⭐ ${order.deliveryBoy.rating} Rating</div>
          </div>
        </div>

        <div class="order-detail-items">
          <div style="font-size:14px;font-weight:700;margin-bottom:10px">📦 Order Items</div>
          ${order.items.map(i => `<div class="order-detail-row"><span>${i.image} ${i.name} × ${i.qty}</span><span style="font-weight:600">₹${i.price * i.qty}</span></div>`).join('')}
          <div style="border-top:1px solid #f3e8ff;margin-top:10px;padding-top:10px">
            ${order.discount > 0 ? `<div class="order-detail-row" style="color:#059669"><span>Discount (${order.coupon})</span><span>−₹${order.discount}</span></div>` : ''}
            <div class="order-detail-row" style="color:#6b7280"><span>Delivery</span><span>${order.deliveryFee === 0 ? 'FREE' : '₹' + order.deliveryFee}</span></div>
            <div class="order-detail-total"><span>Total</span><span>₹${order.total}</span></div>
          </div>
        </div>

        <div style="margin-top:16px;background:#faf5ff;border-radius:10px;padding:12px;font-size:13px;color:#6b7280">
          📍 Delivering to: ${order.address}
        </div>

        <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn-primary btn-auto" onclick="navigate('orders')">← My Orders</button>
          <button class="btn-primary btn-auto" style="background:#f3e8ff;color:#7c3aed" onclick="navigate('products')">Continue Shopping</button>
        </div>
      </div>
    </div>`;
  } catch (e) {
    main.innerHTML = `<div class="section"><p style="color:#ef4444">Order not found.</p><button class="btn-primary btn-auto" onclick="navigate('orders')">← Back to Orders</button></div>`;
  }
}
