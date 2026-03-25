package org.example.controller;

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

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
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

        Integer customerId = 1;

        Invoices latestInvoice = invoiceService.findLatestByCustomerId(customerId);
        if (latestInvoice == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(invoiceService.convertToDTO(latestInvoice));
    }
}