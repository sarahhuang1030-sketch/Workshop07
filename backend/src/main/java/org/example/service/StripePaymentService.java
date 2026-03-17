package org.example.service;

import com.stripe.Stripe;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentMethodAttachParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripePaymentService {

    @Value("${stripe.secret.key}")
    private String stripeKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeKey;
    }

    /**
     * Create a new Stripe customer with the user's email/username
     */
    public Customer createStripeCustomer(String username) throws Exception {
        CustomerCreateParams params = CustomerCreateParams.builder()
                .setName(username)
                .build();
        return Customer.create(params);
    }

    /**
     * Attach a PaymentMethod to a Stripe customer
     */
    public PaymentMethod attachPaymentMethodToCustomer(String stripeCustomerId, String paymentMethodId) throws Exception {
        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);
        pm.attach(PaymentMethodAttachParams.builder()
                .setCustomer(stripeCustomerId)
                .build());
        return pm;
    }

    /**
     * Create PaymentIntent WITHOUT confirming
     * Frontend confirms with Stripe.js
     */
    public PaymentIntent createPaymentIntent(Long amount) throws Exception {
        return PaymentIntent.create(PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency("cad")
                .build());
    }

    /**
     * Create PaymentIntent for an existing Stripe customer and payment method
     */
    public PaymentIntent createPaymentIntentWithCustomer(Long amount, String stripeCustomerId, String paymentMethodId) throws Exception {
        return PaymentIntent.create(PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency("cad")
                .setCustomer(stripeCustomerId)
                .setPaymentMethod(paymentMethodId)
                .build());
    }

    /**
     * Retrieve a PaymentIntent from Stripe
     */
    public PaymentIntent retrievePaymentIntent(String paymentIntentId) throws Exception {
        return PaymentIntent.retrieve(paymentIntentId);
    }
}