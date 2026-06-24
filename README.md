# 🛒 GroShop – Full Stack Grocery Delivery App

A full-stack grocery delivery web application built with:
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)

---

## 📁 Project Structure

```
groshop/
├── frontend/               # Static HTML/CSS/JS
│   ├── index.html          # Main entry point
│   ├── css/
│   │   └── style.css       # All styles
│   └── js/
│       ├── app.js          # State, API helper, navbar, routing
│       ├── pages.js        # Home & Products pages
│       ├── cart-auth-orders.js  # Cart, Auth, Orders, Tracking
│       └── admin.js        # Admin panel
│
└── backend/                # Express API server
    ├── server.js           # Entry point
    ├── seed.js             # Database seeder
    ├── .env                # Environment variables
    ├── package.json
    ├── config/
    │   └── db.js           # MongoDB connection
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   ├── Order.js
    │   └── Coupon.js
    ├── routes/
    │   ├── auth.js
    │   ├── products.js
    │   ├── orders.js
    │   ├── coupons.js
    │   └── admin.js
    └── middleware/
        └── auth.js         # JWT auth middleware
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (running locally on port 27017)

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure `.env` if needed (defaults work for local MongoDB):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/groshop
JWT_SECRET=groshop_jwt_secret_key_2025
```

Seed the database with products, coupons, and demo users:
```bash
node seed.js
```

Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server runs at: `http://localhost:5000`

---

### 2. Frontend Setup

No build step needed! Just open `frontend/index.html` in a browser.

For best results, serve it with a simple HTTP server:
```bash
# Using Node.js
npx serve frontend

# Using Python
cd frontend && python -m http.server 3000
```

Open: `http://localhost:3000`

---

## 🔑 Demo Accounts

| Role  | Email                   | Password  |
|-------|-------------------------|-----------|
| Admin | admin@groshop.com       | admin123  |
| User  | priya@example.com       | user123   |

---

## 🎟️ Demo Coupons

| Code     | Discount | Min Order |
|----------|----------|-----------|
| FIRST10  | 10% off  | ₹100      |
| SAVE50   | ₹50 off  | ₹300      |
| FRESH20  | 20% off  | ₹200      |

---

## ✨ Features

- **User auth** — Register, Login, JWT sessions
- **Product catalog** — 24 products across 9 categories, search & filter
- **Shopping cart** — Add, update qty, remove items
- **Coupon system** — Apply discount codes at checkout
- **Order placement** — With delivery address
- **Order tracking** — Real-time status progress tracker
- **Order rating** — Star rating + review after delivery
- **Admin panel**
  - Dashboard with revenue stats
  - Manage all orders + advance status
  - View all users
  - Create/toggle coupons
  - Delivery boy stats

---

## 🌐 API Endpoints

| Method | Path                       | Description           | Auth     |
|--------|----------------------------|-----------------------|----------|
| POST   | /api/auth/register         | Register user         | Public   |
| POST   | /api/auth/login            | Login                 | Public   |
| GET    | /api/products              | List products         | Public   |
| GET    | /api/products/categories   | List categories       | Public   |
| POST   | /api/orders                | Place order           | User     |
| GET    | /api/orders/my             | My orders             | User     |
| GET    | /api/orders/:id            | Order details         | User     |
| PUT    | /api/orders/:id/rate       | Rate order            | User     |
| POST   | /api/coupons/validate      | Validate coupon       | User     |
| GET    | /api/orders                | All orders            | Admin    |
| PUT    | /api/orders/:id/status     | Advance order status  | Admin    |
| GET    | /api/coupons               | All coupons           | Admin    |
| POST   | /api/coupons               | Create coupon         | Admin    |
| PUT    | /api/coupons/:id/toggle    | Toggle coupon         | Admin    |
| GET    | /api/admin/users           | All users             | Admin    |
| GET    | /api/admin/stats           | Dashboard stats       | Admin    |
