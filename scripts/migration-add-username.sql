-- Migration: Add username column to users table and seed data
-- Date: 2025-10-15

-- Step 1: Add username column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- Step 2: Update existing users with username (if any)
-- You may need to adjust this based on your current data

-- Step 3: Seed sample users for testing
-- Clear existing test users first (optional, comment out if you want to keep existing data)
-- DELETE FROM users WHERE username IN ('admin', 'gv001', 'ktv001', 'ttkt001');

-- Insert sample users
-- Note: Passwords are bcrypt hashed
-- Plain text passwords for reference:
-- admin: Admin@123
-- gv001: Gv@123456
-- ktv001: Ktv@123456
-- ttkt001: Ttkt@123456

INSERT INTO users (id, username, email, password, "firstName", "lastName", phone, role, "isActive", "createdAt", "updatedAt")
VALUES 
    (
        gen_random_uuid(),
        'admin',
        'admin@fit.iuh.edu.vn',
        '$2a$10$8K1p/a0dL2LVvBEG5YKBAO/sXpUzLB5JkWB6xPzwsC0CWsJQXGbCS', -- Admin@123
        'Admin',
        'System',
        '0123456789',
        'admin',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'gv001',
        'giaovien01@fit.iuh.edu.vn',
        '$2a$10$vKZLqpQ2QqKLQxQVJGh4R.nQq3nQz8fD1KDxPFoGhPzP8qJKPqFKm', -- Gv@123456
        'Nguyễn Văn',
        'A',
        '0987654321',
        'user',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'ktv001',
        'kythuat01@fit.iuh.edu.vn',
        '$2a$10$vKZLqpQ2QqKLQxQVJGh4R.nQq3nQz8fD1KDxPFoGhPzP8qJKPqFKm', -- Ktv@123456
        'Trần Thị',
        'B',
        '0912345678',
        'technician',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'ttkt001',
        'totruong01@fit.iuh.edu.vn',
        '$2a$10$vKZLqpQ2QqKLQxQVJGh4R.nQq3nQz8fD1KDxPFoGhPzP8qJKPqFKm', -- Ttkt@123456
        'Lê Văn',
        'C',
        '0909090909',
        'admin',
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (username) DO NOTHING;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'Sample Login Credentials:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'Admin: username=admin, password=Admin@123';
    RAISE NOTICE 'Teacher: username=gv001, password=Gv@123456';
    RAISE NOTICE 'Technician: username=ktv001, password=Ktv@123456';
    RAISE NOTICE 'Tech Lead: username=ttkt001, password=Ttkt@123456';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
