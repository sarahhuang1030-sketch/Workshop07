package org.example.controller;

import org.example.entity.Invoices;
import org.example.entity.Quote;
import org.example.repository.QuoteRepository;
import org.example.service.InvoiceService;
import org.example.dto.InvoiceDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Sales Quote Controller
 * SaaS Flow:
 * CREATE → PENDING → APPROVE → INVOICE
 */
@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteRepository repo;
    private final InvoiceService invoiceService;

    public QuoteController(QuoteRepository repo, InvoiceService invoiceService) {
        this.repo = repo;
        this.invoiceService = invoiceService;
    }

    // ======================================================
    // GET ALL QUOTES
    // ======================================================
    @GetMapping
    public List<Quote> getAll() {
        return repo.findAll();
    }

    // ======================================================
    // CREATE QUOTE
    // ======================================================
    @PostMapping
    public Quote createQuote(@RequestBody Quote q) {

        q.setStatus("PENDING");
        return repo.save(q);
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
    // APPROVE QUOTE → CREATE INVOICE
    // ======================================================
    @PatchMapping("/{id}/approve")
    public ResponseEntity<InvoiceDTO> approve(@PathVariable Integer id) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        // Validate state
        if (!"PENDING".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING quotes can be approved");
        }

        // Step 1: update quote status
        q.setStatus("APPROVED");
        repo.save(q);

        // Step 2: create invoice from quote
        Invoices inv = invoiceService.createFromQuote(q);

        // Step 3: link invoice back to quote
        q.setInvoiceId(inv.getInvoiceId());
        q.setStatus("INVOICED");

        repo.save(q);

        // Step 4: return invoice DTO
        return ResponseEntity.ok(invoiceService.convertToDTO(inv));
    }
}