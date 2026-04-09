package org.example.service;

import org.example.dto.AddOnDTO;
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
    private final PlanRepository planRepository;
    private final AddOnRepository addOnRepository;

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
            QuoteRepository quoteRepo,
            PlanRepository planRepository,
            AddOnRepository addOnRepository
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
        this.planRepository = planRepository;
        this.addOnRepository = addOnRepository;
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
        Quote quote = null;
        if (quoteId != null) {
            quote = quoteRepo.findById(quoteId)
                    .orElseThrow(() -> new RuntimeException("Quote not found"));

            if (!"APPROVED".equalsIgnoreCase(quote.getStatus())) {
                throw new RuntimeException("Quote must be APPROVED before payment");
            }

            quote.setStatus("PAID");
            // Linkage will happen later once invoice is created
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
            if (quote != null) {
                invoice.setQuoteId(quote.getId());
                invoice.setSource("QUOTE");
            } else {
                invoice.setSource("CART");
            }
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

        if (quote != null) {
            quote.setInvoiceId(saved.getInvoiceId());
            quoteRepo.save(quote);
        }

        // ======================================================
        // 7. SUBSCRIPTION + ADDONS
        // ======================================================
        Integer subscriptionId = null;

        if (quote != null) {
            Subscription sub = new Subscription();
            sub.setCustomerId(user.getCustomerId());
            sub.setPlanId(quote.getPlanId());
            sub.setStartDate(LocalDate.now());
            sub.setStatus("ACTIVE");
            sub = subscriptionRepo.save(sub);
            subscriptionId = sub.getSubscriptionId();

            if (quote.getAddons() != null) {
                for (QuoteAddOn qao : quote.getAddons()) {
                    SubscriptionAddOn sao = new SubscriptionAddOn();
                    sao.setSubscriptionId(subscriptionId);
                    sao.setAddOnId(qao.getAddonId());
                    sao.setStartDate(LocalDate.now());
                    sao.setStatus("ACTIVE");
                    subscriptionAddOnRepo.save(sao);
                }
            }
        }

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
        payment.setMethod(account != null ? account.getMethod() : "Visa");
        payment.setStatus("Completed");

        paymentRepo.save(payment);

        rewardService.addPointsFromInvoice(user, total);

        // ======================================================
        // 8.4 ADD QUOTE ITEMS TO INVOICE (NEW)
        // ======================================================
        if (quote != null) {
            final Invoices currentInvoice = saved;
            final Quote currentQuote = quote;
            // Plan Item
            planRepository.findAllPlans().stream()
                    .filter(p -> p.planId() == currentQuote.getPlanId())
                    .findFirst()
                    .ifPresent(plan -> {
                        InvoiceItems planItem = new InvoiceItems();
                        planItem.setInvoice(currentInvoice);
                        planItem.setDescription(plan.planName());
                        planItem.setQuantity(1);
                        planItem.setUnitPrice(BigDecimal.valueOf(plan.monthlyPrice()));
                        planItem.setLineTotal(BigDecimal.valueOf(plan.monthlyPrice()));
                        planItem.setDiscountAmount(BigDecimal.ZERO);
                        itemRepo.save(planItem);
                    });

            // Addon Items
            if (quote.getAddons() != null) {
                for (QuoteAddOn qao : quote.getAddons()) {
                    AddOnDTO addon = addOnRepository.findById(qao.getAddonId());
                    if (addon != null) {
                        InvoiceItems addonItem = new InvoiceItems();
                        addonItem.setInvoice(currentInvoice);
                        addonItem.setDescription(addon.addOnName());
                        addonItem.setQuantity(1);
                        addonItem.setUnitPrice(BigDecimal.valueOf(addon.monthlyPrice()));
                        addonItem.setLineTotal(BigDecimal.valueOf(addon.monthlyPrice()));
                        addonItem.setDiscountAmount(BigDecimal.ZERO);
                        itemRepo.save(addonItem);
                    }
                }
            }
        }

        // ======================================================
        // 8.5 WATER BILL (NEW)
        // ======================================================
//        if (quote != null || !items.isEmpty()) {
//            InvoiceItems waterItem = new InvoiceItems();
//            waterItem.setInvoice(saved);
//            waterItem.setDescription("Water Bill Fee");
//            waterItem.setQuantity(1);
//
//            double baseForWater = subtotal;
//            if (quote != null && (items == null || items.isEmpty())) {
//                baseForWater = quote.getAmount();
//            }
//
//            BigDecimal waterAmount = BigDecimal.valueOf(baseForWater * 0.05); // 5% fee
//            waterItem.setUnitPrice(waterAmount);
//            waterItem.setLineTotal(waterAmount);
//            waterItem.setDiscountAmount(BigDecimal.ZERO);
//            itemRepo.save(waterItem);
//        }

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