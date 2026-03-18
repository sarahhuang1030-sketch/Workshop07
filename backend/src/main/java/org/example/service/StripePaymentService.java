//package org.example.service;
//
//import com.stripe.Stripe;
//import com.stripe.model.Customer;
//import com.stripe.model.PaymentIntent;
//import com.stripe.model.PaymentMethod;
//import com.stripe.param.CustomerCreateParams;
//import com.stripe.param.PaymentIntentCreateParams;
//import com.stripe.param.PaymentMethodAttachParams;
//import jakarta.annotation.PostConstruct;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//
//@Service
//public class StripePaymentService {
//
//    @Value("${stripe.secret.key}")
//    private String stripeKey;
//
//    @PostConstruct
//    public void init() {
//        Stripe.apiKey = stripeKey;
//    }
//
//    /**
//     * Create a new Stripe customer with the user's email/username
//     */
//    public Customer createStripeCustomer(String username) throws Exception {
//        CustomerCreateParams params = CustomerCreateParams.builder()
//                .setName(username)
//                .build();
//        return Customer.create(params);
//    }
//
//    /**
//     * Attach a PaymentMethod to a Stripe customer
//     */
//    public PaymentMethod attachPaymentMethodToCustomer(String stripeCustomerId, String paymentMethodId) throws Exception {
//        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);
//        pm.attach(PaymentMethodAttachParams.builder()
//                .setCustomer(stripeCustomerId)
//                .build());
//        return pm;
//    }
//
//    /**
//     * Create PaymentIntent WITHOUT confirming
//     * Frontend confirms with Stripe.js
//     */
//    public PaymentIntent createPaymentIntent(Long amount) throws Exception {
//        return PaymentIntent.create(PaymentIntentCreateParams.builder()
//                .setAmount(amount)
//                .setCurrency("cad")
//                .build());
//    }
//
//    /**
//     * Create PaymentIntent for an existing Stripe customer and payment method
//     */
//    public PaymentIntent createPaymentIntentWithCustomer(Long amount, String stripeCustomerId, String paymentMethodId) throws Exception {
//        return PaymentIntent.create(PaymentIntentCreateParams.builder()
//                .setAmount(amount)
//                .setCurrency("cad")
//                .setCustomer(stripeCustomerId)
//                .setPaymentMethod(paymentMethodId)
//                .build());
//    }
//
//    /**
//     * Retrieve a PaymentIntent from Stripe
//     */
//    public PaymentIntent retrievePaymentIntent(String paymentIntentId) throws Exception {
//        return PaymentIntent.retrieve(paymentIntentId);
//    }
//}

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
    public PaymentIntent createPaymentIntent(Long amount) throws Exception {
        return PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("cad")
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods
                                        .builder()
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
    ) throws Exception {

        // Attach payment method to customer (if not already)
        PaymentMethod.retrieve(paymentMethodId)
                .attach(Map.of("customer", customerId));

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
    public PaymentIntent retrievePaymentIntent(String id) throws Exception {
        return PaymentIntent.retrieve(id);
    }

    /**
     * Attach payment method to customer
     * If customer does not exist → create one
     */
    public PaymentMethod attachPaymentMethodToCustomer(String customerId, String paymentMethodId) throws Exception {
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
    public PaymentMethod getDefaultPaymentMethod(String customerId) throws Exception {
        Customer customer = Customer.retrieve(customerId);

        if (customer.getInvoiceSettings().getDefaultPaymentMethod() == null) {
            return null;
        }

        return PaymentMethod.retrieve(
                customer.getInvoiceSettings().getDefaultPaymentMethod()
        );
    }
}