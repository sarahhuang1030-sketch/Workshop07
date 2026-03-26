package org.example.controller;

import org.example.entity.Quote;
import org.example.repository.QuoteRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller for managing sales quotes.
 */
@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteRepository repo;

    public QuoteController(QuoteRepository repo) {
        this.repo = repo;
    }

    /**
     * Create a new quote
     */
    @PostMapping
    public Quote create(@RequestBody Quote q) {
        q.setStatus("PENDING");
        q.setCreatedAt(LocalDateTime.now());
        return repo.save(q);
    }

    /**
     * Get all quotes
     */
    @GetMapping
    public List<Quote> getAll() {
        return repo.findAll();
    }

    /**
     * Approve a quote
     */
    @PatchMapping("/{id}/approve")
    public Quote approve(@PathVariable Integer id) {
        Quote q = repo.findById(id).orElseThrow();
        q.setStatus("APPROVED");
        return repo.save(q);
    }
}