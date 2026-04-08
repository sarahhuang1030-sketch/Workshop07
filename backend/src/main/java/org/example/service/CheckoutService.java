package org.example.service;

import org.example.model.CustomerAddress;
import org.example.model.Subscription;
import org.example.model.SubscriptionAddOn;

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
    private final CustomerAddressRepository addressRepo;
    private final SubscriptionRepository subscriptionRepo;
    private final SubscriptionAddOnRepository subscriptionAddOnRepo;
    private final QuoteRepository quoteRepo;

    public CheckoutService(
            InvoiceRepository invoiceRepo,
            InvoiceItemRepository itemRepo,
            InvoiceItemSubscriberRepository subscriberRepo,
            PaymentAccountRepository accountRepo,
            UserAccountRepository userRepo,
            PhoneRepository phoneRepository,
            StripePaymentService stripePaymentService,
            RewardService rewardService,
            PaymentRepository paymentRepo,
            CustomerAddressRepository addressRepo,
            SubscriptionRepository subscriptionRepo,
            SubscriptionAddOnRepository subscriptionAddOnRepo,
            QuoteRepository quoteRepo
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
        this.addressRepo = addressRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.subscriptionAddOnRepo = subscriptionAddOnRepo;
        this.quoteRepo = quoteRepo;
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
            Integer quoteId,
            List<CheckoutItemDTO> items,
            String street1,
            String street2,
            String city,
            String province,
            String postalCode,
            String country
    ) throws Exception {

        // ======================================================
        // 1. STRIPE CHECK
        // ======================================================
        PaymentIntent intent = stripePaymentService.retrievePaymentIntent(paymentIntentId);

        if (!"succeeded".equals(intent.getStatus())) {
            throw new Exception("Payment not completed");
        }

        // ======================================================
        // 2. USER
        // ======================================================
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        UserAccount user = userRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new Exception("User not found"));

        // ======================================================
        // 3. OPTIONAL ADDRESS UPDATE
        // ======================================================
        if (street1 != null && !street1.isEmpty() && user.getCustomerId() != null) {

            CustomerAddress address = addressRepo
                    .findByCustomerIdAndAddressType(user.getCustomerId(), "Billing")
                    .orElse(new CustomerAddress());

            address.setCustomerId(user.getCustomerId());
            address.setAddressType("Billing");
            address.setStreet1(street1);
            address.setStreet2(street2);
            address.setCity(city);
            address.setProvince(province);
            address.setPostalCode(postalCode);
            address.setCountry(country);
            address.setIsPrimary(1);

            addressRepo.save(address);
        }

        // ======================================================
        // 4. QUOTE FLOW (OPTIONAL)
        // ======================================================
        if (quoteId != null) {
            Quote q = quoteRepo.findById(quoteId)
                    .orElseThrow(() -> new RuntimeException("Quote not found"));

            if (!"APPROVED".equalsIgnoreCase(q.getStatus())) {
                throw new RuntimeException("Quote must be APPROVED before payment");
            }

            q.setStatus("PAID");
            quoteRepo.save(q);
        }

        // ======================================================
        // 5. PAYMENT ACCOUNT
        // ======================================================
        PaymentAccounts account = null;

        if (paymentAccountId != null) {
            account = accountRepo.findById(paymentAccountId)
                    .orElseThrow(() -> new RuntimeException("Payment method not found"));

            if (!account.getCustomerId().equals(user.getCustomerId())) {
                throw new RuntimeException("Unauthorized payment method");
            }
        }

        // ======================================================
        // 6. INVOICE CREATE / UPDATE
        // ======================================================
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
        LocalDate dueDate = "yearly".equalsIgnoreCase(billingCycle)
                ? issueDate.plusYears(1)
                : issueDate.plusMonths(1);

        invoice.setDueDate(dueDate);
        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(tax);
        invoice.setTotal(total);
        invoice.setPromoCode(promoCode);
        invoice.setStatus("PAID");
        invoice.setPaidByAccount(account);
        invoice.setStripePaymentIntentId(paymentIntentId);

        Invoices saved = invoiceRepo.save(invoice);

        // ======================================================
        // 7. SUBSCRIPTION + ADDONS
        // ======================================================
        Integer subscriptionId = null;

        for (CheckoutItemDTO dto : items) {
            if ("plan".equalsIgnoreCase(dto.getItemType())) {
                Subscription sub = new Subscription();
                sub.setCustomerId(user.getCustomerId());
                sub.setPlanId(dto.getId());
                sub.setStartDate(LocalDate.now());
                sub.setStatus("ACTIVE");

                sub = subscriptionRepo.save(sub);
                subscriptionId = sub.getSubscriptionId();
            }
        }

        if (subscriptionId != null) {
            saved.setSubscriptionId(subscriptionId);
            invoiceRepo.save(saved);

            for (CheckoutItemDTO dto : items) {
                if ("addon".equalsIgnoreCase(dto.getItemType())) {
                    SubscriptionAddOn sao = new SubscriptionAddOn();
                    sao.setSubscriptionId(subscriptionId);
                    sao.setAddOnId(dto.getId());
                    sao.setStartDate(LocalDate.now());
                    sao.setStatus("ACTIVE");
                    subscriptionAddOnRepo.save(sao);
                }
            }
        }

        // ======================================================
        // 8. PAYMENT RECORD
        // ======================================================
        Payments payment = new Payments();
        payment.setInvoiceId(saved.getInvoiceId());
        payment.setCustomerId(user.getCustomerId());
        payment.setAmount(BigDecimal.valueOf(total));
        payment.setPaymentDate(java.time.LocalDateTime.now());
        payment.setMethod(account != null ? account.getMethod() : "Stripe");
        payment.setStatus("SUCCESS");

        paymentRepo.save(payment);

        rewardService.addPointsFromInvoice(user, total);

        // ======================================================
        // 9. ITEMS + STOCK + SUBSCRIBERS
        // ======================================================
        for (CheckoutItemDTO dto : items) {

            if ("device".equalsIgnoreCase(dto.getItemType())) {

                Phone phone = phoneRepository.findById(dto.getPhoneId())
                        .orElseThrow(() -> new RuntimeException("Phone not found"));

                int qty = dto.getQuantity() != null ? dto.getQuantity() : 1;

                if (phone.getStockQuantity() == null || phone.getStockQuantity() < qty) {
                    throw new RuntimeException("Out of stock: " + phone.getModel());
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

            if (dto.getSubscribers() != null) {
                for (int i = 0; i < dto.getSubscribers().size(); i++) {
                    InvoiceItemSubscriber s = new InvoiceItemSubscriber();
                    s.setInvoiceItem(savedItem);
                    s.setLineNumber(i + 1);
                    s.setFullName(dto.getSubscribers().get(i));
                    subscriberRepo.save(s);
                }
            }
        }

        return saved;
    }
}