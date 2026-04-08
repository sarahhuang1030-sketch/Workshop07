package org.example.service;

import org.example.entity.*;
import org.example.model.UserAccount;
import org.example.repository.*;
import org.example.dto.CheckoutItemDTO;
import com.stripe.model.PaymentIntent;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class CheckoutService {

    private final InvoiceItemSubscriberRepository subscriberRepo;
    private final InvoiceRepository invoiceRepo;
    private final InvoiceItemRepository itemRepo;
    private final PaymentAccountRepository accountRepo;
    private final UserAccountRepository userRepo;
    private final PhoneRepository phoneRepository;
    private final StripePaymentService stripePaymentService;
    private final RewardService rewardService;
    private final PaymentRepository paymentRepo;

    public CheckoutService(
            InvoiceRepository invoiceRepo,
            InvoiceItemRepository itemRepo,
            InvoiceItemSubscriberRepository subscriberRepo,
            PaymentAccountRepository accountRepo,
            UserAccountRepository userRepo,
            PhoneRepository phoneRepository,
            StripePaymentService stripePaymentService,
            RewardService rewardService,
            PaymentRepository paymentRepo
    ) {
        this.invoiceRepo = invoiceRepo;
        this.itemRepo = itemRepo;
        this.subscriberRepo = subscriberRepo;
        this.accountRepo = accountRepo;
        this.userRepo = userRepo;
        this.phoneRepository = phoneRepository;
        this.stripePaymentService = stripePaymentService;
        this.rewardService = rewardService;
        this.paymentRepo = paymentRepo;
    }

    @Transactional
    public Invoices checkout(
            Integer paymentAccountId,
            Double subtotal,
            Double tax,
            Double total,
            String promoCode,
            String billingCycle,
            String paymentIntentId,
            String invoiceNumber,
            List<CheckoutItemDTO> items
    ) throws Exception {

        // 1. Verify Stripe payment success
        PaymentIntent intent = stripePaymentService.retrievePaymentIntent(paymentIntentId);

        if (!"succeeded".equals(intent.getStatus())) {
            throw new Exception("Payment not completed");
        }

        // 2. Get user
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        UserAccount user = userRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new Exception("User not found"));

        // 3. Payment account
        PaymentAccounts account = null;

        if (paymentAccountId != null) {
            account = accountRepo.findById(paymentAccountId)
                    .orElseThrow(() -> new RuntimeException("Payment method not found"));

            // ensure it belongs to current user
            if (!account.getCustomerId().equals(user.getCustomerId())) {
                throw new RuntimeException("Unauthorized payment method");
            }
        }

        // 4. Create or Update invoice
        Invoices invoice = null;
        if (invoiceNumber != null && !invoiceNumber.isEmpty()) {
            invoice = invoiceRepo.findByInvoiceNumber(invoiceNumber);
            if (invoice != null && !invoice.getCustomerId().equals(user.getCustomerId())) {
                throw new Exception("Unauthorized invoice access");
            }
        }

        if (invoice == null) {
            invoice = new Invoices();
            invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
            invoice.setCustomerId(user.getCustomerId());
            invoice.setIssueDate(LocalDate.now());
        }

        LocalDate issueDate = invoice.getIssueDate();
        LocalDate dueDate;

        if ("yearly".equalsIgnoreCase(billingCycle)) {
            dueDate = issueDate.plusYears(1);
        } else {
            dueDate = issueDate.plusMonths(1);
        }

        invoice.setDueDate(dueDate);

        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(tax);
        invoice.setTotal(total);
        invoice.setPromoCode(promoCode);
        invoice.setStatus("PAID");
        invoice.setPaidByAccount(account);
        invoice.setStripePaymentIntentId(paymentIntentId);

        Invoices saved = invoiceRepo.save(invoice);

        // 4b. Create payment record
        Payments payment = new Payments();
        payment.setInvoiceId(saved.getInvoiceId());
        payment.setCustomerId(user.getCustomerId());
        payment.setAmount(BigDecimal.valueOf(total));
        payment.setPaymentDate(java.time.LocalDateTime.now());
        payment.setMethod(account != null ? account.getMethod() : "Stripe");
        payment.setStatus("SUCCESS");
        paymentRepo.save(payment);

        // reward points
        rewardService.addPointsFromInvoice(user, total);

        // 5. Save items
        for (CheckoutItemDTO dto : items) {

            // Handle phone stock
            if ("device".equalsIgnoreCase(dto.getItemType())) {
                if (dto.getPhoneId() == null) {
                    throw new RuntimeException("Phone ID is required for device items.");
                }

                Phone phone = phoneRepository.findById(dto.getPhoneId())
                        .orElseThrow(() -> new RuntimeException("Phone not found"));

                Integer qty = dto.getQuantity() != null ? dto.getQuantity() : 1;

                if (phone.getStockQuantity() == null || phone.getStockQuantity() < qty) {
                    throw new RuntimeException(phone.getModel() + " is out of stock.");
                }

                phone.setStockQuantity(phone.getStockQuantity() - qty);
                phoneRepository.save(phone);
            }

            InvoiceItems item = new InvoiceItems();
            item.setInvoice(saved);
            item.setDescription(dto.getDescription());
            item.setQuantity(dto.getQuantity());
            item.setUnitPrice(BigDecimal.valueOf(dto.getUnitPrice()));
            item.setLineTotal(BigDecimal.valueOf(dto.getLineTotal()));
            item.setDiscountAmount(
                    dto.getDiscountAmount() != null
                            ? BigDecimal.valueOf(dto.getDiscountAmount())
                            : BigDecimal.ZERO
            );

            InvoiceItems savedItem = itemRepo.save(item);

            if (dto.getSubscribers() != null && !dto.getSubscribers().isEmpty()) {
                for (int i = 0; i < dto.getSubscribers().size(); i++) {
                    String fullName = dto.getSubscribers().get(i);

                    InvoiceItemSubscriber subscriber = new InvoiceItemSubscriber();
                    subscriber.setInvoiceItem(savedItem);
                    subscriber.setLineNumber(i + 1);
                    subscriber.setFullName(fullName);

                    subscriberRepo.save(subscriber);
                }
            }
        }

        return saved;
    }
}