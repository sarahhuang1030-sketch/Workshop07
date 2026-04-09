package org.example.service;

import org.example.entity.Quote;
import org.example.model.Customer;

public interface EmailService {
    void sendQuoteNotification(Customer customer);
}