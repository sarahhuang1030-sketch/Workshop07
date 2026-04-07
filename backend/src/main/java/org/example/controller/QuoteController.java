package org.example.controller;

import org.example.dto.QuoteDTO;
import org.example.dto.QuoteRequestDTO;
import org.example.dto.QuoteUpdateDTO;
import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.entity.Quote;
import org.example.repository.CustomerRepository;
import org.example.repository.QuoteRepository;
import org.example.service.InvoiceService;
import org.example.service.QuoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Quote Controller (Enterprise REST version)
 *
 * Flow:
 * CREATE → PENDING → UPDATE → APPROVE → INVOICE
 */
@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteRepository repo;
    private final QuoteService quoteService;
    private final InvoiceService invoiceService;
    private final CustomerRepository customerRepo;

    public QuoteController(
            QuoteRepository repo,
            QuoteService quoteService,
            InvoiceService invoiceService,
            CustomerRepository customerRepo
    ) {
        this.repo = repo;
        this.quoteService = quoteService;
        this.invoiceService = invoiceService;
        this.customerRepo = customerRepo;
    }

    // ======================================================
    // GET ALL QUOTES
    // ======================================================
    @GetMapping
    public List<QuoteDTO> getAll() {

        List<Quote> quotes = repo.findAll();

        return quotes.stream().map(q -> {

            QuoteDTO dto = new QuoteDTO();
            dto.setId(q.getId());
            dto.setCustomerId(q.getCustomerId());
            dto.setAmount(q.getAmount());
            dto.setStatus(q.getStatus());

            String name = customerRepo.findById(q.getCustomerId())
                    .map(c -> c.getFirstName() + " " + c.getLastName())
                    .orElse("Unknown");

            dto.setCustomerName(name);

            return dto;
        }).toList();
    }

    // ======================================================
    // GET SINGLE QUOTE
    // ======================================================
    @GetMapping("/{id}")
    public Quote getOne(@PathVariable Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));
    }

    // ======================================================
    // CREATE QUOTE (DTO VERSION - RECOMMENDED)
    // ======================================================
    @PostMapping
    public Quote create(@RequestBody QuoteRequestDTO dto) {
        return quoteService.createQuote(dto);
    }

    // ======================================================
    // UPDATE QUOTE (DTO VERSION)
    // Only PENDING quotes can be updated
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
    // APPROVE QUOTE → CREATE INVOICE
    // ======================================================
    @PatchMapping("/{id}/approve")
    public ResponseEntity<InvoiceDTO> approve(@PathVariable Integer id) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING quotes can be approved");
        }

        // Step 1: mark approved
        q.setStatus("APPROVED");
        repo.save(q);

        // Step 2: create invoice
        Invoices inv = invoiceService.createFromQuote(q);

        // Step 3: update quote → invoiced
        q.setInvoiceId(inv.getInvoiceId());
        q.setStatus("INVOICED");
        repo.save(q);

        // Step 4: return invoice DTO
        return ResponseEntity.ok(invoiceService.convertToDTO(inv));
    }
}