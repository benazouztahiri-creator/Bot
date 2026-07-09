-- ============================================================
-- BUPG Database Schema for PostgreSQL (Neon)
-- Execute this in the Neon SQL Editor before running the app
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK(role IN ('buyer','admin')),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  date_of_birth TEXT DEFAULT '',
  banned SMALLINT NOT NULL DEFAULT 0,
  email_verified SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  order_id TEXT,
  ip_address TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  product_type TEXT NOT NULL CHECK(product_type IN ('account','recharge')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'DZD',
  images TEXT NOT NULL DEFAULT '[]',
  delivery_data TEXT DEFAULT '',
  product_secret_code TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','sold')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_tracking_id TEXT UNIQUE NOT NULL,
  buyer_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  product_type TEXT NOT NULL CHECK(product_type IN ('account','recharge')),
  currency TEXT NOT NULL DEFAULT 'DZD',
  product_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_rate DOUBLE PRECISION NOT NULL DEFAULT 1,
  tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  payment_proof_file TEXT DEFAULT '',
  payment_reviewed_by TEXT REFERENCES users(id),
  order_secret_code TEXT DEFAULT '',
  delivery_data TEXT DEFAULT '',
  delivery_date TIMESTAMPTZ,
  warranty_end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'awaiting_payment_proof' CHECK(status IN (
    'awaiting_payment_proof','payment_under_review','payment_rejected',
    'payment_confirmed_waiting_code','code_verified_deliver_now',
    'delivered','disputed'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  evidence_files TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','resolved_buyer')),
  resolved_by TEXT REFERENCES users(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_chat_messages (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id),
  type TEXT NOT NULL,
  title TEXT DEFAULT '',
  message TEXT NOT NULL,
  icon TEXT DEFAULT '',
  link TEXT DEFAULT '',
  read SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  old_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  new_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  changed_by TEXT NOT NULL REFERENCES users(id),
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);

-- Default admin user (password: admin123)
INSERT INTO users (id, role, email, password_hash, first_name)
VALUES ('usr_admin', 'admin', 'admin@bupg.local', '$2a$10$WzJzQ7w5q5q5q5q5q5q5qu5q5q5q5q5q5q5q5q5q5q5q5q5q5q', 'Admin')
ON CONFLICT (id) DO NOTHING;
