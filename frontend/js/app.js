// ===== CONFIG =====
const API_BASE = 'http://localhost:5000/api';

// ===== STATE =====
const state = {
  user: JSON.parse(localStorage.getItem('gs_user') || 'null'),
  token: localStorage.getItem('gs_token') || null,
  cart: JSON.parse(localStorage.getItem('gs_cart') || '[]'),
  products: [],
  orders: [],
  coupons: [],
  appliedCoupon: null,
  currentPage: 'home',
  selectedCategory: 'All',
  searchQuery: '',
  trackingOrderId: null,
  notification: null,
};

// ===== PERSIST =====
function saveState() {
  localStorage.setItem('gs_user', JSON.stringify(state.user));
  localStorage.setItem('gs_token', state.token || '');
  localStorage.setItem('gs_cart', JSON.stringify(state.cart));
}

// ===== API HELPER =====
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ===== NOTIFICATION =====
function showNotification(msg, type = 'success') {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.className = `notification ${type}`;
  el.style.display = 'block';
  clearTimeout(state._notifTimer);
  state._notifTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ===== NAVIGATE =====
function navigate(page, extra = {}) {
  state.currentPage = page;
  Object.assign(state, extra);
  render();
  window.scrollTo(0, 0);
}

// ===== CART HELPERS =====
function cartCount() { return state.cart.reduce((s, i) => s + i.qty, 0); }
function cartSubtotal() { return state.cart.reduce((s, i) => s + i.price * i.qty, 0); }

function addToCart(product) {
  const existing = state.cart.find(i => i._id === product._id);
  if (existing) {
    state.cart = state.cart.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
  } else {
    state.cart = [...state.cart, { ...product, qty: 1 }];
  }
  saveState();
  showNotification(`${product.name} added to cart! 🛒`);
  renderNavbar();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i._id !== id);
  saveState();
  renderPage();
}

function updateQty(id, qty) {
  if (qty < 1) { removeFromCart(id); return; }
  state.cart = state.cart.map(i => i._id === id ? { ...i, qty } : i);
  saveState();
  renderPage();
}

// ===== LOGO HTML =====
function logoHTML() {
  return `<div class="logo" onclick="navigate('home')">
    <svg class="logo-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#7c3aed"/>
      <text x="20" y="27" text-anchor="middle" font-size="20" fill="white">🛒</text>
    </svg>
    <div>
      <span class="logo-text">GroShop</span>
      <span class="logo-sub">Fresh &amp; Fast</span>
    </div>
  </div>`;
}

// ===== RENDER NAVBAR =====
function renderNavbar() {
  const count = cartCount();
  document.getElementById('navbar').innerHTML = `
    <div style="display:flex;align-items:center;gap:0">${logoHTML()}</div>
    <div class="nav-links">
      <button class="nav-btn ${state.currentPage === 'home' ? 'active' : ''}" onclick="navigate('home')">🏠 Home</button>
      <button class="nav-btn ${state.currentPage === 'products' ? 'active' : ''}" onclick="navigate('products')">🛍️ Products</button>
      ${state.user ? `<button class="nav-btn ${state.currentPage === 'orders' ? 'active' : ''}" onclick="navigate('orders')">📦 Orders</button>` : ''}
      ${state.user && state.user.role === 'admin' ? `<button class="nav-btn ${state.currentPage === 'admin' ? 'active' : ''}" onclick="navigate('admin')">⚙️ Admin</button>` : ''}
      ${state.user ? `
        <button class="nav-btn" onclick="logout()">👋 ${state.user.name.split(' ')[0]}</button>
      ` : `
        <button class="nav-btn" onclick="navigate('login')">Sign In</button>
        <button class="nav-btn" onclick="navigate('register')">Register</button>
      `}
      <button class="nav-btn cart-btn" onclick="navigate('cart')">
        🛒 Cart ${count > 0 ? `<span class="badge">${count}</span>` : ''}
      </button>
    </div>`;
}

// ===== LOGOUT =====
async function logout() {
  state.user = null; state.token = null; state.cart = []; state.appliedCoupon = null;
  saveState();
  showNotification('Logged out successfully');
  navigate('home');
}

// ===== MAIN RENDER =====
function render() {
  renderNavbar();
  renderPage();
}

function renderPage() {
  const main = document.getElementById('main');
  switch (state.currentPage) {
    case 'home': renderHome(main); break;
    case 'products': renderProducts(main); break;
    case 'cart': renderCart(main); break;
    case 'login': renderLogin(main); break;
    case 'register': renderRegister(main); break;
    case 'orders': renderOrders(main); break;
    case 'tracking': renderTracking(main); break;
    case 'admin': renderAdmin(main); break;
    default: renderHome(main);
  }
}

window.onload = () => render();
