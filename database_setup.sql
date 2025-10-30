-- Order Management Database Setup
-- Run this script in your PostgreSQL editor to create the database schema

-- Create database (run this separately if needed)
-- CREATE DATABASE order_management_db;

-- Connect to the database
-- \c order_management_db;

-- Create enums
CREATE TYPE order_status AS ENUM (
    'PENDING',
    'CONFIRMED', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE fulfillment_status AS ENUM (
    'UNFULFILLED',
    'FULFILLED',
    'PARTIALLY_FULFILLED',
    'CANCELLED'
);

CREATE TYPE shipment_status AS ENUM (
    'PENDING',
    'SHIPPED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'RETURNED'
);

CREATE TYPE return_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PROCESSED',
    'CANCELLED'
);

CREATE TYPE refund_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);

-- Create orders table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    status order_status DEFAULT 'PENDING',
    payment_status payment_status DEFAULT 'PENDING',
    fulfillment_status fulfillment_status DEFAULT 'UNFULFILLED',
    total_amount DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status payment_status DEFAULT 'PENDING',
    gateway_response JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create shipments table
CREATE TABLE shipments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) UNIQUE,
    carrier VARCHAR(100) NOT NULL,
    service_type VARCHAR(100),
    status shipment_status DEFAULT 'PENDING',
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    estimated_delivery TIMESTAMP,
    tracking_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create returns table
CREATE TABLE returns (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status return_status DEFAULT 'PENDING',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    processed_at TIMESTAMP,
    refund_amount DECIMAL(12,2),
    notes TEXT
);

-- Create refunds table
CREATE TABLE refunds (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status refund_status DEFAULT 'PENDING',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Orders table indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items table indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(sku);

-- Payments table indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Shipments table indexes
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_carrier ON shipments(carrier);

-- Returns table indexes
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_return_number ON returns(return_number);

-- Refunds table indexes
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for orders table
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO orders (
    order_number, user_id, status, payment_status, fulfillment_status,
    total_amount, subtotal, tax_amount, shipping_amount, discount_amount,
    currency, shipping_address, billing_address, notes
) VALUES (
    'ORD-2024-001', 1, 'COMPLETED', 'COMPLETED', 'FULFILLED',
    2999.00, 2499.00, 449.82, 50.18, 0,
    'INR', 
    '{"firstName": "John", "lastName": "Doe", "address1": "123 Main Street", "city": "Mumbai", "state": "Maharashtra", "postalCode": "400001", "country": "India", "phone": "+91-9876543210", "email": "john.doe@example.com"}',
    '{"firstName": "John", "lastName": "Doe", "address1": "123 Main Street", "city": "Mumbai", "state": "Maharashtra", "postalCode": "400001", "country": "India", "phone": "+91-9876543210", "email": "john.doe@example.com"}',
    'Please handle with care'
);

-- Insert sample order items
INSERT INTO order_items (
    order_id, product_id, variant_id, sku, name, description,
    quantity, unit_price, total_price, tax_rate, metadata
) VALUES 
(1, 'PROD-001', 'VAR-001-RED-M', 'TSHIRT-RED-M', 'Premium Cotton T-Shirt', '100% cotton, comfortable fit', 2, 999.00, 1998.00, 18.0, '{"color": "Red", "size": "M", "material": "Cotton"}'),
(1, 'PROD-002', 'VAR-002-BLUE-L', 'JEANS-BLUE-L', 'Classic Blue Jeans', 'Denim jeans with modern fit', 1, 1999.00, 1999.00, 18.0, '{"color": "Blue", "size": "L", "material": "Denim"}');

-- Insert sample payment
INSERT INTO payments (
    order_id, payment_method, payment_gateway, transaction_id,
    amount, currency, status, gateway_response, processed_at
) VALUES (
    1, 'credit_card', 'razorpay', 'txn_1234567890',
    2999.00, 'INR', 'COMPLETED',
    '{"payment_id": "pay_1234567890", "status": "captured", "method": "card", "card_id": "card_1234567890"}',
    NOW()
);

-- Insert sample shipment
INSERT INTO shipments (
    order_id, tracking_number, carrier, service_type, status,
    shipped_at, delivered_at, estimated_delivery, tracking_url
) VALUES (
    1, 'BD1234567890', 'Blue Dart', 'Express', 'DELIVERED',
    '2024-01-15 10:30:00', '2024-01-17 14:20:00', '2024-01-18 18:00:00',
    'https://www.bluedart.com/track/BD1234567890'
);

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;

-- Show table information
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
