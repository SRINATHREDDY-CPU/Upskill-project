// ===== ADMIN PANEL =====
let adminTab = 'dashboard';

async function renderAdmin(main) {
  if (!state.user || state.user.role !== 'admin') {
    main.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><h2>Access denied</h2></div>`; return;
  }
  const tabs = [['dashboard','📊 Dashboard'],['orders','📦 Orders'],['users','👥 Users'],['coupons','🎟️ Coupons'],['delivery','🚴 Delivery Boys']];
  main.innerHTML = `<div class="admin-layout">
    <div class="admin-sidebar">
      <div class="admin-sidebar-title">⚙️ Admin Panel</div>
      ${tabs.map(([id,label]) => `<div class="admin-side-item ${adminTab===id?'active':''}" onclick="switchAdminTab('${id}')">${label}</div>`).join('')}
    </div>
    <div class="admin-content" id="admin-content">
      <div class="loading"><span class="spinner"></span>Loading...</div>
    </div>
  </div>`;
  loadAdminTab();
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-side-item').forEach((el, i) => {
    el.classList.toggle('active', el.textContent.includes(tab) || el.getAttribute('onclick') === `switchAdminTab('${tab}')`);
  });
  // re-highlight properly
  document.querySelectorAll('.admin-side-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick') === `switchAdminTab('${tab}')`);
  });
  loadAdminTab();
}

async function loadAdminTab() {
  const c = document.getElementById('admin-content');
  c.innerHTML = `<div class="loading"><span class="spinner"></span>Loading...</div>`;
  try {
    if (adminTab === 'dashboard') await renderAdminDashboard(c);
    else if (adminTab === 'orders') await renderAdminOrders(c);
    else if (adminTab === 'users') await renderAdminUsers(c);
    else if (adminTab === 'coupons') await renderAdminCoupons(c);
    else if (adminTab === 'delivery') await renderAdminDelivery(c);
  } catch (e) {
    c.innerHTML = `<p style="color:#ef4444">Error: ${e.message}</p>`;
  }
}

async function renderAdminDashboard(c) {
  const [stats, orders] = await Promise.all([api('GET','/admin/stats'), api('GET','/orders')]);
  c.innerHTML = `
    <h2 style="font-size:22px;font-weight:800;margin-bottom:20px">Dashboard Overview</h2>
    <div class="stat-grid">
      ${[['₹'+stats.totalRevenue.toLocaleString(),'Total Revenue'],[stats.totalOrders,'Total Orders'],[stats.totalCustomers,'Customers']].map(([n,l]) =>
        `<div class="stat-card"><div class="stat-num">${n}</div><div class="stat-label">${l}</div></div>`).join('')}
    </div>
    <h3 style="font-size:16px;font-weight:700;margin-bottom:12px">Recent Orders</h3>
    <table>
      <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
      <tbody>${orders.slice(0,5).map(o => `<tr>
        <td>${o.orderId}</td><td>${o.userName}</td><td style="font-weight:700;color:#7c3aed">₹${o.total}</td>
        <td><span class="status-badge ${o.status==='Delivered'?'status-delivered':'status-active'}">${o.status}</span></td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
        <td>${o.statusIndex < 4 ? `<button style="background:#7c3aed;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px" onclick="advanceOrderStatus('${o.orderId}')">Advance →</button>` : '—'}</td>
      </tr>`).join('')}</tbody>
    </table>`;
}

async function renderAdminOrders(c) {
  const orders = await api('GET','/orders');
  c.innerHTML = `
    <h2 style="font-size:22px;font-weight:800;margin-bottom:20px">All Orders (${orders.length})</h2>
    <table>
      <thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Delivery Boy</th><th>Status</th><th>Rating</th><th>Action</th></tr></thead>
      <tbody>${orders.map(o => `<tr>
        <td>${o.orderId}</td>
        <td><div style="font-weight:600">${o.userName}</div><div style="font-size:12px;color:#6b7280">${o.userEmail}</div></td>
        <td>${o.userPhone||'—'}</td>
        <td>${o.items.length} items</td>
        <td style="font-weight:700;color:#7c3aed">₹${o.total}</td>
        <td>${o.deliveryBoy.name}</td>
        <td><span class="status-badge ${o.status==='Delivered'?'status-delivered':'status-active'}">${o.status}</span></td>
        <td>${o.rating ? `⭐ ${o.rating}/5` : '—'}</td>
        <td>${o.statusIndex < 4 ? `<button style="background:#7c3aed;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px" onclick="advanceOrderStatus('${o.orderId}')">Next →</button>` : '—'}</td>
      </tr>`).join('')}</tbody>
    </table>`;
}

async function renderAdminUsers(c) {
  const users = await api('GET','/admin/users');
  const orders = await api('GET','/orders');
  c.innerHTML = `
    <h2 style="font-size:22px;font-weight:800;margin-bottom:20px">All Users (${users.filter(u=>u.role==='user').length} customers)</h2>
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Orders</th></tr></thead>
      <tbody>${users.map(u => `<tr>
        <td style="font-weight:600">${u.name}</td>
        <td>${u.email}</td><td>${u.phone||'—'}</td>
        <td><span style="background:${u.role==='admin'?'#fef3c7':'#f3e8ff'};color:${u.role==='admin'?'#92400e':'#7c3aed'};padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700">${u.role}</span></td>
        <td>${new Date(u.joined||u.createdAt).toLocaleDateString('en-IN')}</td>
        <td>${orders.filter(o=>o.userEmail===u.email).length}</td>
      </tr>`).join('')}</tbody>
    </table>`;
}

async function renderAdminCoupons(c) {
  const coupons = await api('GET','/coupons');
  c.innerHTML = `
    <h2 style="font-size:22px;font-weight:800;margin-bottom:20px">Coupon Management</h2>
    <div class="coupon-form">
      <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">🎟️ Generate New Coupon</h3>
      <div class="coupon-form-grid">
        <div>
          <label>Coupon Code</label>
          <div style="display:flex;gap:6px">
            <input type="text" id="c-code" placeholder="e.g. SAVE20" style="flex:1" oninput="this.value=this.value.toUpperCase()">
            <button class="gen-btn" onclick="genCouponCode()" title="Generate random">🎲</button>
          </div>
        </div>
        <div><label>Discount Value</label><input type="number" id="c-discount" placeholder="e.g. 20"></div>
        <div><label>Type</label><select id="c-type"><option value="percent">Percent (%)</option><option value="flat">Flat (₹)</option></select></div>
        <div><label>Min Order (₹)</label><input type="number" id="c-minorder" placeholder="e.g. 200"></div>
      </div>
      <button class="btn-primary btn-auto" onclick="createCoupon()">➕ Create Coupon</button>
    </div>
    <table>
      <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Used</th><th>Status</th><th>Toggle</th></tr></thead>
      <tbody>${coupons.map(c => `<tr>
        <td><span style="font-weight:800;font-size:15px;color:#7c3aed;font-family:monospace">${c.code}</span></td>
        <td>${c.discount}${c.type==='percent'?'%':'₹'} off</td>
        <td>₹${c.minOrder}+</td>
        <td>${c.used} times</td>
        <td><span class="status-badge ${c.active?'status-delivered':'status-active'}">${c.active?'Active':'Inactive'}</span></td>
        <td><button class="${c.active?'toggle-active':'toggle-inactive'}" onclick="toggleCoupon('${c._id}')">${c.active?'Deactivate':'Activate'}</button></td>
      </tr>`).join('')}</tbody>
    </table>`;
}

function genCouponCode() {
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code='GROSHOP';
  for(let i=0;i<4;i++) code+=chars[Math.floor(Math.random()*chars.length)];
  document.getElementById('c-code').value=code;
}

async function createCoupon() {
  const code=document.getElementById('c-code').value;
  const discount=document.getElementById('c-discount').value;
  const type=document.getElementById('c-type').value;
  const minOrder=document.getElementById('c-minorder').value;
  if(!code||!discount||!minOrder){showNotification('Please fill all fields','error');return;}
  try {
    await api('POST','/coupons',{code,discount:Number(discount),type,minOrder:Number(minOrder)});
    showNotification('Coupon created!');
    loadAdminTab();
  } catch(e){showNotification(e.message,'error');}
}

async function toggleCoupon(id) {
  try { await api('PUT',`/coupons/${id}/toggle`); loadAdminTab(); } catch(e){showNotification(e.message,'error');}
}

async function advanceOrderStatus(orderId) {
  try { await api('PUT',`/orders/${orderId}/status`); showNotification('Order status updated!'); loadAdminTab(); } catch(e){showNotification(e.message,'error');}
}

async function renderAdminDelivery(c) {
  const orders = await api('GET','/orders');
  const DELIVERY_BOYS = [
    {id:1,name:'Ravi Kumar',phone:'+91 98765 43210',rating:4.8,avatar:'RK'},
    {id:2,name:'Suresh Yadav',phone:'+91 87654 32109',rating:4.6,avatar:'SY'},
    {id:3,name:'Arjun Reddy',phone:'+91 76543 21098',rating:4.9,avatar:'AR'}
  ];
  c.innerHTML = `
    <h2 style="font-size:22px;font-weight:800;margin-bottom:20px">Delivery Team</h2>
    <div class="delivery-grid">
      ${DELIVERY_BOYS.map(db => {
        const assigned = orders.filter(o => o.deliveryBoy.id === db.id);
        const delivered = assigned.filter(o => o.status === 'Delivered').length;
        return `<div class="delivery-card">
          <div style="display:flex;gap:14px;margin-bottom:16px">
            <div class="avatar" style="width:56px;height:56px;font-size:18px">${db.avatar}</div>
            <div>
              <div style="font-size:16px;font-weight:700">${db.name}</div>
              <a href="tel:${db.phone}" style="font-size:14px;color:#7c3aed">${db.phone}</a>
              <div style="font-size:13px;color:#6b7280;margin-top:2px">⭐ ${db.rating} Rating</div>
            </div>
          </div>
          <div class="delivery-stats">
            ${[['Total Assigned',assigned.length],['Delivered',delivered],['In Progress',assigned.length-delivered],['Success Rate',assigned.length?Math.round(delivered/assigned.length*100)+'%':'N/A']].map(([l,v]) =>
              `<div class="delivery-stat"><div class="delivery-stat-num">${v}</div><div class="delivery-stat-label">${l}</div></div>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}
