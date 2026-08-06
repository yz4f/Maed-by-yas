const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'data', 'ta3n.db');
const db = new Database(dbPath);

const spooferId = uuidv4();
const unbanId = uuidv4();

db.prepare("INSERT INTO products (id, name, description, image, category, status) VALUES (?, ?, ?, ?, ?, ?)").run(
  spooferId,
  'سبوفر تـعـن (TA3N Spoofer)',
  'أداة تغيير معرفات الجهاز وتخطي حظر الهاردوير (HWID) بشكل آمن وفوري.',
  'https://images.unsplash.com/photo-1614064641913-6b71a3061283?auto=format&fit=crop&w=1400&q=80',
  'spoofer',
  'active'
);

db.prepare("INSERT INTO products (id, name, description, image, category, status) VALUES (?, ?, ?, ?, ?, ?)").run(
  unbanId,
  'فك باند فورت نايت (Fortnite Unban)',
  'أداة متخصصة لإزالة الحظر من لعبة فورت نايت واستعادة اللعب فوراً.',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
  'unban',
  'active'
);

console.log("تم إضافة المنتجات بنجاح.");
