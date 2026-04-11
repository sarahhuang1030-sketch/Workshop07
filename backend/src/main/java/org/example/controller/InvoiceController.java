package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.example.dto.InvoiceDTO;
import org.example.entity.Invoices;
import org.example.service.InvoiceService;
import org.example.dto.InvoiceRequestDTO;
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

    // ADMIN: get all invoices
    @GetMapping("/admin/all")
    public ResponseEntity<List<InvoiceDTO>> getAllInvoicesAdmin() {
        List<Invoices> invoices = invoiceService.findAllInvoices();
        List<InvoiceDTO> dtos = invoices.stream()
                .map(invoiceService::convertToDTO)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // USER: get latest invoice
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

    // USER: get all invoices
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

    // Get invoice by number
    @GetMapping("/{invoiceNumber}")
    public ResponseEntity<InvoiceDTO> getInvoice(@PathVariable String invoiceNumber) {
        Invoices invoice = invoiceService.findByInvoiceNumber(invoiceNumber);
        if (invoice == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(invoiceService.convertToDTO(invoice));
    }

    // Get invoices (AUTO by role)
    @GetMapping("/all")
    public ResponseEntity<List<InvoiceDTO>> getInvoices(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated())
            return ResponseEntity.status(401).build();

        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(authentication.getName())
                .orElse(null);

        if (ua == null)
            return ResponseEntity.status(404).build();

        List<Invoices> invoices;

//        if (ua.getRole() != null && !ua.getRole().equalsIgnoreCase("Customer")) {
        if (ua.getRole() != null && !"Customer".equalsIgnoreCase(ua.getRole().getRoleName())) {
            invoices = invoiceService.findAllInvoices();
        } else {
            if (ua.getCustomerId() == null)
                return ResponseEntity.status(403).build();

            invoices = invoiceService.findAllByCustomerId(ua.getCustomerId());
        }

        List<InvoiceDTO> dtos = invoices.stream()
                .map(invoiceService::convertToDTO)
                .toList();

        return ResponseEntity.ok(dtos);
    }
    @GetMapping("/search")
    public ResponseEntity<List<InvoiceDTO>> searchInvoices(
            @RequestParam(required = false) String keyword,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated())
            return ResponseEntity.status(401).build();

        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(authentication.getName())
                .orElse(null);

        if (ua == null)
            return ResponseEntity.status(404).build();

        List<Invoices> invoices;

        if (ua.getRole() != null &&
                !"Customer".equalsIgnoreCase(ua.getRole().getRoleName())) {
            invoices = invoiceService.findAllInvoices();
        } else {
            invoices = invoiceService.findAllByCustomerId(ua.getCustomerId());
        }

        String kw = (keyword == null) ? "" : keyword.trim().toLowerCase();

        List<InvoiceDTO> result = invoices.stream()
                .map(invoiceService::convertToDTO)
                .filter(dto ->
                        (dto.invoiceNumber != null &&
                                dto.invoiceNumber.toLowerCase().contains(kw))
                                || (dto.getCustomerName() != null &&
                                dto.getCustomerName().toLowerCase().contains(kw))
                )
                .toList();

        return ResponseEntity.ok(result);
    }

    // ===== CRUD for manager =====

    @PostMapping("/admin")
    public ResponseEntity<InvoiceDTO> createInvoice(@RequestBody InvoiceRequestDTO body) {
        Invoices saved = invoiceService.createInvoice(body);
        return ResponseEntity.ok(invoiceService.convertToDTO(saved));
    }

    @PutMapping("/admin/{invoiceNumber}")
    public ResponseEntity<InvoiceDTO> updateInvoice(@PathVariable String invoiceNumber,
                                                    @RequestBody InvoiceRequestDTO body) {
        Invoices saved = invoiceService.updateInvoice(invoiceNumber, body);
        if (saved == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(invoiceService.convertToDTO(saved));
    }

    @DeleteMapping("/admin/{invoiceNumber}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable String invoiceNumber) {
        boolean deleted = invoiceService.deleteInvoice(invoiceNumber);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}