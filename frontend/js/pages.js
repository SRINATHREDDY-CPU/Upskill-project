// ===== HOME PAGE =====
async function renderHome(main) {
  main.innerHTML = `
    <div class="hero">
      <h1>🛒 Fresh Groceries Delivered in 30 Mins</h1>
      <p>Order fresh fruits, vegetables, dairy & more at your doorstep</p>
      <div class="search-box">
        <input type="text" id="hero-search" placeholder="Search for groceries..." value="${state.searchQuery}"
          oninput="state.searchQuery=this.value" onkeydown="if(event.key==='Enter'){navigate('products')}">
        <button onclick="navigate('products')">Search 🔍</button>
      </div>
    </div>
    <div id="featured-section" class="section">
      <div class="loading"><span class="spinner"></span>Loading products...</div>
    </div>
    <div class="how-it-works">
      <h2>How It Works</h2>
      <p>3 simple steps to fresh groceries at your door</p>
      <div class="steps">
        <div class="step"><div class="icon">🛒</div><h3>Add to Cart</h3><p>Browse and add fresh groceries to your cart</p></div>
        <div class="step"><div class="icon">📍</div><h3>Enter Address</h3><p>Tell us where to deliver your order</p></div>
        <div class="step"><div class="icon">🚀</div><h3>Fast Delivery</h3><p>Get it delivered to your door in 30 mins</p></div>
      </div>
    </div>`;

  try {
    const products = await api('GET', '/products?limit=8');
    state.products = products;
    const featured = products.slice(0, 8);
    document.getElementById('featured-section').innerHTML = `
      <div class="featured-header">
        <h2 class="section-title">🌟 Featured Products</h2>
        <button class="see-all-btn" onclick="navigate('products')">See All →</button>
      </div>
      <div class="grid">${featured.map(productCardHTML).join('')}</div>`;
  } catch (e) {
    document.getElementById('featured-section').innerHTML = `<div class="section"><p style="color:#ef4444">Failed to load products. Is the backend running?</p></div>`;
  }
}

// ===== PRODUCT CARD =====
function productCardHTML(product) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  return `<div class="card">
    <div class="card-emoji">
      ${product.image}
      <span class="discount-badge">${discount}% OFF</span>
    </div>
    <div class="card-body">
      <div class="card-cat">${product.category}</div>
      <div class="card-name">${product.name}</div>
      <div class="card-desc">${product.description}</div>
      <div class="card-unit">${product.unit}</div>
      <div class="card-price-row">
        <div>
          <span class="card-price">₹${product.price}</span>
          <span class="card-orig">₹${product.originalPrice}</span>
        </div>
      </div>
      <button class="add-btn" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&#39;")})'>+ Add to Cart</button>
    </div>
  </div>`;
}

// ===== PRODUCTS PAGE =====
async function renderProducts(main) {
  main.innerHTML = `<div class="section">
    <h2 class="section-title">All Products</h2>
    <div class="search-box" style="max-width:100%;margin-bottom:16px">
      <input type="text" id="prod-search" placeholder="Search products..." value="${state.searchQuery}"
        oninput="state.searchQuery=this.value;filterProducts()">
      <button onclick="filterProducts()">Search</button>
    </div>
    <div class="cats" id="cats-container"><div class="loading"><span class="spinner"></span></div></div>
    <div class="grid" id="products-grid"><div class="loading"><span class="spinner"></span>Loading products...</div></div>
  </div>`;

  try {
    const [categories, products] = await Promise.all([
      api('GET', '/products/categories'),
      api('GET', '/products')
    ]);
    state.allProducts = products;
    state.categories = categories;

    document.getElementById('cats-container').innerHTML = categories.map(cat =>
      `<button class="cat-btn ${state.selectedCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}')">${cat}</button>`
    ).join('');

    renderProductGrid();
  } catch (e) {
    main.innerHTML = `<div class="section"><p style="color:#ef4444">Could not load products. Make sure the backend is running on port 5000.</p></div>`;
  }
}

function selectCategory(cat) {
  state.selectedCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderProductGrid();
}

function filterProducts() {
  renderProductGrid();
}

function renderProductGrid() {
  const filtered = (state.allProducts || []).filter(p => {
    const inCat = state.selectedCategory === 'All' || p.category === state.selectedCategory;
    const inSearch = p.name.toLowerCase().includes(state.searchQuery.toLowerCase());
    return inCat && inSearch;
  });
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = filtered.length ? filtered.map(productCardHTML).join('') :
    `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#6b7280">No products found.</div>`;
}
