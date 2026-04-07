package org.example.service;

import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import org.example.entity.Invoices;
import org.example.entity.PaymentAccounts;
import org.example.repository.InvoiceRepository;
import org.example.repository.PaymentAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Stripe payment confirmation service
 * Creates PaymentAccounts and binds to Invoice
 */
@Service
public class PaymentService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentAccountRepository paymentAccountRepository;

    public PaymentService(
            InvoiceRepository invoiceRepository,
            PaymentAccountRepository paymentAccountRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentAccountRepository = paymentAccountRepository;
    }

    @Transactional
    public void confirmPayment(String paymentIntentId,
                               String invoiceNumber,
                               Integer customerId) throws Exception {

        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);

        if (!"succeeded".equals(intent.getStatus())) {
            throw new Exception("Payment not completed");
        }

        PaymentMethod pm = PaymentMethod.retrieve(intent.getPaymentMethod());

        // 1. create account
        PaymentAccounts account = new PaymentAccounts();
        account.setCustomerId(customerId);
        account.setStripePaymentMethodId(pm.getId());

        if (pm.getCard() != null) {
            account.setMethod(pm.getCard().getBrand());
            account.setLast4(pm.getCard().getLast4());
            account.setExpiryMonth(pm.getCard().getExpMonth().intValue());
            account.setExpiryYear(pm.getCard().getExpYear().intValue());
        }

        PaymentAccounts savedAccount = paymentAccountRepository.save(account);

        // 2. IMPORTANT: reload invoice as managed entity
        Invoices invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber);

        if (invoice == null) {
            throw new RuntimeException("Invoice not found");
        }

        // 3. bind payment account
        invoice.setPaidByAccount(savedAccount);
        // use status
        invoice.setStatus("PAID");

        invoice.setStripePaymentIntentId(paymentIntentId);

        invoiceRepository.save(invoice);
    }
}