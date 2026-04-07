CREATE TABLE phones (
    phone_id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    storage VARCHAR(50) NOT NULL,
    color VARCHAR(100) NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    full_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);