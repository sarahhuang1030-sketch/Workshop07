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
import org.example.entity.PaymentAccounts;
import org.example.repository.PaymentAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class StripePaymentService {

    @Value("${stripe.secret.key}")
    private String stripeKey;

    private final PaymentAccountRepository paymentAccountRepository;

    // ✅ FIX: constructor injection
    public StripePaymentService(PaymentAccountRepository paymentAccountRepository) {
        this.paymentAccountRepository = paymentAccountRepository;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeKey;
    }

    // ================= SAVE TO DB =================
    public PaymentAccounts savePaymentAccount(
            Integer customerId,
            String paymentMethodId,
            String brand,
            String last4,
            Integer expiryMonth,
            Integer expiryYear,
            String holderName
    ) {

        PaymentAccounts account = new PaymentAccounts();
        account.setCustomerId(customerId);
        account.setStripePaymentMethodId(paymentMethodId);
        account.setMethod(brand);
        account.setLast4(last4);
        account.setExpiryMonth(expiryMonth);
        account.setExpiryYear(expiryYear);
        account.setHolderName(holderName);
        account.setCreatedAt(LocalDateTime.now());
        account.setIsDefault(0);

        return paymentAccountRepository.save(account);
    }

    // ================= CREATE PAYMENT =================
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

    public PaymentIntent createPaymentIntent(Long amount, String paymentMethodId) throws StripeException {
        return PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("cad")
                        .setPaymentMethod(paymentMethodId)
                        .setConfirm(false)
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                        .setEnabled(true)
                                        .build()
                        )
                        .build()
        );
    }

    // ================= STRIPE + DB SAVE (FIXED CORE FLOW) =================
    public PaymentIntent createPaymentIntentWithCustomer(
            Long amount,
            String customerId,
            String paymentMethodId
    ) throws StripeException {

        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);

        // attach to stripe customer
        pm.attach(PaymentMethodAttachParams.builder()
                .setCustomer(customerId)
                .build());

        // create payment intent
        PaymentIntent intent = PaymentIntent.create(
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("cad")
                        .setCustomer(customerId)
                        .setPaymentMethod(paymentMethodId)
                        .setOffSession(true)
                        .setConfirm(true)
                        .build()
        );

        // ================= CRITICAL FIX: SAVE TO DB =================
        savePaymentAccount(
                Integer.valueOf(customerId), // ⚠️ assuming customerId = int in your system
                paymentMethodId,
                pm.getCard().getBrand(),
                pm.getCard().getLast4(),
                pm.getCard().getExpMonth().intValue(),
                pm.getCard().getExpYear().intValue(),
                pm.getBillingDetails() != null ? pm.getBillingDetails().getName() : null
        );

        return intent;
    }

    // ================= RETRIEVE =================
    public PaymentIntent retrievePaymentIntent(String id) throws StripeException {
        return PaymentIntent.retrieve(id);
    }

    // ================= ATTACH =================
    public PaymentMethod attachPaymentMethodToCustomer(String customerId, String paymentMethodId) throws StripeException {

        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);

        if (customerId == null) {
            Customer.create(CustomerCreateParams.builder()
                    .setPaymentMethod(paymentMethodId)
                    .setInvoiceSettings(CustomerCreateParams.InvoiceSettings.builder()
                            .setDefaultPaymentMethod(paymentMethodId)
                            .build())
                    .build());
        } else {
            pm.attach(PaymentMethodAttachParams.builder()
                    .setCustomer(customerId)
                    .build());
        }

        return pm;
    }

    // ================= DEFAULT =================
    public PaymentMethod getDefaultPaymentMethod(String customerId) throws StripeException {

        Customer customer = Customer.retrieve(customerId);

        if (customer.getInvoiceSettings().getDefaultPaymentMethod() == null) {
            return null;
        }

        return PaymentMethod.retrieve(
                customer.getInvoiceSettings().getDefaultPaymentMethod()
        );
    }

    // ================= CREATE CUSTOMER =================
    public String createCustomer(String username) throws StripeException {

        Customer customer = Customer.create(
                CustomerCreateParams.builder()
                        .setName(username)
                        .build()
        );

        return customer.getId();
    }

    // ================= DETACH =================
    public void detachPaymentMethod(String paymentMethodId) throws StripeException {

        PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);
        pm.detach();
    }
}