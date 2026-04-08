package org.example.controller;

import org.example.dto.QuoteDTO;
import org.example.dto.QuoteRequestDTO;
import org.example.dto.QuoteUpdateDTO;
import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.entity.Quote;
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

    public QuoteController(
            QuoteRepository repo,
            QuoteService quoteService,
            InvoiceService invoiceService,
            CustomerRepository customerRepo,
            UserAccountRepository userAccountRepo
    ) {
        this.repo = repo;
        this.quoteService = quoteService;
        this.invoiceService = invoiceService;
        this.customerRepo = customerRepo;
        this.userAccountRepo = userAccountRepo;
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
    public Quote create(@RequestBody QuoteRequestDTO dto) {
        return quoteService.createQuote(dto);
    }

    // ======================================================
    // UPDATE QUOTE
    // ======================================================
    @PutMapping("/{id}")
    public Quote update(@PathVariable Integer id,
                        @RequestBody QuoteUpdateDTO dto) {
        return quoteService.updateQuote(id, dto);
    }

    // ======================================================
    // CANCEL QUOTE
    // ======================================================
    @PatchMapping("/{id}/cancel")
    public Quote cancel(@PathVariable Integer id) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING quotes can be cancelled");
        }

        q.setStatus("CANCELLED");
        return repo.save(q);
    }

    // ======================================================
    // APPROVE QUOTE (FULL FLOW → INVOICE CREATED)
    // ======================================================
    @PatchMapping("/{id}/approve")
    public ResponseEntity<InvoiceDTO> approve(@PathVariable Integer id) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING quotes can be approved");
        }

        // 1. APPROVE
        q.setStatus("APPROVED");
        repo.save(q);

        // 2. CREATE INVOICE
        Invoices inv = invoiceService.createFromQuote(q);

        // 3. UPDATE QUOTE
        q.setInvoiceId(inv.getInvoiceId());
        q.setStatus("INVOICED");
        repo.save(q);

        // 4. RETURN INVOICE DTO
        return ResponseEntity.ok(invoiceService.convertToDTO(inv));
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