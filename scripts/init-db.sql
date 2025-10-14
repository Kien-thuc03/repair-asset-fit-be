-- Create database if it doesn't exist
SELECT 'CREATE DATABASE repair_asset_fit'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'repair_asset_fit')\gexec

-- Create user roles
CREATE TYPE user_role AS ENUM ('admin', 'user', 'technician');
CREATE TYPE repair_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('repair_request_created', 'repair_status_updated', 'technician_assigned', 'repair_completed');