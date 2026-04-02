CREATE TABLE invoice_item_subscribers (
                                          subscriber_id INT AUTO_INCREMENT PRIMARY KEY,
                                          invoice_item_id INT NOT NULL,
                                          line_number INT,
                                          full_name VARCHAR(255),

                                          CONSTRAINT fk_invoice_item
                                              FOREIGN KEY (invoice_item_id)
                                                  REFERENCES invoiceitems(InvoiceItemId)
                                                  ON DELETE CASCADE
);