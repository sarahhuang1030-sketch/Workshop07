package org.example.controller;

import org.example.dto.QuoteDTO;
import org.example.dto.QuoteRequestDTO;
import org.example.dto.QuoteUpdateDTO;
import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.entity.Quote;
import org.example.repository.InvoiceRepository;
import org.example.repository.PaymentRepository;
import org.example.model.UserAccount;
import org.example.repository.CustomerRepository;
import org.example.repository.QuoteRepository;
import org.example.repository.UserAccountRepository;
import org.example.service.InvoiceService;
import org.example.service.QuoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteRepository repo;
    private final QuoteService quoteService;
    private final InvoiceService invoiceService;
    private final CustomerRepository customerRepo;
    private final UserAccountRepository userAccountRepo;
    private final InvoiceRepository invoiceRepo;
    private final PaymentRepository paymentRepo;

    public QuoteController(
            QuoteRepository repo,
            QuoteService quoteService,
            InvoiceService invoiceService,
            CustomerRepository customerRepo,
            UserAccountRepository userAccountRepo,
            InvoiceRepository invoiceRepo,
            PaymentRepository paymentRepo
    ) {
        this.repo = repo;
        this.quoteService = quoteService;
        this.invoiceService = invoiceService;
        this.customerRepo = customerRepo;
        this.userAccountRepo = userAccountRepo;
        this.invoiceRepo = invoiceRepo;
        this.paymentRepo = paymentRepo;
    }

    // ======================================================
    // GET MY QUOTES (CUSTOMER)
    // ======================================================
    @GetMapping("/my")
    public List<QuoteDTO> getMyQuotes(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        String username = authentication.getName();

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (ua.getCustomerId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a customer");
        }

        List<Quote> quotes = repo.findAllByCustomerId(ua.getCustomerId());

        return quotes.stream().map(this::mapToDTO).toList();
    }

    // ======================================================
    // GET ALL QUOTES
    // ======================================================
    @GetMapping
    public List<QuoteDTO> getAll() {
        return repo.findAll().stream().map(this::mapToDTO).toList();
    }

    // ======================================================
    // GET ONE QUOTE
    // ======================================================
    @GetMapping("/{id}")
    public QuoteDTO getOne(@PathVariable Integer id) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        return mapToDTO(q);
    }

    // ======================================================
    // CREATE QUOTE
    // ======================================================
    @PostMapping
    public ResponseEntity<QuoteDTO> create(@RequestBody QuoteRequestDTO dto) {
        Quote saved = quoteService.createQuote(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(saved));
    }

    // ======================================================
    // UPDATE QUOTE
    // ======================================================
    @PutMapping("/{id}")
    public QuoteDTO update(@PathVariable Integer id, @RequestBody QuoteUpdateDTO dto) {
        Quote updated = quoteService.updateQuote(id, dto);
        return mapToDTO(updated);
    }

    // CANCEL QUOTE
    @PatchMapping("/{id}/cancel")
    public QuoteDTO cancel(@PathVariable Integer id) {
        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING quotes can be cancelled");
        }

        q.setStatus("CANCELLED");
        Quote saved = repo.save(q);
        return mapToDTO(saved);
    }

    // APPROVE QUOTE (Status only → Pay later)
    @PatchMapping("/{id}/approve")
    public ResponseEntity<QuoteDTO> approve(@PathVariable Integer id) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING quotes can be approved");
        }

        // 1. APPROVE
        q.setStatus("APPROVED");
        repo.save(q);

        // 2. RETURN QUOTE DTO
        return ResponseEntity.ok(mapToDTO(q));
    }

    // Decline QUOTE
    @PatchMapping("/{id}/decline")
    public ResponseEntity<QuoteDTO> decline(@PathVariable Integer id) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus()) &&
                !"APPROVED".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING or APPROVED quotes can be declined");
        }

        q.setStatus("DECLINED");
        repo.save(q);
        return ResponseEntity.ok(mapToDTO(q));
    }

    // resend QUOTE
    @PatchMapping("/{id}/resend")
    public ResponseEntity<QuoteDTO> resend(@PathVariable Integer id) {
        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"DECLINED".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only DECLINED quotes can be resent");
        }

        q.setStatus("PENDING");
        repo.save(q);
        return ResponseEntity.ok(mapToDTO(q));
    }

    // ======================================================
    // DTO MAPPER (COMMON)
    // ======================================================
    private QuoteDTO mapToDTO(Quote q) {

        QuoteDTO dto = new QuoteDTO();

        dto.setId(q.getId());
        dto.setCustomerId(q.getCustomerId());
        dto.setPlanId(q.getPlanId());
        dto.setAmount(q.getAmount());
        dto.setStatus(q.getStatus());
        dto.setCreatedAt(q.getCreatedAt() != null ? q.getCreatedAt().toString() : null);
        dto.setInvoiceId(q.getInvoiceId());

        if (q.getInvoiceId() != null) {
            invoiceRepo.findById(q.getInvoiceId()).ifPresent(inv -> {
                dto.setInvoiceNumber(inv.getInvoiceNumber());
                paymentRepo.findByInvoiceId(inv.getInvoiceId()).stream()
                        .findFirst()
                        .ifPresent(p -> {
                            dto.setPaymentDate(p.getPaymentDate() != null ? p.getPaymentDate().toString() : null);
                        });
            });
        }

        String name = customerRepo.findById(q.getCustomerId())
                .map(c -> c.getFirstName() + " " + c.getLastName())
                .orElse("Unknown");

        dto.setCustomerName(name);

        if (q.getAddons() != null) {
            dto.setAddonIds(
                    q.getAddons().stream()
                            .map(a -> a.getAddonId())
                            .toList()
            );
        }

        return dto;
    }
}