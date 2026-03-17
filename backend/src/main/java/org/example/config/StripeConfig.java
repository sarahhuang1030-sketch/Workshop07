package org.example.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    @PostConstruct
    public void init() {
        Stripe.apiKey = "sk_test_51T6jBuLr4XDHMXI1xtzGW4JIHZ3c7EcKxuHH8q8ziGOwaXWFqcl6GL0qSKqEBseKfQ6narH0VoYjQFuYC83b9wTm00d55JZG0y";
    }
}