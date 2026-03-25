package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.security.core.Authentication;
import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{invoiceNumber}")
    public ResponseEntity<InvoiceDTO> getInvoice(@PathVariable String invoiceNumber) {
        Invoices invoice = invoiceService.findByInvoiceNumber(invoiceNumber);
        if (invoice == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(invoiceService.convertToDTO(invoice));
    }

    @GetMapping("/latest")
    public ResponseEntity<InvoiceDTO> getLatestInvoice(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(username).orElse(null);
        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(404).body(null);
        }

        Integer customerId = ua.getCustomerId();
        Invoices latestInvoice = invoiceService.findLatestByCustomerId(customerId);

        if (latestInvoice == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(invoiceService.convertToDTO(latestInvoice));
    }
}