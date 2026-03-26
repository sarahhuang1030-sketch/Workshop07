CREATE TABLE quotes (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        customer_id INT,
                        amount DOUBLE,
                        status VARCHAR(50),
                        created_at DATETIME
);