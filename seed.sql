-- PostgreSQL Seed Script for Query Visualizer & Performance Analyzer
-- Generates 100,000 users and 500,000 orders with unindexed foreign keys & status fields

-- Sample Queries to test in psql / pgAdmin / DBeaver:
-- 1. Unindexed Seq Scan:
--    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
--    SELECT COUNT(*), SUM(amount) FROM orders WHERE status = 'PENDING' AND order_date >= '2025-01-01';
--
-- 2. Heavy Join without Foreign Key Index:
--    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
--    SELECT u.username, u.email, o.amount, o.status FROM users u JOIN orders o ON u.id = o.user_id WHERE u.status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT NOW(),
    shipping_address TEXT
);

-- Seed 100,000 Users
INSERT INTO users (username, email, status, created_at)
SELECT 
    'user_' || g AS username,
    'user_' || g || '@example.com' AS email,
    (ARRAY['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])[floor(random() * 4 + 1)] AS status,
    NOW() - (random() * interval '365 days') AS created_at
FROM generate_series(1, 100000) g;

-- Seed 500,000 Orders (Unindexed user_id & status!)
INSERT INTO orders (user_id, amount, status, order_date, shipping_address)
SELECT 
    floor(random() * 100000 + 1)::int AS user_id,
    round((random() * 500 + 10)::numeric, 2) AS amount,
    (ARRAY['COMPLETED', 'PENDING', 'CANCELLED', 'SHIPPED', 'PROCESSING'])[floor(random() * 5 + 1)] AS status,
    NOW() - (random() * interval '180 days') AS order_date,
    g || ' Main Street, Suite ' || floor(random() * 500 + 1) AS shipping_address
FROM generate_series(1, 500000) g;

-- Note: We deliberately DO NOT create indexes on orders(user_id), orders(status), or orders(order_date) 
-- so that PostgreSQL generates high-cost Sequential Scans and Hash Joins.
