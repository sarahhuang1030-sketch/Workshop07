package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final UserAccountRepository userAccountRepo;

    public InvoiceController(InvoiceService invoiceService,
                             UserAccountRepository userAccountRepo) {
        this.invoiceService = invoiceService;
        this.userAccountRepo = userAccountRepo;
    }

    // =========================
    // ADMIN: get all invoices
    // =========================
    @GetMapping("/admin/all")
    public ResponseEntity<List<InvoiceDTO>> getAllInvoicesAdmin() {
        List<Invoices> invoices = invoiceService.findAllInvoices();
        List<InvoiceDTO> dtos = invoices.stream()
                .map(invoiceService::convertToDTO)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // =========================
    // USER: get latest invoice
    // =========================
    @GetMapping("/latest")
    public ResponseEntity<InvoiceDTO> getLatestInvoice(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();

        String username = authentication.getName();
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(username).orElse(null);
        if (ua == null || ua.getCustomerId() == null) return ResponseEntity.status(404).body(null);

        Invoices latestInvoice = invoiceService.findLatestByCustomerId(ua.getCustomerId());
        if (latestInvoice == null) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(invoiceService.convertToDTO(latestInvoice));
    }

    // =========================
    // USER: get all invoices
    // =========================
    @GetMapping("/user/all")
    public ResponseEntity<List<InvoiceDTO>> getAllInvoicesUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.status(401).build();

        String username = authentication.getName();
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(username).orElse(null);
        if (ua == null || ua.getCustomerId() == null) return ResponseEntity.status(404).body(null);

        List<Invoices> invoices = invoiceService.findAllByCustomerId(ua.getCustomerId());
        List<InvoiceDTO> dtos = invoices.stream()
                .map(invoiceService::convertToDTO)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    // =========================
    // Get invoice by number
    // =========================
    @GetMapping("/{invoiceNumber}")
    public ResponseEntity<InvoiceDTO> getInvoice(@PathVariable String invoiceNumber) {
        Invoices invoice = invoiceService.findByInvoiceNumber(invoiceNumber);
        if (invoice == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(invoiceService.convertToDTO(invoice));
    }
}