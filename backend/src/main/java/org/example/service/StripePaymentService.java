package org.example.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentMethodAttachParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StripePaymentService {

    @Value("${stripe.secret.key}")
    private String stripeKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeKey;
    }

    /**
     * Create a simple PaymentIntent (no customer attached)
     */
    public PaymentIntent createPaymentIntent(Long amount) throws StripeException {
        return PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("cad")
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                        .setEnabled(true)
                                        .build()
                        )
                        .build()
        );
    }

    /**
     * Create a PaymentIntent for temporary card (with payment method, but no customer)
     */
    public PaymentIntent createPaymentIntent(Long amount, String paymentMethodId) throws StripeException {
        return PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("cad")
                        .setPaymentMethod(paymentMethodId)
                        .setConfirm(false) // Don't confirm yet
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                        .setEnabled(true)
                                        .build()
                        )
                        .build()
        );
    }

    /**
     * Create and confirm PaymentIntent with existing customer & payment method
     */
    public PaymentIntent createPaymentIntentWithCustomer(
            Long amount,
            String customerId,
            String paymentMethodId
    ) throws StripeException {
        // Attach payment method to customer (if not already attached)
        PaymentMethod.retrieve(paymentMethodId).attach(Map.of("customer", customerId));

        return PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("cad")
                        .setCustomer(customerId)
                        .setPaymentMethod(paymentMethodId)
                        .setOffSession(true)
                        .setConfirm(true)
                        .build()
        );
    }

    /**
     * Retrieve PaymentIntent by ID
     */
    public PaymentIntent retrievePaymentIntent(String id) throws StripeException {
        return PaymentIntent.retrieve(id);
    }

    /**
     * Attach payment method to customer
     * If customer does not exist → create one
     */
    public PaymentMethod attachPaymentMethodToCustomer(String customerId, String paymentMethodId) throws StripeException {
        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);

        if (customerId == null) {
            Customer customer = Customer.create(CustomerCreateParams.builder()
                    .setPaymentMethod(paymentMethodId)
                    .setInvoiceSettings(CustomerCreateParams.InvoiceSettings.builder()
                            .setDefaultPaymentMethod(paymentMethodId)
                            .build())
                    .build());
            return pm;
        } else {
            pm.attach(PaymentMethodAttachParams.builder().setCustomer(customerId).build());
            return pm;
        }
    }

    /**
     * Get customer's default payment method
     */
    public PaymentMethod getDefaultPaymentMethod(String customerId) throws StripeException {
        Customer customer = Customer.retrieve(customerId);

        if (customer.getInvoiceSettings().getDefaultPaymentMethod() == null) {
            return null;
        }

        return PaymentMethod.retrieve(
                customer.getInvoiceSettings().getDefaultPaymentMethod()
        );
    }

    /**
     * Create a new Stripe customer with username/email
     */
    public String createCustomer(String username) throws StripeException {
        Customer customer = Customer.create(CustomerCreateParams.builder()
                .setName(username)
                .build());
        return customer.getId();
    }

    /**
     * Detach a payment method from Stripe customer
     */
    public void detachPaymentMethod(String paymentMethodId) throws StripeException {
        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);
        pm.detach();
    }
}