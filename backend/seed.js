require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');

const products = [
  { name: "Fresh Red Apples", category: "Fruits", price: 120, originalPrice: 150, image: "🍎", unit: "1 kg", stock: 50, description: "Crisp and juicy red apples, freshly harvested." },
  { name: "Organic Bananas", category: "Fruits", price: 60, originalPrice: 80, image: "🍌", unit: "Dozen", stock: 40, description: "Sweet and ripe organic bananas." },
  { name: "Orange Bundle", category: "Fruits", price: 90, originalPrice: 110, image: "🍊", unit: "1 kg", stock: 35, description: "Juicy Nagpur oranges rich in Vitamin C." },
  { name: "Fresh Mango", category: "Fruits", price: 180, originalPrice: 220, image: "🥭", unit: "1 kg", stock: 25, description: "Alphonso mangoes – the king of fruits." },
  { name: "Watermelon", category: "Fruits", price: 50, originalPrice: 65, image: "🍉", unit: "Per piece", stock: 20, description: "Chilled summer watermelon." },
  { name: "Tomatoes", category: "Vegetables", price: 40, originalPrice: 55, image: "🍅", unit: "500g", stock: 60, description: "Farm-fresh ripe tomatoes." },
  { name: "Onions", category: "Vegetables", price: 30, originalPrice: 45, image: "🧅", unit: "1 kg", stock: 80, description: "Red onions with a pungent flavour." },
  { name: "Potatoes", category: "Vegetables", price: 35, originalPrice: 50, image: "🥔", unit: "1 kg", stock: 90, description: "Clean and sorted farm potatoes." },
  { name: "Green Broccoli", category: "Vegetables", price: 80, originalPrice: 100, image: "🥦", unit: "500g", stock: 30, description: "Organic broccoli loaded with nutrients." },
  { name: "Carrots", category: "Vegetables", price: 45, originalPrice: 60, image: "🥕", unit: "500g", stock: 55, description: "Crunchy and sweet farm carrots." },
  { name: "Full Cream Milk", category: "Dairy", price: 68, originalPrice: 75, image: "🥛", unit: "1 Litre", stock: 100, description: "Pure cow milk – pasteurised and packaged." },
  { name: "Paneer", category: "Dairy", price: 120, originalPrice: 140, image: "🧀", unit: "200g", stock: 40, description: "Fresh home-style paneer." },
  { name: "Butter", category: "Dairy", price: 55, originalPrice: 65, image: "🧈", unit: "100g", stock: 60, description: "Amul-style salted butter." },
  { name: "Greek Yogurt", category: "Dairy", price: 90, originalPrice: 110, image: "🍦", unit: "400g", stock: 45, description: "Thick and creamy Greek yogurt." },
  { name: "Bread Loaf", category: "Bakery", price: 45, originalPrice: 55, image: "🍞", unit: "400g", stock: 70, description: "Soft whole wheat bread loaf." },
  { name: "Croissant Pack", category: "Bakery", price: 120, originalPrice: 140, image: "🥐", unit: "4 pcs", stock: 30, description: "Buttery flaky croissants baked fresh." },
  { name: "Basmati Rice", category: "Grains", price: 180, originalPrice: 210, image: "🌾", unit: "1 kg", stock: 80, description: "Long-grain premium Basmati rice." },
  { name: "Toor Dal", category: "Grains", price: 140, originalPrice: 160, image: "🫘", unit: "500g", stock: 75, description: "Clean and sorted yellow toor dal." },
  { name: "Chicken Breast", category: "Meat", price: 280, originalPrice: 320, image: "🍗", unit: "500g", stock: 25, description: "Boneless skinless chicken breast." },
  { name: "Eggs (12)", category: "Eggs", price: 90, originalPrice: 105, image: "🥚", unit: "12 pcs", stock: 80, description: "Farm-fresh brown eggs." },
  { name: "Mango Juice", category: "Beverages", price: 75, originalPrice: 90, image: "🧃", unit: "1 Litre", stock: 60, description: "100% natural mango juice." },
  { name: "Green Tea", category: "Beverages", price: 150, originalPrice: 180, image: "🍵", unit: "25 bags", stock: 50, description: "Himalayan organic green tea bags." },
  { name: "Olive Oil", category: "Pantry", price: 450, originalPrice: 520, image: "🫒", unit: "500ml", stock: 30, description: "Extra virgin cold-pressed olive oil." },
  { name: "Honey", category: "Pantry", price: 280, originalPrice: 330, image: "🍯", unit: "500g", stock: 40, description: "Pure forest honey, no added sugar." }
];

const coupons = [
  { code: 'FIRST10', discount: 10, type: 'percent', minOrder: 100, used: 0, active: true },
  { code: 'SAVE50', discount: 50, type: 'flat', minOrder: 300, used: 3, active: true },
  { code: 'FRESH20', discount: 20, type: 'percent', minOrder: 200, used: 1, active: true }
];

async function seed() {
  await connectDB();
  await User.deleteMany();
  await Product.deleteMany();
  await Coupon.deleteMany();

  // Create admin
  await User.create({ name: 'Admin User', email: 'admin@groshop.com', password: 'admin123', role: 'admin', phone: '+91 99999 00000' });
  await User.create({ name: 'Priya Sharma', email: 'priya@example.com', password: 'user123', role: 'user', phone: '+91 98765 11111' });
  await User.create({ name: 'Rahul Singh', email: 'rahul@example.com', password: 'user123', role: 'user', phone: '+91 87654 22222' });

  await Product.insertMany(products);
  await Coupon.insertMany(coupons);

  console.log('✅ Database seeded successfully!');
  console.log('Admin: admin@groshop.com / admin123');
  console.log('User:  priya@example.com / user123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
