package org.example.service;

import org.example.model.Customer;
import org.example.entity.Quote;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendQuoteNotification(Customer customer) {
        if (customer == null || customer.getEmail() == null || customer.getEmail().isBlank()) return;

        String firstName = customer.getFirstName() != null ? customer.getFirstName() : "Customer";
        String email = customer.getEmail();

        // LOG HERE
        System.out.println("📧 Sending quote email to: " + email);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(customer.getEmail());
        message.setSubject("Quote Waiting for You");
        message.setText(
                "Hello " + firstName + ",\n\n" +

                        "A new quote has been prepared for you.\n" +
                        "Please access your dashboard using the link below:\n\n" +

                        "🔐 Existing customer (Login):\n" +
                        "http://localhost:5173/login\n\n" +

                        "🆕 New customer (Register):\n" +
                        "http://localhost:5173/register\n\n" +

                        "After logging in, you will be able to view and manage your quote.\n\n" +

                        "Thank you.\n\n"  +
                        "SJY Telecom Team"
        );

        mailSender.send(message);
    }
}