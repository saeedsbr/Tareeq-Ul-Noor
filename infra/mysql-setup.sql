-- Run once as a MySQL admin (e.g. `mysql -u root -p < infra/mysql-setup.sql`). Change the password first.
CREATE DATABASE IF NOT EXISTS ilmpath CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'ilmpath'@'localhost' IDENTIFIED BY 'change-this-password';
GRANT ALL PRIVILEGES ON ilmpath.* TO 'ilmpath'@'localhost';
FLUSH PRIVILEGES;
